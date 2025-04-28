// Gère les requêtes Fastify (req, reply)
import { getAllUsers, getUserById, getUserMatches } from '../services/userService.js';

export async function getUsersHandler(req, reply) {
	const users = await getAllUsers();
	return reply.code(200).send(users);
}

export async function getUserMeHandler(req, reply) {
	const user = await getUserById(req.user.id);
	return reply.code(200).send(user);
}

export async function getUserMeMatchHandler(req, reply) {
	const matches = await getUserMatches(req.user.id);
	return reply.code(200).send(matches);
}
