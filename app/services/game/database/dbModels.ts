import db from './connectDB.ts';
import { updatePlayerStats } from '../utils/apiClient.ts';

type MatchStatus = 'pending' | 'in_progress' | 'finished';

const matchTable: string = `
	CREATE TABLE IF NOT EXISTS matches (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	matchId TEXT UNIQUE NOT NULL,
	player1_id INTEGER NOT NULL,
	player2_id INTEGER NOT NULL,
	player1_socket TEXT NOT NULL,
	player2_socket TEXT NOT NULL,
	player1_score INTEGER,
	player2_score INTEGER,
	winner_id INTEGER,
	win_type TEXT DEFAULT 'score',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'finished'))
	)`;


// --- HELPER FUNCTIONS FOR GENERAL DB ACTIONS (all(), get(), run(), exec() etc.)
export async function createMatchTable() {
	try {
		await execute(db, matchTable);
		console.log('Matches table created or already exists.');

	} catch (err: unknown) {
		console.error(`Error creating matches table: ${err}`);
		throw err;
	}
};

// pourquoi winner_id est une string ? 
export async function setGameResult(matchId: string, player1_score: number, player2_score: number, winner_id: string, win_type: string) {
	
	const existingMatch = await getRowByMatchId(matchId);

	if (!existingMatch) {
		throw new Error(`Match with id ${matchId} does not exists in DB.`);
	}

	if (existingMatch.status === 'finished') {
		throw new Error(`Match with id ${matchId} is already finished.`);
	}
	
	// Update player stats in the database
	const winnerId = parseInt(winner_id, 10);
	const loserId = (winner_id === existingMatch.player1_id) ? existingMatch.player2_id : existingMatch.player1_id;

	await updatePlayerStats(winnerId, 'win');
	await updatePlayerStats(loserId, 'loss');

	const sql = `
	UPDATE matches
	SET player1_score = ?,
		player2_score = ?,
		winner_id = ?,
		win_type = ?,
		status = 'finished'
	WHERE matchId = ? `;

	const params = [
		player1_score,
		player2_score,
		winner_id,
		win_type,
		matchId
	];

	try {
		await execute(db, sql, params);

		// --- FOR DEBUGGING ----
		console.log(`\x1b[32m Game result saved for match ${matchId} \x1b[0m`);
		getRowByMatchId(matchId);
		// ----------------------

	} catch (err: unknown) {
		console.error(`Failed to insert game result to DB: ${err} `);
		throw err;
	}

}

export async function insertMatchToDB({ matchId, player1_id, player2_id, player1_socket, player2_socket }:
	{ matchId: string, player1_id: number, player2_id: number, player1_socket: string, player2_socket: string }) {

	const sql = `
INSERT INTO matches(
		matchId,
		player1_id,
		player2_id,
		player1_socket,
		player2_socket,
		status
	) VALUES(?, ?, ?, ?, ?, ?)`;

	const params = [
		matchId,
		player1_id,
		player2_id,
		player1_socket,
		player2_socket,
		'in_progress'
	];

	try {
		await execute(db, sql, params);

		// --- FOR DEBUGGING ----
		console.log(`\x1b[32m Match ${matchId} inserted to DB \x1b[0m`);
		getRowByMatchId(matchId);
		// ----------------------

	} catch (err: unknown) {
		console.log(`Failed to insert match into DB ${err} `);
		throw err;
	}
}

export async function getMatchesByUserId(userId: number) {
	const sql = `
	SELECT * FROM matches
	WHERE player1_id = ? OR player2_id = ?
		ORDER BY created_at DESC
	`;

	try {
		const matches = await fetchAll(db, sql, [userId, userId]);
		console.log(`All fetched matches for ${userId} : ${JSON.stringify(matches)}`);
		return matches;

	} catch (err: unknown) {
		console.log(`Failed to find matches for this user: ${err} `);
		throw err;
	}
}

export async function getRowByMatchId(matchId: string) {

	let sql = `SELECT * FROM matches WHERE matchId = ? `;

	try {
		const match = await fetchFirst(db, sql, [matchId]);
		console.log(`Match ${matchId} : ${match}`);
		return match;

	} catch (err: unknown) {
		console.log(`Failed to retrieve a row from DB ${err} `);
		throw err;
	}
}

// peut-etre a enlever
export async function updateStatus(status: MatchStatus, matchId: string) {
	
	let sql = `UPDATE matches SET status = ? WHERE matchId = ? `;
	
	try {
		await execute(db, sql, [status, matchId]);
		console.log(`Status for match ${matchId} updated to ${status} `);
	} catch (err: unknown) {
		console.log(`Failed to update status: ${err} `);
		throw err;
	}
}

// helper function for debugging purpose
export async function getAllRows() {

	let sql = `SELECT * FROM matches`;

	try {
		const matches = await fetchAll(db, sql, []);
		console.log(matches);
	} catch (err: unknown) {
		console.log(`Failed to retrieve all rows from DB: ${err} `);
	}
}

export async function deleteRow(id: number) {

	let sql = `DELETE FROM matches WHERE id = ? `;
	
	try {
		await execute(db, sql, [id]);
		console.log(`Match ${id} deleted from DB`);
	} catch (err: unknown) {
		console.log(`Failed to delete match ${id} from DB: ${err} `);
		throw err
	}
}

// --- WRAPPERS FOR DB ACTIONS ---
export const execute = async (db: any, sql: string, params: any[] = []): Promise<void> => {
	// to execute an INSERT statement or UPDATE
	if (params && params.length > 0) {
		return new Promise<void>((resolve, reject) => {
			db.run(sql, params, (err: Error | null) => {
				if (err) reject(err);
				resolve();
			});
		});
	}
	return new Promise<void>((resolve, reject) => {
		db.exec(sql, (err: Error | null) => {
			if (err) reject(err);
			resolve();
		});
	});
};

export const fetchAll = async (db: any, sql: string, params: any[]): Promise<any[]> => {
	return new Promise<any[]>((resolve, reject) => {
		db.all(sql, params, (err: Error | null, rows: any) => {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

export const fetchFirst = async (db: any, sql: string, params: any): Promise<any> => {
	return new Promise<any>((resolve, reject) => {
		// check if row: any ? or better type
		db.get(sql, params, (err: Error | null, row: any) => {
			if (err) reject(err);
			resolve(row);
		});
	});
}
