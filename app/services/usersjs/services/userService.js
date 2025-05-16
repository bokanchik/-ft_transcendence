// Logique métier (authentification, validation, etc.), sans reply
import * as userModel from '../models/userModel.js';
import * as passwordUtils from '../utils/pswdUtils.js';
import { ConflictError, ValidationError, NotFoundError } from '../utils/appError.js';

/**
 * Generates a default avatar URL using ui-avatars.com.
 * @param {string} name - The name to use for generating the avatar.
 * @returns {string} The generated avatar URL.
 */
function generateDefaultAvatarUrl(name) {
    const encodedName = encodeURIComponent(name);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128`;
}

/**
 * Checks if a string is a valid HTTP/HTTPS URL.
 * @param {string} urlString - The string to validate.
 * @returns {boolean} True if valid, false otherwise.
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
 * Checks if a string is a valid email format.
 * @param {string} emailString - The string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidEmailFormat(emailString) {
    if (typeof emailString !== 'string') return false;
    return emailString.includes('@') && emailString.length > 3;
}

/**
 * Logs in a user by verifying their credentials.
 * @param {Object} params - The login parameters.
 * @param {string} params.identifier - The username or email of the user.
 * @param {string} params.password - The user's password.
 * @throws {ValidationError} If the credentials are invalid.
 * @returns {Promise<Object>} The user object without the password hash.
 */
export async function loginUser({ identifier, password }) {
    console.log(`Attempting to log user with identifier: ${identifier}`);
    let user;
    const isEmail = identifier.includes('@');
    if (isEmail) {
        user = await userModel.getUserByEmailFromDb(identifier);
    } else {
        user = await userModel.getUserByUsernameFromDb(identifier);
    }

    if (!user || !(await passwordUtils.comparePassword(password, user.password_hash))) {
        throw new ValidationError('Invalid username/email or password.');
    }

    const { password_hash, ...userPassLess } = user;
    return userPassLess;
}

/**
 * Creates a new user account.
 * @param {Object} userData - The user data for account creation.
 * @param {string} userData.username - The username of the new user.
 * @param {string} userData.email - The email of the new user.
 * @param {string} userData.password - The password of the new user.
 * @param {string} userData.display_name - The display name of the new user.
 * @param {string} [userData.avatar_url] - The avatar URL of the new user.
 * @throws {ConflictError} If the username or email already exists.
 * @returns {Promise<Object>} The created user object.
 */
export async function createUserAccount(userData) {
    console.log('Creating a new user account');
    const { username, email, password, display_name, avatar_url } = userData;

    const existingUser = await userModel.getUserByUsernameFromDb(username);
    if (existingUser) {
        throw new ConflictError('Username already exists.');
    }

    const existingEmail = await userModel.getUserByEmailFromDb(email);
    if (existingEmail) {
        throw new ConflictError('Email already exists.');
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

/**
 * Retrieves all users from the database.
 * @returns {Promise<Array>} A list of all users.
 */
export async function getAllUsers() {
    console.log('Fetching all users from the database');
    return await userModel.getAllUsersFromDb();
}

/**
 * Retrieves a user by their ID.
 * @param {number} userId - The ID of the user to retrieve.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<Object>} The user object.
 */
export async function getUserById(userId) {
    console.log('Fetching user by ID from the database');
    const user = await userModel.getUserByIdFromDb(userId);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    return user;
}

/**
 * Retrieves a user by their username.
 * @param {string} username - The username of the user to retrieve.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<Object>} The user object.
 */
export async function getUserByUsername(username) {
    console.log('Fetching user by username from the database');
    const user = await userModel.getUserByUsernameFromDb(username);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    return user;
}

/**
 * Retrieves a user by their email.
 * @param {string} email - The email of the user to retrieve.
 * @throws {NotFoundError} If the user does not exist.
 * @returns {Promise<Object>} The user object.
 */
export async function getUserByEmail(email) {
    console.log('Fetching user by email from the database');
    const user = await userModel.getUserByEmailFromDb(email);
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
export async function getUserMatches(userId) {
    console.log('Fetching user matches from the database');
    const matches = await userModel.getUserMatchesFromDb(userId);
    if (!matches) {
        throw new NotFoundError('No matches found for this user');
    }
    return matches;
}

/**
 * Updates the profile of a user.
 * @param {number} userId - The ID of the user to update.
 * @param {Object} updates - The updates to apply to the user's profile.
 * @param {string} [updates.display_name] - The new display name for the user.
 * @param {string} [updates.email] - The new email for the user.
 * @param {string} [updates.avatar_url] - The new avatar URL for the user.
 * @throws {NotFoundError} If the user does not exist.
 * @throws {ValidationError} If the updates are invalid.
 * @throws {ConflictError} If the updated email or display name is already taken.
 * @returns {Promise<Object>} The updated user object without the password hash.
 */
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
            throw new ValidationError('Display name cannot be empty');
        }
    }

    if (updates.hasOwnProperty('email')) {
        const potentialEmail = updates.email;
        if (potentialEmail && isValidEmailFormat(potentialEmail)) {
            processedUpdates.email = potentialEmail.trim();
        } else {
            throw new ValidationError('Invalid email format provided.');
        }
    }

    if (updates.hasOwnProperty('avatar_url')) {
        const potentialAvatar = updates.avatar_url;
        if (potentialAvatar && isValidHttpUrl(potentialAvatar)) {
            processedUpdates.avatar_url = potentialAvatar.trim();
        } else {
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
            const finalUserCheck = await userModel.getUserByIdFromDb(userId);
            if (!finalUserCheck) throw new NotFoundError(`User ${userId} disappeared after update attempt.`);
            const { password_hash, ...userPassLess } = finalUserCheck;
            return userPassLess;
        }

    } catch (dbError) {
        console.error(`Database error during profile update for user ${userId}:`, dbError);
        throw new Error(`Failed to update profile for user ${userId} due to a database issue.`);
    }

    const updatedUser = await userModel.getUserByIdFromDb(userId);
    if (!updatedUser) {
        throw new Error(`Failed to retrieve user ${userId} immediately after successful update.`);
    }
    const { password_hash, ...userPassLess } = updatedUser;
    return userPassLess;
}
