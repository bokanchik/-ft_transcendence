// app/services/users/models/userModel.ts
import { getDb } from '../utils/dbConfig.js';
import { ERROR_MESSAGES } from '../shared/auth-plugin/appError.js';
import { User, UserWithPasswordHash, CreateUserPayload, UpdatedUserResult, UpdateUserPayload } from '../shared/types.js'; // Importez vos types

/**
 * Retrieves all users from the database.
 * @returns {Promise<User[]>} A list of all users.
 */
export async function getAllUsersFromDb(): Promise<User[]> {
	const db = getDb();
	return db.all<User[]>('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users');
}

/**
 * Retrieves a user by their display name.
 * @param {string} displayName - The display name of the user.
 * @returns {Promise<UserWithPasswordHash | undefined>} The user object or undefined if not found.
 */
export async function getUserByDisplayNameFromDb(displayName: string): Promise<UserWithPasswordHash | undefined> {
	const db = getDb();
	return db.get<UserWithPasswordHash>('SELECT * FROM users WHERE display_name = ?', [displayName]);
}

/**
 * Retrieves a user by their username.
 * @param {string} username - The username of the user.
 * @returns {Promise<UserWithPasswordHash | undefined>} The user object or undefined if not found.
 */
export async function getUserByUsernameFromDb(username: string): Promise<UserWithPasswordHash | undefined> {
	const db = getDb();
	return db.get<UserWithPasswordHash>('SELECT * FROM users WHERE username = ?', [username]);
}

/**
 * Retrieves a user by their email.
 * @param {string} email - The email of the user.
 * @returns {Promise<UserWithPasswordHash | undefined>} The user object or undefined if not found.
 */
export async function getUserByEmailFromDb(email: string): Promise<UserWithPasswordHash | undefined> {
	const db = getDb();
	return db.get<UserWithPasswordHash>('SELECT * FROM users WHERE email = ?', [email]);
}

/**
 * Retrieves a user by their ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<User | undefined>} The user object or undefined if not found.
 */
export async function getUserByIdFromDb(userId: number): Promise<User | undefined> {
	const db = getDb();
	return db.get<User>('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users WHERE id = ?', [userId]);
}

/**
 * Retrieves all matches for a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<any[]>} A list of matches for the user. // TODO: Définir un type Match et l'utiliser
 */
export async function getUserMatchesFromDb(userId: number): Promise<any[]> { // Remplacez any[] par Match[]
	const db = getDb();
	// TODO: Implémentez la requête SQL correcte pour récupérer les matchs
	// Exemple: return db.all('SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?', [userId, userId]);
	console.warn("getUserMatchesFromDb query needs to be implemented correctly for user ID:", userId);
	return db.all('SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?', [userId, userId]); // Placeholder, ajustez
}

/**
 * Creates a new user in the database.
 * @param {CreateUserPayload} user - The user data to insert.
 * @returns {Promise<void>} 
 */
export async function createUser(
	{ username, email, password_hash, display_name, avatar_url = null }: CreateUserPayload
): Promise<void> {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
		[username, email, password_hash, display_name, avatar_url]
	);
	if (result.lastID === undefined) {
		throw new Error("Failed to create user, no lastID returned.");
	}
}

/**
 * Updates a user's details in the database.
 * @param {number} userId - The ID of the user to update.
 * @param {UpdateUserPayload} updates - The fields to update and their new values.
 * @returns {Promise<UpdatedUserResult>} The result of the database operation.
 * @throws {Error} If an error occurs during the update.
 */
export async function updateUserInDb(userId: number, updates: UpdateUserPayload): Promise<UpdatedUserResult> {
	const db = getDb();
	const fields = Object.keys(updates) as Array<keyof UpdateUserPayload>; // Clés typées
	if (fields.length === 0) {
		return { changes: 0 };
	}
	const setClause = fields.map((field) => `${field} = ?`).join(', ');
	const values: (string | number)[] = fields.map((field) => updates[field] as string | number);

	const sql = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
	values.push(userId);

	try {
		const result = await db.run(sql, values); // <-- PAS de spread ici
		return { changes: result.changes };
	} catch (error: any) {
		console.error('Error updating user:', error);
		throw new Error(ERROR_MESSAGES.DATABASE_ERROR);
	}
}
