// Gère les requêtes Fastify (req, reply)
import { getAllUsers, createUserAccount } from '../services/dbService.js';

export async function getUsersHandler(req, reply) {
  try {
    const users = await getAllUsers();
    return users;
  } catch (err) {
    return reply.status(500).send({
      error: 'Erreur lors de la récupération des utilisateurs',
      detail: err.message
    });
  }
}

export async function postUserHandler(req, reply) {
  try {
    const newUser = await createUserAccount(req.body);
    return newUser;
  } catch (err) {
    return reply.status(500).send({
      error: 'Erreur lors de l’insertion',
      detail: err.message
    });
  }
}

// import { getDb } from '../config/dbConfig.js';
//
// export async function getUsersHandler(req, reply) {
//   const db = getDb();
//   try {
//     const users = await db.all('SELECT * FROM users');
//     return users;
//   } catch (err) {
//     return reply.status(500).send({
//       error: 'Erreur lors de la récupération des utilisateurs',
//       detail: err.message
//     });
//   }
// }
//
// export async function postUserHandler(req, reply) {
//   const { username, email, password_hash, display_name, avatar_url = null } = req.body;
//   const db = getDb();
//
//   try {
//     const result = await db.run(
//       `INSERT INTO users (username, email, password_hash, display_name, avatar_url) VALUES (?, ?, ?, ?, ?)`,
//       [username, email, password_hash, display_name, avatar_url]
//     );
//
//     return {
//       id: result.lastID,
//       username,
//       email,
//       display_name,
//       avatar_url
//     };
//   } catch (err) {
//     return reply.status(500).send({
//       error: 'Erreur lors de l’insertion',
//       detail: err.message
//     });
//   }
// }
