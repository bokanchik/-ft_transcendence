import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initializeDb() {
	if (db) return db;
	const dbPath = path.join(__dirname, '..', 'db', 'database.sqlite');

	try {
		db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		console.log('Base de données connectée !');

		const initSQLPath = path.join(__dirname, '..', 'db', 'init.sql');
		if (fs.existsSync(initSQLPath)) {
			const sql = fs.readFileSync(initSQLPath, 'utf-8');
			await db.exec(sql);
			console.log('Base de données initialisée.');
		} else {
			console.warn('init.sql non trouvé. Base non initialisée.');
		}
	} catch (err) {
		console.error('Erreur lors de la connexion à la base de données:', err.message);
	}
};

export function getDb() {
	if (!db) throw new Error('DB not initialized');
	return db;
}
