// Gère les requêtes Fastify (req, reply)
import { getAllUsers, getUserById, getUserMatches } from '../services/userService.js';

export async function getUsersHandler(reply) {
	try {
		const users = await getAllUsers();
		return users;
	} catch (err) {
		console.error('Erreur lors de la récupération des utilisateurs:', err);
		return reply.status(500).send({ error: 'Erreur lors de la récupération des utilisateurs', });
	}
}

export async function getUserMeHandler(req, reply) {
	try {
		const user = await getUserById(req.user.id);
		return user;
	} catch (err) {
		console.error('Erreur lors de la récupération de l’utilisateur:', err);
		return reply.status(500).send({ error: 'Erreur lors de la récupération de l’utilisateur', });
	}
}

export async function getUserMeMatchHandler(req, reply) {
	try {
		const matches = await getUserMatches(req.user.id);
		return matches;
	} catch (err) {
		console.error('Erreur lors de la récupération des matchs de l’utilisateur:', err);
		return reply.status(500).send({ error: 'Erreur lors de la récupération des matchs', });
	}
}
