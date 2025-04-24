// Logique métier (authentification, validation, etc.), sans reply
import * as userModel from '../models/userModel.js';
import * as passwordUtils from '../utils/pswdUtils.js';

export async function loginUser({ username, password }) {
	console.log('Logging in user');
	const user = await userModel.getUserByUsernameFromDb(username);
	if (!user || !(await passwordUtils.comparePassword(password, user.password_hash))) {
		throw new Error('Invalid credentials');
	}
	const { password_hash, ...userPassLess } = user;
	return userPassLess;
}

export async function createUserAccount(userData) {
	console.log('Creating a new user account');
	const { username, email, password, display_name } = userData;
	const existingUser = await userModel.getUserByUsernameFromDb(username);
	if (existingUser) {
		throw new Error('Username already exists');
	}
	const existingEmail = await userModel.getUserByEmailFromDb(email);
	if (existingEmail) {
		throw new Error('Email already exists');
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
		throw new Error('User not found');
	}
	return user;
}

export async function getUserByUsername(username) {
	console.log('Fetching user by username from the database');
	const user = await userModel.getUserByUsernameFromDb(username);
	if (!user) {
		throw new Error('User not found');
	}
	return user;
}

export async function getUserMatches(userId) {
	console.log('Fetching user matches from the database');
	const matches = await userModel.getUserMatchesFromDb(userId);
	if (!matches) {
		throw new Error('No matches found for this user');
	}
	return matches;
}
