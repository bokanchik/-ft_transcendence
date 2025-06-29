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

const neSupprimePasStpCommente: string = `
	INSERT INTO matches( matchId, player1_id, player2_id, player1_socket, player2_socket, player1_score, player2_score, winner_id, status)
	VALUES
	('match1', 1, 2, 'socket1', 'socket2', 10, 8, 1, 'finished'),
	('match2', 1, 3, 'socket3', 'socket4', 10, 9, 1, 'finished'),
	('match3', 1, 4, 'socket5', 'socket6', 8, 10, 4, 'finished'),
	('match4', 1, 5, 'socket13', 'socket14', 10, 0, 1, 'finished'),
	('match5', 1, 6, 'socket15', 'socket16', 6, 10, 6, 'finished'),
	('match6', 1, 7, 'socket17', 'socket18', 8, 10, 7, 'finished'),
	('match7', 1, 8, 'socket19', 'socket20', 5, 10, 8, 'finished'),
	('match8', 2, 3, 'socket7', 'socket8', 5, 10, 3, 'finished'),
	('match9', 2, 4, 'socket9', 'socket10', 10, 0, 2, 'finished'),
	('match10', 2, 5, 'socket11', 'socket12', 10, 0, 2, 'finished'),
	('match11', 2, 6, 'socket21', 'socket22', 0, 10, 6, 'finished'),
	('match12', 5, 6, 'socket23', 'socket24', 0, 10, 6, 'finished'),
	('match13', 5, 7, 'socket25', 'socket26', 0, 10, 7, 'finished'),
	('match14', 5, 8, 'socket27', 'socket28', 0, 10, 8, 'finished'),
	('match15', 6, 7, 'socket29', 'socket30', 0, 10, 7, 'finished'),
	('match16', 6, 8, 'socket31', 'socket32', 0, 10, 8, 'finished'),
	('match17', 7, 8, 'socket33', 'socket34', 0, 10, 8, 'finished');`;

// --- HELPER FUNCTIONS FOR GENERAL DB ACTIONS (all(), get(), run(), exec() etc.)
export async function createMatchTable() {
	try {
		await execute(db, matchTable);
		console.log('Matches table created or already exists.');
		await execute(db, neSupprimePasStpCommente);
		console.log('Sample matches inserted into the table.');

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
