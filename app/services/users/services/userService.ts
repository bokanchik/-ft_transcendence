// app/services/users/services/userService.ts
import * as userModel from '../models/userModel.js';
import * as passwordUtils from '../shared/auth-plugin/pswdUtils.js';
import { ERROR_MESSAGES, ConflictError, ValidationError, NotFoundError } from '../shared/auth-plugin/appError.js';
import { User, LoginRequestBody, RegisterRequestBody, UpdateUserPayload, CreateUserPayload } from '../shared/types.js';

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
 * Checks if a string is a valid HTTP/HTTPS URL.
 * @param {string} urlString - The string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidHttpUrl(urlString: string | undefined | null): boolean {
	if (typeof urlString !== 'string' || !urlString) return false;
	try {
		const url = new URL(urlString);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch (_) {
		return false;
	}
}

/**
 * Checks if a string is a valid email format.
 * @param {string} emailString - The string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidEmailFormat(emailString: string | undefined | null): boolean {
	if (typeof emailString !== 'string' || !emailString) return false;
	return emailString.includes('@') && emailString.length > 3;
}

/**
 * Logs in a user by verifying their credentials.
 * @param {string} params.identifier - The username or email of the user.
 * @param {string} params.password - The user's password.
 * @throws {ValidationError} If the credentials are invalid.
 * @returns {Promise<Object>} The user object without the password hash.
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
		throw new ValidationError('Invalid username/email or password.');
	}

	const { password_hash, ...userPassLess } = userEntity;
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
		throw new ConflictError(ERROR_MESSAGES.USERNAME_ALREADY_EXISTS);
	}
	if (await userModel.isEmailInDb(email)) {
		throw new ConflictError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
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
 * @returns {Promise<Object>} The user object.
 */
export async function getUserById(userId: number): Promise<User> {
	console.log('Fetching user by ID from the database');
	const user = await userModel.getUserByIdFromDb(userId);
	if (!user) {
		throw new NotFoundError('User not found');
	}
	return user;
}


/**
 * Retrieves the matches of a user by their ID.
 * @param {number} userId - The ID of the user whose matches to retrieve.
 * @throws {NotFoundError} If no matches are found for the user.
 * @returns {Promise<Array>} A list of matches for the user.
 */
export async function getUserMatches(userId: number): Promise<any[]> { // TODO: Use Match[] type
	console.log('Fetching user matches from the database');
	const matches = await userModel.getUserMatchesFromDb(userId);
	if (!matches) {
		throw new NotFoundError('No matches found for this user'); // TODO: virer le if car matches deja undefined si vide
	}
	return matches;
}

/**
 * Updates the profile of a user.
 * @param {number} userId - The ID of the user to update.
 * @param {Object} updates - The updates to apply to the user's profile.
 * @throws {NotFoundError} If the user does not exist.
 * @throws {ValidationError} If the updates are invalid.
 * @throws {ConflictError} If the updated email or display name is already taken.
 * @returns {Promise<Object>} The updated user object without the password hash.
 */
export async function updateUserProfile(userId: number, updates: UpdateUserPayload): Promise<User> {
	console.log(`Attempting to update profile for user ID: ${userId}`);

	const currentUser = await userModel.getUserByIdFromDb(userId);
	if (!currentUser) {
		throw new NotFoundError(`User with ID ${userId} not found`);
	}

	const processedUpdates: UpdateUserPayload = {};

	if (updates.display_name !== undefined) {
		if (typeof updates.display_name === 'string' && updates.display_name.trim().length > 0) {
			processedUpdates.display_name = updates.display_name.trim();
		} else {
			throw new ValidationError('Display name cannot be empty');
		}
	}

	if (updates.email !== undefined) {
		const potentialEmail = updates.email;
		if (potentialEmail && isValidEmailFormat(potentialEmail)) {
			processedUpdates.email = potentialEmail.trim();
		} else {
			throw new ValidationError('Invalid email format provided.');
		}
	}

	if (updates.avatar_url !== undefined) {
		const potentialAvatar = updates.avatar_url;
		if (potentialAvatar === null) {
			processedUpdates.avatar_url = undefined;
		} else if (potentialAvatar && isValidHttpUrl(potentialAvatar)) {
			processedUpdates.avatar_url = potentialAvatar;
		} else if (potentialAvatar && !isValidHttpUrl(potentialAvatar)) {
			throw new ValidationError('Invalid avatar URL format provided.');
		}
	}

	const changesToApply: Partial<UpdateUserPayload> = {};
	for (const key in processedUpdates) {
		const typedKey = key as keyof UpdateUserPayload;
		if (processedUpdates[typedKey] !== currentUser[typedKey as keyof User]) {
			changesToApply[typedKey] = processedUpdates[typedKey];
		}
	}

	if (Object.keys(changesToApply).length === 0) {
		console.log(`No effective changes detected for user ${userId}. Profile remains unchanged.`);
		return currentUser;
	}

	if (changesToApply.display_name && await userModel.isDisplayNameInDb(changesToApply.display_name, userId)) {
		throw new ConflictError(`Display name '${changesToApply.display_name}' is already taken.`);
	}

	if (changesToApply.email && await userModel.isEmailInDb(changesToApply.email, userId)) {
		throw new ConflictError(`Email '${changesToApply.email}' is already taken.`);
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
	// Note: getUserByUsernameFromDb retourne UserWithPasswordHash, mais on ne veut pas exposer le hash.
	// Il faudrait une version de getUserByUsernameFromDb qui omet le hash, ou le filtrer ici.
	const userWithHash = await userModel.getUserByUsernameFromDb(username);
	if (!userWithHash) {
		throw new NotFoundError('User not found');
	}
	const { password_hash, ...user } = userWithHash;
	return user as User;
}
