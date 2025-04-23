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
