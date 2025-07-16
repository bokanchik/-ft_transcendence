import db from './connectDB.ts';
import { updatePlayerStats } from '../utils/apiClient.ts';

type MatchStatus = 'pending' | 'in_progress' | 'finished';

const matchTable: string = `
	CREATE TABLE IF NOT EXISTS matches (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	matchId TEXT UNIQUE NOT NULL,
	tournament_id TEXT,
	round_number INTEGER,
	player1_id INTEGER NOT NULL,
	player2_id INTEGER NOT NULL,
	player1_socket TEXT,
	player2_socket TEXT,
	player1_score INTEGER,
	player2_score INTEGER,
	winner_id INTEGER,
	win_type TEXT DEFAULT 'score',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'finished')),
	FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL
	)`;

const neSupprimePasStpCommente: string = `
	INSERT OR IGNORE INTO matches( matchId, player1_id, player2_id, player1_socket, player2_socket, player1_score, player2_score, winner_id, status)
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

export async function createMatchTable() {
	try {
		await execute(db, matchTable);
		await execute(db, neSupprimePasStpCommente);
		console.log('All tables created or already exist.');

	} catch (err: unknown) {
		console.error(`Error creating matches table: ${err}`);
		throw err;
	}
};

export async function setGameResult(matchId: string, player1_score: number, player2_score: number, winner_id: number, win_type: string) {
	const existingMatch = await getRowByMatchId(matchId);
	if (!existingMatch) {
		throw new Error(`Match with id ${matchId} does not exists in DB.`);
	}
	if (existingMatch.status === 'finished') {
		console.warn(`Match with id ${matchId} is already finished.`);
		return;
	}
	
	const loserId = winner_id === existingMatch.player1_id ? existingMatch.player2_id : existingMatch.player1_id;
	if (winner_id === loserId) {
		console.error(`Winner and loser are the same for match ${matchId}`);
		return;
	}

	await updatePlayerStats(winner_id, 'win');
	await updatePlayerStats(loserId, 'loss');

	const sql = `
	UPDATE matches
	SET player1_score = ?, player2_score = ?, winner_id = ?, win_type = ?, status = 'finished'
	WHERE matchId = ? `;
	await execute(db, sql, [player1_score, player2_score, winner_id, win_type, matchId]);
}

export async function insertTourMatchToDB({ matchId, player1_id, player2_id, player1_socket, player2_socket, tournament_id, round_number, status }:
	{ matchId: string, player1_id: number, player2_id: number, player1_socket: string | null, player2_socket: string | null, tournament_id: string, round_number: number, status: MatchStatus }) {

	const sql = `
INSERT INTO matches(
		matchId,
		player1_id,
		player2_id,
		player1_socket,
		player2_socket,
		tournament_id,
		round_number,
		status
	) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
	await execute(db, sql, [matchId, player1_id, player2_id, player1_socket, player2_socket, tournament_id, round_number, 'in_progress']);
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
	await execute(db, sql, [matchId, player1_id, player2_id, player1_socket, player2_socket, 'in_progress']);
}

export async function getMatchesByUserId(userId: number) {
	const sql = `SELECT * FROM matches WHERE player1_id = ? OR player2_id = ? ORDER BY created_at DESC`;
	return fetchAll(db, sql, [userId, userId]);
}

export async function getRowByMatchId(matchId: string) {
	let sql = `SELECT * FROM matches WHERE matchId = ? `;
	return fetchFirst(db, sql, [matchId]);
}

export async function updateStatus(status: MatchStatus, matchId: string) {
	
	let sql = `UPDATE matches SET status = ? WHERE matchId = ? `;
	await execute(db, sql, [status, matchId]);
	console.log(`Status for match ${matchId} updated to ${status}`);
}

export async function getAllRows() {

	let sql = `SELECT * FROM matches`;
	const matches = await fetchAll(db, sql, []);
	console.log(matches);
}

export async function deleteRow(id: number) {

	let sql = `DELETE FROM matches WHERE id = ? `;
	await execute(db, sql, [id]);
	console.log(`Match ${id} deleted from DB`);
}

// --- WRAPPERS FOR DB ACTIONS ---
export const execute = async (db: any, sql: string, params: any[] = []): Promise<void> => {
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
		db.get(sql, params, (err: Error | null, row: any) => {
			if (err) reject(err);
			resolve(row);
		});
	});
}