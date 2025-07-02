import * as userModel from '../models/userModel.js';
import { areUsersFriendsInDb } from '../models/friendModel.js';
import * as passwordUtils from '../utils/pswdUtils.js';
import { ERROR_KEYS, AppError, ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from '../utils/appError.js';
import { User, UserWithSecrets, LoginRequestBody, RegisterRequestBody, UpdateUserPayload, CreateUserPayload, UserOnlineStatus, UpdateUserStatsBody } from '../shared/schemas/usersSchemas.js';

/**
 * Generates a default avatar URL using ui-avatars.com.
 * @param {string} name - The name to use for generating the avatar.
 * @returns {string} The generated avatar URL.
 */
function generateDefaultAvatarUrl(name: string): string {
	const encodedName = encodeURIComponent(name);
	return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
}

/**
 * Logs in a user by verifying their credentials.
 * @param {string} params.identifier - The username or email of the user.
 * @param {string} params.password - The user's password.
 * @throws {UnauthorizedError} If the credentials are invalid.
 * @returns {Promise<UserWithSecrets>} The full user object with secrets.
 */
export async function loginUser({ identifier, password }: LoginRequestBody): Promise<UserWithSecrets> {
	console.log(`Attempting to log user with identifier: ${identifier}`);
	let userEntity;
	const isEmail = identifier.includes('@');
	if (isEmail) {
		userEntity = await userModel.getUserByEmailFromDb(identifier);
	} else {
		userEntity = await userModel.getUserByUsernameFromDb(identifier);
	}

	if (!userEntity || !(await passwordUtils.comparePassword(password, userEntity.password_hash))) {
		throw new UnauthorizedError(ERROR_KEYS.LOGIN_INVALID_CREDENTIALS);
	}

	return userEntity;
}

/**
 * Creates a new user account.
 * @param {RegisterRequestBody} userData - The user data for account creation.
 * @throws {ConflictError} If the username or email already exists.
 * @returns {Promise<void>}
 */
export async function createUserAccount(userData: RegisterRequestBody): Promise<void> {
	console.log('Creating a new user account');
	const { username, email, password, display_name, avatar_url, language } = userData;

	if (await userModel.isUsernameInDb(username)) {
		throw new ConflictError(ERROR_KEYS.REGISTER_USERNAME_EXISTS, { username: username });
	}
	if (await userModel.isDisplayNameInDb(display_name)) {
		throw new ConflictError(ERROR_KEYS.REGISTER_DISPLAYNAME_EXISTS, { display_name: display_name });
	}
	if (await userModel.isEmailInDb(email)) {
		throw new ConflictError(ERROR_KEYS.REGISTER_EMAIL_EXISTS, { email: email });
	}

	const hashedPassword = await passwordUtils.hashPassword(password);
	const payload: CreateUserPayload = {
		username,
		email,
		password_hash: hashedPassword,
		display_name,
		avatar_url: avatar_url && avatar_url.trim() !== "" ? avatar_url : generateDefaultAvatarUrl(display_name),
		language: language,
	};
	await userModel.createUser(payload);
}

/**
 * Retrieves all users from the database.
 * @returns {Promise<Array>} A list of all users.
 */
export async function getAllUsers(): Promise<User[]> {
	console.log('Fetching all users from the database');
	return userModel.getAllUsersFromDb();
}

/**
 * Retrieves a user by their ID, checking for permissions.
 * @param {number} targetUserId - The ID of the user to retrieve.
 * @param {number} requesterId - The ID of the user making the request.
 * @throws {NotFoundError} If the user does not exist.
 * @throws {ForbiddenError} If the requester is not allowed to view the profile.
 * @returns {Promise<User>} The user object.
 */
export async function getUserById(targetUserId: number, requesterId: number = targetUserId): Promise<User> {
	console.log(`User ${requesterId} is attempting to fetch profile for user ID: ${targetUserId}`);
	
	const user = await userModel.getUserByIdFromDb(targetUserId);
	if (!user) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}

	if (targetUserId === requesterId) { return user; }

	const areFriends = await areUsersFriendsInDb(targetUserId, requesterId);
	
	if (!areFriends) {
		throw new ForbiddenError(ERROR_KEYS.FORBIDDEN, { detail: 'Access to this profile is restricted to friends only.' });
	}
	return user;
}

/**
 * Retrieves a user with their secrets by ID. For internal use.
 * @param {number} userId - The ID of the user to retrieve.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<UserWithSecrets>} The user object with secrets.
 */
export async function getUserByIdWithSecrets(userId: number): Promise<UserWithSecrets> {
	console.log('Fetching user with secrets by ID');
	const user = await userModel.getUserWithSecretsByIdFromDb(userId);
	if (!user) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	return user;
}

/**
 * Updates the profile of a user.
 * @param {number} userId - The ID of the user to update.
 * @param {Object} updates - The updates to apply to the user's profile.
 * @throws {NotFoundError} If the user does not exist.
 * @throws {ConflictError} If the updated email or display name is already taken.
 * @returns {Promise<Object>} The updated user object without the password hash.
 */
