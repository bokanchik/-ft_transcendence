// Logique métier (authentification, validation, etc.), sans reply
import * as userModel from '../models/userModel.js';
import * as passwordUtils from '../utils/pswdUtils.js';
import { ConflictError, ValidationError, NotFoundError } from '../utils/appError.js';

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

// export async function loginUser({ username, password }) {
// 	console.log('Attempting');
// 	const user = await userModel.getUserByUsernameFromDb(username);
// 	if (!user || !(await passwordUtils.comparePassword(password, user.password_hash))) {
// 		throw new ValidationError('Invalid credentials');
// 	}
// 	const { password_hash, ...userPassLess } = user;
// 	return userPassLess;
// }

export async function createUserAccount(userData) {
	console.log('Creating a new user account');
	const { username, email, password, display_name } = userData;
	const existingUser = await userModel.getUserByUsernameFromDb(username);
	if (existingUser) {
		throw new ConflictError('Username already exists');
	}
	const existingEmail = await userModel.getUserByEmailFromDb(email);
	if (existingEmail) {
		throw new ConflictError('Email already exists');
	}
	const hashedPassword = await passwordUtils.hashPassword(password);
	const newUser = await userModel.createUser({ username, email, password_hash: hashedPassword, display_name });
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
