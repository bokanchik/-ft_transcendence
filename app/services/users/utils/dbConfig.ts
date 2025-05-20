// app/services/users/utils/dbConfig.ts
import sqlite3, { Database as SQLite3Database } from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database | undefined;

export function getDb(): Database {
	if (!db) throw new Error('DB not initialized');
	return db;
}

export async function initializeDb(): Promise<Database> {
	if (db) return db;

	const dbDir = path.join(__dirname, '..', 'db');
	const dbPath = path.join(dbDir, 'database.sqlite');

	if (!fs.existsSync(dbDir)) {
		fs.mkdirSync(dbDir, { recursive: true });
	}

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

		let initSQLPath = path.join(__dirname, '..', 'db', 'init.sql');
		if (!fs.existsSync(initSQLPath)) {
			initSQLPath = path.join(__dirname, '..', '..', 'db', 'init.sql');
		}
		if (fs.existsSync(initSQLPath)) {
			const sql = fs.readFileSync(initSQLPath, 'utf-8');
			await db.exec(sql);
			console.log('Database initialized from init.sql.');
		} else {
			console.warn('init.sql not found. Database not initialized.');
		}
		if (!db) throw new Error("DB failed to initialize after setup.");
		return db;
	} catch (err: any) {
		console.error('Error while connecting to the database:', err.message);
		throw new Error(err.message || 'Database initialization failed');
	}
}
