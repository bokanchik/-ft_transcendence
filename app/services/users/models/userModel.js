// Database access functions for user-related operations.
import { getDb } from '../utils/dbConfig.js';

/**
 * Retrieves all users from the database.
 * @returns {Promise<Array<object>>} A list of all users with their details.
 */
export async function getAllUsersFromDb() {
    const db = getDb();
    return db.all('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users');
}

/**
 * Retrieves a user by their display name.
 * @param {string} displayName - The display name of the user.
 * @returns {Promise<object|undefined>} The user object or undefined if not found.
 */
export async function getUserByDisplayNameFromDb(displayName) {
    const db = getDb();
    return db.get('SELECT * FROM users WHERE display_name = ?', [displayName]);
}

/**
 * Retrieves a user by their username.
 * @param {string} username - The username of the user.
 * @returns {Promise<object|undefined>} The user object or undefined if not found.
 */
export async function getUserByUsernameFromDb(username) {
    const db = getDb();
    return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

/**
 * Retrieves a user by their email.
 * @param {string} email - The email of the user.
 * @returns {Promise<object|undefined>} The user object or undefined if not found.
 */
export async function getUserByEmailFromDb(email) {
    const db = getDb();
    return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

/**
 * Retrieves a user by their ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<object|undefined>} The user object or undefined if not found.
 */
export async function getUserByIdFromDb(userId) {
    const db = getDb();
    return db.get('SELECT id, username, email, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users WHERE id = ?', [userId]);
}

/**
 * Retrieves all matches for a specific user.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<Array<object>>} A list of matches for the user.
 */
export async function getUserMatchesFromDb(userId) {
    const db = getDb();
    return db.all(userId); // Ensure the query is correctly implemented.
}

/**
 * Creates a new user in the database.
 * @param {object} user - The user data to insert.
 * @param {string} user.username - The username of the user.
 * @param {string} user.email - The email of the user.
 * @param {string} user.password_hash - The hashed password of the user.
 * @param {string} user.display_name - The display name of the user.
 * @param {string} [user.avatar_url=null] - The avatar URL of the user.
 * @returns {Promise<object>} The created user object with its ID.
 */
export async function createUser({ username, email, password_hash, display_name, avatar_url = null }) {
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

/**
 * Updates a user's details in the database.
 * @param {number} userId - The ID of the user to update.
 * @param {object} updates - The fields to update and their new values.
 * @returns {Promise<object>} The result of the database operation, including the number of changes.
 * @throws {Error} If an error occurs during the update.
 */
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
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}
