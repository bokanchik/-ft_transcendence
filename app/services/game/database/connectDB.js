import sqlite3 from 'sqlite3';

// for debugging purposes
const sql3 = sqlite3.verbose();

// connect to DB and create a new database if it doesn't exist
const db = new sql3.Database('./game.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the game database.');
    }
});

// player1_id and player2_id must be extracted from the authenticated user's JWTs
let matchTable = `
    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id TEXT NOT NULL,
        player2_id TEXT NOT NULL,
        winner_id TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        state TEXT NOT NULL CHECK (state IN ('pending', 'active', 'finished'))
    )`;

db.run(matchTable, [], (err) => {
    if (err) {
        console.error('Error creating matches table: ' + err.message);
    } else {
        console.log('Matches table created or already exists.');
    }
});    

export default db;