export async function updateUserProfile(userId: number, updates: UpdateUserPayload): Promise<User> {
	console.log(`Attempting to update profile for user ID: ${userId}`);

	const currentUserWithSecrets = await userModel.getUserWithSecretsByIdFromDb(userId);
	if (!currentUserWithSecrets) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}

	const processedUpdates: UpdateUserPayload = {};
	if (updates.display_name !== undefined) {
		processedUpdates.display_name = updates.display_name.trim();
	}
	if (updates.email !== undefined) {
		processedUpdates.email = updates.email;
	}
	if (updates.avatar_url !== undefined) {
		processedUpdates.avatar_url = updates.avatar_url;
	}
	if (updates.language !== undefined) {
        processedUpdates.language = updates.language;
    }

	const changesToApply: UpdateUserPayload = {};
	for (const key in processedUpdates) {
		const typedKey = key as keyof UpdateUserPayload;
		const value = processedUpdates[typedKey];
		if (value !== null && value !== undefined && value !== currentUserWithSecrets[typedKey]) {
			(changesToApply as any)[typedKey] = value;
		}
	}
	if (updates.language && !currentUserWithSecrets.language) {
        changesToApply.language = updates.language;
    }
	if (Object.keys(changesToApply).length === 0) {
		console.log(`No effective changes detected for user ${userId}. Profile remains unchanged.`);
		const { password_hash, two_fa_secret, ...user } = currentUserWithSecrets;
		return user;
	}

	if (changesToApply.display_name && await userModel.isDisplayNameInDb(changesToApply.display_name, userId)) {
		throw new ConflictError(ERROR_KEYS.REGISTER_DISPLAYNAME_EXISTS, { display_name: changesToApply.display_name });
	}
	if (changesToApply.email && await userModel.isEmailInDb(changesToApply.email, userId)) {
		throw new ConflictError(ERROR_KEYS.REGISTER_EMAIL_EXISTS, { email: changesToApply.email });
	}

	try {
		await userModel.updateUserInDb(userId, changesToApply);
	} catch (dbError: any) {
		console.error(`Database error during profile update for user ${userId}:`, dbError);
		throw new AppError(ERROR_KEYS.DATABASE_ERROR, 500);
	}

	const updatedUser = await userModel.getUserByIdFromDb(userId);
	if (!updatedUser) {
		throw new AppError(ERROR_KEYS.DATABASE_ERROR, 500, { detail: `Could not re-fetch user ${userId} after update.` });
	}
	return updatedUser;
}

/**
 * Updates the status of a user.
 * @param {number} userId - The ID of the user whose status to update.
 * @param {UserOnlineStatus} status - The new online status of the user.
 * @returns {Promise<User>} The updated user object.
 */
export async function updateUserStatus(userId: number, status: UserOnlineStatus): Promise<User> {
	const userExists = await userModel.getUserByIdFromDb(userId);
    if (!userExists) {
        throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
    }
	await userModel.updateStatusInDb(userId, status);
	const updatedUser = await userModel.getUserByIdFromDb(userId);
	if (!updatedUser) {
		throw new AppError(ERROR_KEYS.DATABASE_ERROR, 500, { detail: `Could not re-fetch user ${userId} after status update.` });
	}

	console.log(`Status updated successfully for user ID: ${userId} to ${status}`);
    return updatedUser;
}

/**
 * Retrieves a user by their email.
 * @param {string} email - The email of the user to retrieve.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<Object>} The user object.
 */
export async function getUserByEmail(email: string): Promise<User> {
	console.log('Fetching user by email from the database');
	const userWithHash = await userModel.getUserByEmailFromDb(email);
	if (!userWithHash) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	const { password_hash, two_fa_secret, ...user } = userWithHash;
	return user;
}

/**
 * Retrieves a user by their username.
 * @param {string} username - The username of the user to retrieve.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<Object>} The user object.
 */
export async function getUserByUsername(username: string): Promise<User> {
	console.log('Fetching user by username from the database');
	const userWithHash = await userModel.getUserByUsernameFromDb(username);
	if (!userWithHash) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
	}
	const { password_hash, two_fa_secret, ...user } = userWithHash;
	return user;
}

/**
 * Met à jour les statistiques de victoire/défaite pour un utilisateur.
 * @param {number} userId - L'ID de l'utilisateur.
 * @param {UpdateUserStatsBody} statsUpdate - L'objet contenant le résultat du match.
 * @throws {NotFoundError} Si l'utilisateur n'existe pas.
 * @returns {Promise<User>} L'objet utilisateur mis à jour.
 */
export async function updateUserStats(userId: number, statsUpdate: UpdateUserStatsBody): Promise<User> {
    console.log(`Attempting to update stats for user ID: ${userId} with result: ${statsUpdate.result}`);

    const userExists = await userModel.getUserByIdFromDb(userId);
    if (!userExists) {
        throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
    }
    
    await userModel.incrementUserStatsInDb(userId, statsUpdate.result);
    
    const updatedUser = await userModel.getUserByIdFromDb(userId);
    if (!updatedUser) {
        throw new AppError(ERROR_KEYS.DATABASE_ERROR, 500, { detail: `Could not re-fetch user ${userId} after stats update.` });
    }

    console.log(`Stats updated successfully for user ID: ${userId}. New stats: W=${updatedUser.wins}, L=${updatedUser.losses}`);
    return updatedUser;
}