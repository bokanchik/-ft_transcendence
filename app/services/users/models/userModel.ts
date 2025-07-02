import { getDb } from '../utils/dbConfig.js';
import { User, UserPublic, UserWithSecrets, CreateUserPayload, UpdatedUserResult, UpdateUserPayload, UserOnlineStatus } from '../shared/schemas/usersSchemas.js'; // Importez vos types
import { AppError, NotFoundError, ERROR_KEYS } from '../utils/appError.js';

function toAppUser(dbUser: any): User {
    if (!dbUser) return dbUser;
    return {
        ...dbUser,
        is_two_fa_enabled: dbUser.is_two_fa_enabled === 1
    };
}

function toAppUserWithSecrets(dbUser: any): UserWithSecrets {
    if (!dbUser) return dbUser;
    return {
        ...dbUser,
        is_two_fa_enabled: dbUser.is_two_fa_enabled === 1
    };
}

/**
 * Retrieves all users from the database.
 * @returns {Promise<User[]>} A list of all users.
 */
export async function getAllUsersFromDb(): Promise<User[]> {
	const db = getDb();
	const users = await db.all<any[]>('SELECT id, username, email, display_name, avatar_url, wins, losses, status, language, created_at, updated_at, is_two_fa_enabled FROM users');
    return users.map(toAppUser);
}

/**
 * Retrieves a user by their display name.
 * @param {string} displayName - The display name of the user.
 * @returns {Promise<UserWithSecrets | undefined>} The user object or undefined if not found.
 */
export async function getUserByDisplayNameFromDb(displayName: string): Promise<UserWithSecrets | undefined> {
	const db = getDb();
	const user = await db.get<any>('SELECT * FROM users WHERE display_name = ?', [displayName]);
    return user ? toAppUserWithSecrets(user) : undefined;
}

/**
 * Retrieves a user by their username.
 * @param {string} username - The username of the user.
 * @returns {Promise<UserWithSecrets | undefined>} The user object or undefined if not found.
 */
export async function getUserByUsernameFromDb(username: string): Promise<UserWithSecrets | undefined> {
	const db = getDb();
	const user = await db.get<any>('SELECT * FROM users WHERE username = ?', [username]);
    return user ? toAppUserWithSecrets(user) : undefined;
}

/**
 * Retrieves a user by their email.
 * @param {string} email - The email of the user.
 * @returns {Promise<UserWithSecrets | undefined>} The user object or undefined if not found.
 */
export async function getUserByEmailFromDb(email: string): Promise<UserWithSecrets | undefined> {
	const db = getDb();
	const user = await db.get<any>('SELECT * FROM users WHERE email = ?', [email]);
    return user ? toAppUserWithSecrets(user) : undefined;
}

/**
 * Retrieves a user by their ID.
 * @param {number} userId - The ID of the user.
 * @returns {Promise<User | undefined>} The user object or undefined if not found.
 */
export async function getUserByIdFromDb(userId: number): Promise<User | undefined> {
	const db = getDb();
	const user = await db.get<any>('SELECT id, username, email, display_name, avatar_url, wins, losses, status, language, created_at, updated_at, is_two_fa_enabled FROM users WHERE id = ?', [userId]);
    return user ? toAppUser(user) : undefined;
}

export async function getUserPublicInfoFromDb(userId: number): Promise<UserPublic | undefined> {
	const db = getDb();
	const user = await db.get<any>('SELECT id, display_name, avatar_url, wins, losses, status, created_at, updated_at FROM users WHERE id = ?', [userId]);
	return user;
}

/**
 * Retrieves a user with their secrets by ID. For internal use.
 * @param {number} userId - The ID of the user to retrieve.
 * @returns {Promise<UserWithSecrets | undefined>} The user object with secrets, or undefined if not found.
 */
export async function getUserWithSecretsByIdFromDb(userId: number): Promise<UserWithSecrets | undefined> {
	const db = getDb();
	const user = await db.get<any>('SELECT * FROM users WHERE id = ?', [userId]);
    return user ? toAppUserWithSecrets(user) : undefined;
}

/**
 * Creates a new user in the database.
 * @param {CreateUserPayload} user - The user data to insert.
 * @returns {Promise<void>} 
 */
