import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

// export async function initializeDb() {
// 	if (db) return db;
// 	const dbPath = path.join(__dirname, '..', 'db', 'database.sqlite');
//
// 	try {
// 		db = await open({
// 			filename: dbPath,
// 			driver: sqlite3.Database
// 		});
// 		console.log('Database connected!');
// 		const initSQLPath = path.join(__dirname, '..', 'db', 'init.sql');
// 		if (fs.existsSync(initSQLPath)) {
// 			const sql = fs.readFileSync(initSQLPath, 'utf-8');
// 			await db.exec(sql);
// 			console.log('Database initialized.');
// 		} else {
// 			console.warn('init.sql not found. Database not initialized.');
// 		}
// 	} catch (err) {
// 		console.error('Error while connecting to the database:', err.message);
// 	}
// };

export function getDb() {
	if (!db) throw new Error('DB not initialized');
	return db;
}

export async function initializeDb() {
	if (db) return db;

	const dbPath = path.join(__dirname, '..', 'db', 'database.sqlite');

	// 1. Supprimer l'ancienne base si elle existe
	if (fs.existsSync(dbPath)) {
		fs.unlinkSync(dbPath);
		console.log('Old database.sqlite removed.');
	}

	try {
		db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		console.log('Database connected!');

		const initSQLPath = path.join(__dirname, '..', 'db', 'init.sql');
		if (fs.existsSync(initSQLPath)) {
			const sql = fs.readFileSync(initSQLPath, 'utf-8');
			await db.exec(sql);
			console.log('Database initialized from init.sql.');
		} else {
			console.warn('init.sql not found. Database not initialized.');
		}
	} catch (err) {
		console.error('Error while connecting to the database:', err.message);
		//throw new Error(err);
	}
};
