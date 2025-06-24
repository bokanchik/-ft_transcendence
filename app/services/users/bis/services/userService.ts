import * as userModel from '../models/userModel.js';
import * as passwordUtils from '../utils/pswdUtils.js';
import { ERROR_KEYS, ConflictError, UnauthorizedError, NotFoundError } from '../utils/appError.js';
import { User, UserWithSecrets, LoginRequestBody, RegisterRequestBody, UpdateUserPayload, CreateUserPayload, UserOnlineStatus } from '../shared/schemas/usersSchemas.js';

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
 * @returns {Promise<User>} The user object without the password hash.
 */
export async function loginUser({ identifier, password }: LoginRequestBody): Promise<User> {
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

	const { password_hash, two_fa_secret, ...userPassLess } = userEntity;
	return userPassLess;
}

/**
 * Creates a new user account.
 * @param {RegisterRequestBody} userData - The user data for account creation.
 * @throws {ConflictError} If the username or email already exists.
 * @returns {Promise<void>}
 */
export async function createUserAccount(userData: RegisterRequestBody): Promise<void> {
	console.log('Creating a new user account');
	const { username, email, password, display_name, avatar_url } = userData;

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
 * Retrieves a user by their ID.
 * @param {number} userId - The ID of the user to retrieve.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<User>} The user object.
 */
export async function getUserById(userId: number): Promise<User> {
	console.log('Fetching user by ID from the database');
	const user = await userModel.getUserByIdFromDb(userId);
	if (!user) {
		throw new NotFoundError(ERROR_KEYS.USER_NOT_FOUND);
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

	const currentUser = await userModel.getUserByIdFromDb(userId);
	if (!currentUser) {
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

	const changesToApply: UpdateUserPayload = {};
	for (const key in processedUpdates) {
		const typedKey = key as keyof UpdateUserPayload;
		const value = processedUpdates[typedKey];
		if (value !== null && value !== currentUser[typedKey]) {
			changesToApply[typedKey] = value;
		}
	}
	if (Object.keys(changesToApply).length === 0) {
		console.log(`No effective changes detected for user ${userId}. Profile remains unchanged.`);
		return currentUser;
	}

	if (changesToApply.display_name && await userModel.isDisplayNameInDb(changesToApply.display_name, userId)) {
		throw new ConflictError(ERROR_KEYS.REGISTER_DISPLAYNAME_EXISTS, { display_name: changesToApply.display_name });
	}
	if (changesToApply.email && await userModel.isEmailInDb(changesToApply.email, userId)) {
		throw new ConflictError(ERROR_KEYS.REGISTER_EMAIL_EXISTS, { email: changesToApply.email });
	}

	try {
		const result = await userModel.updateUserInDb(userId, changesToApply);
		if (!result.changes || result.changes === 0) {
			const finalUserCheck = await userModel.getUserByIdFromDb(userId);
			if (!finalUserCheck) throw new NotFoundError(`User ${userId} disappeared after update attempt or no changes made.`);
			return finalUserCheck;
		}
	} catch (dbError: any) {
		console.error(`Database error during profile update for user ${userId}:`, dbError);
		throw new Error(`Failed to update profile for user ${userId} due to a database issue.`);
	}

	const updatedUser = await userModel.getUserByIdFromDb(userId);
	if (!updatedUser) {
		throw new Error(`Failed to retrieve user ${userId} immediately after successful update.`);
	}
	return updatedUser;
}

/**
 * Updates the status of a user.
 * @param {number} userId - The ID of the user whose status to update.
 * @param {UserOnlineStatus} status - The new online status of the user.
 * @returns {Promise<void>}
 */
export async function updateUserStatus(userId: number, status: UserOnlineStatus): Promise<void> {
	await userModel.updateStatusInDb(userId, status);
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
		throw new NotFoundError('User not found');
	}
	const { password_hash, ...user } = userWithHash;
	return user as User;
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
		throw new NotFoundError('User not found');
	}
	const { password_hash, ...user } = userWithHash;
	return user as User;
}