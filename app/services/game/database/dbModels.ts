import db from './connectDB.ts'

const matchTable: string = `
    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id TEXT NOT NULL,
        player2_id TEXT NOT NULL,
        player1_score INTEGER NOT NULL,
        player2_score INTEGER NOT NULL,
        winner_id TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        match_end_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        state TEXT NOT NULL CHECK (state IN ('pending', 'active', 'finished'))
    )`;

db.run(matchTable, [], (err: Error | null) => {
    if (err) {
        console.error(`Error creating matches table: ${err.message}`);
    } else {
        console.log('Matches table created or already exists.');
    }
});    
    