export async function createUser(
	{ username, email, password_hash, display_name, avatar_url = null, language = 'en' }: CreateUserPayload
): Promise<void> {
	const db = getDb();
	const result = await db.run(
		`INSERT INTO users (username, email, password_hash, display_name, avatar_url, language) VALUES (?, ?, ?, ?, ?, ?)`,
		[username, email, password_hash, display_name, avatar_url, language]
	);
	if (result.lastID === undefined) {
		throw new AppError(ERROR_KEYS.DATABASE_ERROR, 500, { detail: "User creation failed, no lastID." });
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
	const fields = Object.keys(updates).filter(k => (updates as any)[k] !== undefined) as Array<keyof UpdateUserPayload>;
	if (fields.length === 0) {
		return { changes: 0 };
	}
	const setClause = fields.map((field) => `${String(field)} = ?`).join(', ');
	const values: (string | number | boolean | null)[] = fields.map((field) => (updates as any)[field]);

	const sql = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
	values.push(userId);

	try {
		const result = await db.run(sql, values);
		return { changes: result.changes };
	} catch (error: any) {
		console.error('Error updating user:', error);
		throw error;;
	}
}

export async function updateStatusInDb(userId: number, status: UserOnlineStatus): Promise<void> {
	const db = getDb();
	const sql = `UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
	const result = await db.run(sql, [status, userId]);
	if (result.changes === 0) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND, { userId });
	}
}

export async function deleteUserFromDb(userId: number): Promise<void> {
	const db = getDb();
	const result = await db.run('DELETE FROM users WHERE id = ?', [userId]);
	if (result.changes === 0) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND, { userId });
	}
}

export async function isUsernameInDb(username: string, id?: number): Promise<boolean> {
	const db = getDb();
	let query = 'SELECT EXISTS(SELECT 1 FROM users WHERE username = ?';
	const params: (string | number)[] = [username];
	if (id !== undefined) {
		query += ' AND id != ?';
		params.push(id);
	}
	query += ') AS "exists"';
	const row = await db.get<{ exists: number }>(query, params);
	return row?.exists === 1;
}

export async function isEmailInDb(email: string, id?: number): Promise<boolean> {
	const db = getDb();
	let query = 'SELECT EXISTS(SELECT 1 FROM users WHERE email = ?';
	const params: (string | number)[] = [email];
	if (id !== undefined) {
		query += ' AND id != ?';
		params.push(id);
	}
	query += ') AS "exists"';
	const row = await db.get<{ exists: number }>(query, params);
	return row?.exists === 1;
}

export async function isDisplayNameInDb(display_name: string, id?: number): Promise<boolean> {
	const db = getDb();
	let query = 'SELECT EXISTS(SELECT 1 FROM users WHERE display_name = ?';
	const params: (string | number)[] = [display_name];
	if (id !== undefined) {
		query += ' AND id != ?';
		params.push(id);
	}
	query += ') AS "exists"';
	const row = await db.get<{ exists: number }>(query, params);
	return row?.exists === 1;
}

/**
 * Incrémente le compteur de victoires ou de défaites d'un utilisateur dans la base de données.
 * @param {number} userId - L'ID de l'utilisateur à mettre à jour.
 * @param {'win' | 'loss'} result - Le résultat du match.
 * @returns {Promise<UpdatedUserResult>} Le résultat de l'opération de la base de données.
 */
export async function incrementUserStatsInDb(userId: number, result: 'win' | 'loss'): Promise<UpdatedUserResult> {
    const db = getDb();
    const columnToUpdate = result === 'win' ? 'wins' : 'losses';

    if (!['wins', 'losses'].includes(columnToUpdate)) {
        throw new Error('Invalid column name for stats update.');
    }

    const sql = `UPDATE users SET ${columnToUpdate} = ${columnToUpdate} + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    try {
        const dbResult = await db.run(sql, [userId]);
        if (dbResult.changes === 0) {
            throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND, { userId });
        }
        return { changes: dbResult.changes };
    } catch (error: any) {
        console.error('Error updating user stats:', error);
        throw new AppError(ERROR_KEYS.DATABASE_ERROR, 500, { detail: error.message });
    }
}