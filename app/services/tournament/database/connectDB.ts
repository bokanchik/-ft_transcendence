import sqlite3 from 'sqlite3';
import { createTournamentTables } from './dbModels.ts';

const sql3 = sqlite3.verbose();

const db: sqlite3.Database = new sql3.Database('./tournament.db', (err: Error | null) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the game database.');
        initGameDb();
    }
});

async function initGameDb() {
    try {
        await createTournamentTables();
    } catch (err: unknown) {
        console.error(`Error while initializing gameDb ${err}`);
        throw err;
    }
}

export default db;