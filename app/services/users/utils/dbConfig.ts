// // app/services/users/utils/dbConfig.ts
// import sqlite3, { Database as SQLite3Database } from 'sqlite3';
// import { open, Database } from 'sqlite';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// let db: Database | undefined;

// export function getDb(): Database {
// 	if (!db) throw new Error('DB not initialized');
// 	return db;
// }

// export async function initializeDb(): Promise<Database> {
// 	if (db) return db;

// 	const dbDir = path.join(__dirname, '..', 'db');
// 	const dbPath = path.join(dbDir, 'database.sqlite');

// 	if (!fs.existsSync(dbDir)) {
// 		fs.mkdirSync(dbDir, { recursive: true });
// 	}

// 	if (fs.existsSync(dbPath)) {
// 		fs.unlinkSync(dbPath);
// 		console.log('Old database.sqlite removed.');
// 	}

// 	try {
// 		db = await open({
// 			filename: dbPath,
// 			driver: sqlite3.Database
// 		});
// 		console.log('Database connected!');

// 		let initSQLPath = path.join(__dirname, '..', 'db', 'init.sql');
// 		if (!fs.existsSync(initSQLPath)) {
// 			initSQLPath = path.join(__dirname, '..', '..', 'db', 'init.sql');
// 		}
// 		if (fs.existsSync(initSQLPath)) {
// 			const sql = fs.readFileSync(initSQLPath, 'utf-8');
// 			await db.exec(sql);
// 			console.log('Database initialized from init.sql.');
// 		} else {
// 			console.warn('init.sql not found. Database not initialized.');
// 		}
// 		if (!db) throw new Error("DB failed to initialize after setup.");
// 		return db;
// 	} catch (err: any) {
// 		console.error('Error while connecting to the database:', err.message);
// 		throw new Error(err.message || 'Database initialization failed');
// 	}
// }


import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, '..', 'db');
const dbPath = path.join(dbDir, 'database.sqlite');
const INIT_FILE = 'init.sql';

let db: Database | undefined;

/**
 * Récupère l'instance de la base de données.
 * @throws {Error} si la base de données n'est pas initialisée.
 * @returns {Database} L'instance de la base de données.
 */
export function getDb(): Database {
	if (!db) {
		throw new Error('Database has not been initialized. Call initializeDb first.');
	}
	return db;
}

/**
 * Initialise la connexion à la base de données SQLite et exécute le script d'initialisation.
 * Utilise un pattern singleton pour ne s'exécuter qu'une seule fois.
 * @returns {Promise<Database>} L'instance de la base de données initialisée.
 */
export async function initializeDb(): Promise<Database> {
	if (db) return db;

	try {
		fs.mkdirSync(dbDir, { recursive: true });

		db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		console.log(`Database connected successfully at: ${dbPath}`);

		const initSQLPath = path.join(__dirname, '..', '..', 'db', INIT_FILE);
		console.log(`Looking for initialization script at: ${initSQLPath}`);
		if (fs.existsSync(initSQLPath)) {
			const sql = fs.readFileSync(initSQLPath, 'utf-8');
			await db.exec(sql);
			console.log('Database schema initialized from init.sql.');
		} else {
			console.warn(`Warning: ${INIT_FILE} not found. Database schema not initialized.`);
		}
		return db;
	} catch (err: any) {
		console.error('Fatal: Error while initializing the database:', err.message);
		throw new Error('Database initialization failed');
	}
}
