// Logique métier (authentification, validation, etc.), sans reply
import * as userModel from '../models/userModel.js';
import * as passwordUtils from '../utils/pswdUtils.js';
import { ConflictError, ValidationError, NotFoundError } from '../utils/appError.js';

// --- Fonctions d'aide (Helpers) ---

/**
 * Génère une URL d'avatar par défaut en utilisant ui-avatars.com.
 * @param {string} name - Le nom à utiliser pour générer l'avatar.
 * @returns {string} L'URL de l'avatar généré.
 */
function generateDefaultAvatarUrl(name) {
	const encodedName = encodeURIComponent(name);
	return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
}

/**
 * Vérifie basiquement si une chaîne ressemble à une URL HTTP/HTTPS valide.
 * @param {string} urlString - La chaîne à vérifier.
 * @returns {boolean} True si valide, false sinon.
 */
function isValidHttpUrl(urlString) {
	if (typeof urlString !== 'string') return false;
	try {
		const url = new URL(urlString);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch (_) {
		return false;
	}
}

/**
 * Vérifie basiquement si une chaîne ressemble à un email.
 * @param {string} emailString - La chaîne à vérifier.
 * @returns {boolean} True si valide, false sinon.
 */
function isValidEmailFormat(emailString) {
	if (typeof emailString !== 'string') return false;
	return emailString.includes('@') && emailString.length > 3;
}

export async function loginUser({ identifier, password }) {
	console.log(`Attempting to log in user with identifier: ${identifier}`);
	let user;
	const isEmail = identifier.includes('@');
	if (isEmail) {
		user = await userModel.getUserByEmailFromDb(identifier);
	}
	else {
		user = await userModel.getUserByUsernameFromDb(identifier);
	}
	if (!user || !(await passwordUtils.comparePassword(password, user.password_hash))) {
		throw new ValidationError('Invalid credentials');
	}
	const { password_hash, ...userPassLess } = user;
	return userPassLess;
}

export async function createUserAccount(userData) {
	console.log('Creating a new user account');
	const { username, email, password, display_name, avatar_url } = userData;
	const existingUser = await userModel.getUserByUsernameFromDb(username);
	if (existingUser) {
		throw new ConflictError('Username already exists');
	}
	const existingEmail = await userModel.getUserByEmailFromDb(email);
	if (existingEmail) {
		throw new ConflictError('Email already exists');
	}
	const hashedPassword = await passwordUtils.hashPassword(password);

	let finalAvatarUrl = avatar_url;

	if (!finalAvatarUrl || finalAvatarUrl.trim() === "") {
		finalAvatarUrl = generateDefaultAvatarUrl(display_name);
		console.log(`No avatar provided for ${username}. Using default: ${finalAvatarUrl}`);
	}
	const newUser = await userModel.createUser({ username, email, password_hash: hashedPassword, display_name, avatar_url: finalAvatarUrl });
	return newUser;
}

export async function getAllUsers() {
	console.log('Fetching all users from the database');
	return await userModel.getAllUsersFromDb();
}

export async function getUserById(userId) {
	console.log('Fetching user by ID from the database');
	const user = await userModel.getUserByIdFromDb(userId);
	if (!user) {
		throw new NotFoundError('User not found');
	}
	return user;
}

export async function getUserByUsername(username) {
	console.log('Fetching user by username from the database');
	const user = await userModel.getUserByUsernameFromDb(username);
	if (!user) {
		throw new NotFoundError('User not found');
	}
	return user;
}

export async function getUserByEmail(email) {
	console.log('Fetching user by email from the database');
	const user = await userModel.getUserByEmailFromDb(email);
	if (!user) {
		throw new NotFoundError('User not found');
	}
	return user;
}

export async function getUserMatches(userId) {
	console.log('Fetching user matches from the database');
	const matches = await userModel.getUserMatchesFromDb(userId);
	if (!matches) {
		throw new NotFoundError('No matches found for this user');
	}
	return matches;
}

export async function updateUserProfile(userId, updates) {
	console.log(`Attempting to update profile for user ID: ${userId}`);

	const currentUser = await userModel.getUserByIdFromDb(userId);
	if (!currentUser) {
		throw new NotFoundError(`User with ID ${userId} not found`);
	}

	const processedUpdates = {};

	if (updates.hasOwnProperty('display_name')) {
		if (typeof updates.display_name === 'string' && updates.display_name.trim().length > 0) {
			processedUpdates.display_name = updates.display_name.trim();
		} else {
			console.warn(`Invalid display_name provided for user ${userId}, ignoring.`);
			throw new ValidationError('Display name cannot be empty');
		}
	}

	if (updates.hasOwnProperty('email')) {
		const potentialEmail = updates.email;
		if (potentialEmail && isValidEmailFormat(potentialEmail)) {
			processedUpdates.email = potentialEmail.trim();
		} else if (potentialEmail) { // Log only if a non-empty invalid value was provided
			console.warn(`Invalid email format provided for user ${userId}, ignoring: ${potentialEmail}`);
			throw new ValidationError('Invalid email format provided.');
		}
	}

	if (updates.hasOwnProperty('avatar_url')) {
		const potentialAvatar = updates.avatar_url;
		if (potentialAvatar && isValidHttpUrl(potentialAvatar)) {
			processedUpdates.avatar_url = potentialAvatar.trim();
		} else if (potentialAvatar) {
			console.warn(`Invalid avatar_url format provided for user ${userId}, ignoring: ${potentialAvatar}`);
			throw new ValidationError('Invalid avatar URL format provided.');
		}
	}

	const changesToApply = {};
	for (const key in processedUpdates) {
		if (processedUpdates.hasOwnProperty(key) && processedUpdates[key] !== currentUser[key]) {
			changesToApply[key] = processedUpdates[key];
		}
	}

	if (Object.keys(changesToApply).length === 0) {
		console.log(`No effective changes detected for user ${userId}. Profile remains unchanged.`);
		const { password_hash, ...userPassLess } = currentUser;
		return userPassLess;
	}

	console.log(`Applying changes for user ${userId}:`, changesToApply);

	if (changesToApply.hasOwnProperty('display_name')) {
		const existingUser = await userModel.getUserByDisplayNameFromDb(changesToApply.display_name);
		if (existingUser && existingUser.id !== userId) {
			throw new ConflictError(`Display name '${changesToApply.display_name}' is already taken.`);
		}
	}
	if (changesToApply.hasOwnProperty('email')) {
		const existingUser = await userModel.getUserByEmailFromDb(changesToApply.email);
		if (existingUser && existingUser.id !== userId) {
			throw new ConflictError(`Email '${changesToApply.email}' is already taken.`);
		}
	}

	try {
		const result = await userModel.updateUserInDb(userId, changesToApply);

		if (result.changes === 0) {
			console.warn(`Database reported 0 changes for user ${userId} despite pending updates. Returning current data.`);
			const finalUserCheck = await userModel.getUserByIdFromDb(userId);
			if (!finalUserCheck) throw new NotFoundError(`User ${userId} disappeared after update attempt.`);
			const { password_hash, ...userPassLess } = finalUserCheck;
			return userPassLess;
		}

	} catch (dbError) {
		console.error(`Database error during profile update for user ${userId}:`, dbError);
		throw new Error(`Failed to update profile for user ${userId} due to a database issue.`);
	}

	console.log(`Profile successfully updated for user ${userId}. Fetching updated data...`);
	const updatedUser = await userModel.getUserByIdFromDb(userId);
	if (!updatedUser) {
		throw new Error(`Failed to retrieve user ${userId} immediately after successful update.`);
	}
	const { password_hash, ...userPassLess } = updatedUser;
	return userPassLess;
}
