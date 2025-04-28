// Accès à la base de données (getUserByUsername, etc.)
import { getDb } from '../utils/dbConfig.js';

export async function getAllUsersFromDb() {
	const db = getDb();
	return db.all('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users');
}

export async function getUserByDisplayNameFromDb(displayName) {
	const db = getDb();
	return db.get('SELECT * FROM users WHERE display_name = ?', [displayName]);
}

export async function getUserByUsernameFromDb(username) {
	const db = getDb();
	return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

export async function getUserByEmailFromDb(email) {
	const db = getDb();
	return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

export async function getUserByIdFromDb(userId) {
	const db = getDb();
	return db.get('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users WHERE id = ?', [userId]);
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
	// return {
	// 	id: result.lastID,
	// };
	return {
		id: result.lastID,
		username,
		email,
		display_name,
		avatar_url
	};
}

export async function updateUserInDb(userId, updates) {
	const db = getDb();
	const fields = Object.keys(updates);
	if (fields.length === 0) {
		return { changes: 0 };
	}
	const setClause = fields.map((field) => `${field} = ?`).join(', ');
	const values = fields.map((field) => updates[field]);
	const sql = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
	values.push(userId);
	try {
		const result = await db.run(sql, values);
		return result;
	}
	catch (error) {
		console.error('Error updating user:', error);
		throw error;
	}
}
