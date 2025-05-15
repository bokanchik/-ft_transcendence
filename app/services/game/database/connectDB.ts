import sqlite3 from 'sqlite3';

// for debugging purposes
const sql3 = sqlite3.verbose();

// connect to DB and create a new database if it doesn't exist
const db: sqlite3.Database = new sql3.Database('./game.db', (err: Error | null) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the game database.');
    }
});

export default db;