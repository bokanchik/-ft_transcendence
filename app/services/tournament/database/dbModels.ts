import db from './connectDB.ts';

const execute = (sql: string, params: any[] = []): Promise<void> => {
	return new Promise<void>((resolve, reject) => {
		db.run(sql, params, (err: Error | null) => {
			if (err) reject(err);
			resolve();
		});
	});
};

const fetchAll = (sql: string, params: any[]): Promise<any[]> => {
	return new Promise<any[]>((resolve, reject) => {
		db.all(sql, params, (err: Error | null, rows: any) => {
			if (err) reject(err);
			resolve(rows);
		});
	});
}

const fetchFirst = (sql: string, params: any): Promise<any> => {
	return new Promise<any>((resolve, reject) => {
		db.get(sql, params, (err: Error | null, row: any) => {
			if (err) reject(err);
			resolve(row);
		});
	});
}


const tournamentTable = `
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    player_count INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'finished')) DEFAULT 'in_progress',
    winner_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const tournamentPlayersTable = `
CREATE TABLE IF NOT EXISTS tournament_players (
    tournament_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);`;

// Cette table est la clé. Elle lie le tournoi à des matchId qui existent dans le service 'game'.
const tournamentMatchesTable = `
CREATE TABLE IF NOT EXISTS tournament_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id TEXT NOT NULL,
    matchId TEXT UNIQUE NOT NULL,
    round_number INTEGER NOT NULL,
    player1_id INTEGER,
    player2_id INTEGER,
    winner_id INTEGER,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);`;

export async function createTournamentTables() {
    try {
        await execute(tournamentTable);
        await execute(tournamentPlayersTable);
        await execute(tournamentMatchesTable);
        console.log('Tournament tables created successfully.');
    } catch (err: unknown) {
        console.error(`Error creating tournament tables: ${err}`);
        throw err;
    }
}

export async function createTournament(tournamentId: string, playerIds: number[]) {
    await execute('INSERT INTO tournaments (id, player_count) VALUES (?, ?)', [tournamentId, playerIds.length]);
    for (const userId of playerIds) {
        await execute('INSERT INTO tournament_players (tournament_id, user_id) VALUES (?, ?)', [tournamentId, userId]);
    }
}

export async function addMatchToTournament(tournamentId: string, matchId: string, p1Id: number, p2Id: number, round: number) {
    const sql = `
    INSERT INTO tournament_matches(tournament_id, matchId, player1_id, player2_id, round_number, status)
    VALUES(?, ?, ?, ?, ?, ?)`;
    await execute(sql, [tournamentId, matchId, p1Id, p2Id, round, 'pending']);
}

export async function updateMatchWinnerInTournamentDB(matchId: string, winnerId: number) {
    const sql = `UPDATE tournament_matches SET winner_id = ?, status = 'finished' WHERE matchId = ?`;
    await execute(sql, [winnerId, matchId]);
}

export async function updateTournamentWinner(tournamentId: string, winnerId: number) {
    const sql = `UPDATE tournaments SET winner_id = ?, status = 'finished' WHERE id = ?`;
    await execute(sql, [winnerId, tournamentId]);
}

export async function getMatchesForTournament(tournamentId: string) {
    const sql = `SELECT * FROM tournament_matches WHERE tournament_id = ? ORDER BY round_number`;
    return fetchAll(sql, [tournamentId]);
}

export async function getTournamentById(tournamentId: string) {
    const tournamentSql = `SELECT * FROM tournaments WHERE id = ?`;
    const matchesSql = `SELECT * FROM tournament_matches WHERE tournament_id = ? ORDER BY round_number`;
    const tournament = await fetchFirst(tournamentSql, [tournamentId]);
    const matches = await fetchAll(matchesSql, [tournamentId]);
    return { tournament, matches };
}