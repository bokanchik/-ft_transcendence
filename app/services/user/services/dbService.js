// Logique métier (authentification, validation, etc.), sans reply
import * as userModel from '../models/userModel.js';
//import * as passwordUtils from '../utils/pswdUtils.js';
//import * as jwtUtils from '../utils/jwtUtils.js';

export async function registerUser(username, email, password, display_name, reply) {
  const existingUser = await userModel.getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const hashedPassword = await passwordUtils.hashPassword(password);
  const user = await userModel.createUser({
    username,
    email,
    password_hash: hashedPassword,
    display_name
  });

  return user;
}

export async function loginUser({ username, password }) {
  const user = await userModel.getUserByUsername(username);
  if (!user || !(await passwordUtils.comparePassword(password, user.password_hash))) {
    throw new Error('Invalid credentials');
  }

  const token = jwtUtils.generateJWT({
    id: user.id,
    username: user.username
  });

  return token;
}

export async function getAllUsers() {
  return await userModel.getAllUsersFromDb();
}

export async function createUserAccount(userData) {
  return await userModel.insertUserIntoDb(userData);
}
