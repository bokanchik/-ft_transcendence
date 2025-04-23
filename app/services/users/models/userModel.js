// Accès à la base de données (getUserByUsername, etc.)
import { getDb } from '../config/dbConfig.js';

export async function getAllUsersFromDb() {
	const db = getDb();
	return db.all('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users');
}

export async function getUserByUsernameFromDb(username) {
	const db = getDb();
	return db.all('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users WHERE username = ?', [username]);
}

export async function getUserByEmailFromDb(email) {
	const db = getDb();
	return db.all('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users WHERE email = ?', [email]);
}

export async function getUserByIdFromDb(userId) {
	const db = getDb();
	return db.all('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users WHERE id = ?', [userId]);
}

export async function getUserMatchesFromDb(userId) {
	const db = getDb();
	return db.all(userId);
}

export async function createUser({ username, email, password_hash, display_name, avatar_url = null }) {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
		[username, email, password_hash, display_name, avatar_url]
	);
	return { id: result.lastID };
}

export async function insertUserIntoDb({ username, email, password_hash, display_name, avatar_url = null }) {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
		[username, email, password_hash, display_name, avatar_url]
	);
	return {
		id: result.lastID,
		username,
		email,
		display_name,
		avatar_url
	};
}
