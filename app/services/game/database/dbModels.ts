import db from './connectDB.ts'

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