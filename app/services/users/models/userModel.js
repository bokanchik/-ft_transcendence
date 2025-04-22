// Accès à la base de données (getUserByUsername, etc.)
import { getDb } from '../config/dbConfig.js';

export async function getUserByUsername(username) {
  const db = getDb();
  return db.get('SELECT * FROM users WHERE username = ?', [username]);
}

export async function createUser({ username, email, password_hash, display_name }) {
  const db = getDb();
  const result = await db.run(
    `INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)`,
    [username, email, password_hash, display_name]
  );
  return { id: result.lastID };
}

export async function getAllUsersFromDb() {
  const db = getDb();
  return db.all('SELECT * FROM users');
}

export async function insertUserIntoDb({ username, email, password_hash, display_name, avatar_url = null }) {
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
