import db from './connectDB.ts';

type MatchStatus = 'pending' | 'in_progress' | 'finished';

const matchTable: string = `
    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        matchId TEXT UNIQUE NOT NULL,
        player1_id TEXT NOT NULL,
        player2_id TEXT NOT NULL,
        player1_socket TEXT NOT NULL,
        player2_socket TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'finished'))
    )`;

//     CREATE TABLE IF NOT EXISTS matches (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     player1_id INTEGER NOT NULL,
//     player2_id INTEGER NOT NULL,
//     player1_score INTEGER NOT NULL,
//     player2_score INTEGER NOT NULL,
//     winner_id INTEGER NOT NULL,
//     win_type TEXT NOT NULL DEFAULT 'score',
//     match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     game_type TEXT DEFAULT 'pong',
//     tournament_id INTEGER,
//     FOREIGN KEY(player1_id) REFERENCES users(id),
//     FOREIGN KEY(player2_id) REFERENCES users(id),
//     FOREIGN KEY(winner_id) REFERENCES users(id)
// );

// --- HELPER FUNCTIONS FOR GENERAL DB ACTIONS (all(), get(), run(), exec() etc.)
export async function createMatchTable() {
    try {
        await execute(db, matchTable);
        console.log('Matches table created or already exists.');
    } catch (err: unknown) {
        console.error(`Error creating matches table: ${err}`);
    }
};

export async function insertMatchToDB({ matchId, player1_id, player2_id, player1_socket, player2_socket }: 
    { matchId: string, player1_id: string, player2_id: string, player1_socket: string, player2_socket: string }) {
        
    const sql = `
        INSERT INTO matches (
            matchId,
            player1_id,
            player2_id,
            player1_socket,
            player2_socket,
            status    
        ) VALUES (?, ?, ?, ?, ?, ?)`;
            
        const params = [
        matchId,
        player1_id,
        player2_id,
        player1_socket,
        player2_socket,
        'pending' // or active ?
    ];
        
    try {
        await execute(db, sql, params);
        console.log(`Match ${matchId} inserted to DB`);

    } catch (err: unknown) {
        console.log(`Failed to insert match into DB ${err}`);
    }
}

export async function getRowById(id: number) {

    let sql = `SELECT * FROM matches WHERE id = ?`;

    try {
        const match = await fetchFirst(db, sql, [id]);
        console.log(match);

    } catch (err: unknown) {
        console.log(`Failed to retrieve a row from DB ${err}`);
    }
}


export async function getAllRows() {
    
    let sql = `SELECT * FROM matches`;

    try {
        const matches = await fetchAll(db, sql, []);
        console.log(matches);
    } catch (err: unknown) {
        console.log(`Failed to retrieve all rows drom DB: ${err}`);
    }
}

export async function updateStatus(status: MatchStatus, matchId: string) {
   
    let sql = `UPDATE matches SET status = ? WHERE matchId = ?`;

    try { 
        await execute(db, sql, [status, matchId]);
        console.log(`Status for match ${matchId} updated to ${status}`);
    } catch (err: unknown){
        console.log(`Failed to update status: ${err}`);
    }
}

export async function deleteRow(id: number) {
   
    let sql = `DELETE FROM matches WHERE id = ?`;

    try {
        await execute(db, sql, [id]);
        console.log(`Match ${id} deleted from DB`);
    } catch (err: unknown) {
        console.log(`Failed to delete match ${id} from DB: ${err}`);
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