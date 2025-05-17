// Gère les requêtes Fastify (req, reply)
import { FastifyRequest, FastifyReply } from 'fastify';
import * as userService from '../services/userService.js';
import { UpdateUserPayload } from '../shared/types.js';

export async function getUsersHandler(req: FastifyRequest, reply: FastifyReply) {
	const users = await userService.getAllUsers();
	return reply.code(200).send(users);
}

export async function getUserMeHandler(req: FastifyRequest, reply: FastifyReply) {
	const user = await userService.getUserById(req.user.id);
	return reply.code(200).send(user);
}

export async function getUserMeMatchHandler(req: FastifyRequest, reply: FastifyReply) {
	const matches = await userService.getUserMatches(req.user.id);
	return reply.code(200).send(matches);
}

export async function updateUserMeHandler(req: FastifyRequest, reply: FastifyReply) {
	const userId = req.user.id;
	const updates = req.body as UpdateUserPayload;

	req.log.info({ userId, updates }, 'Attempting to update user profile');
	const updatedUser = await userService.updateUserProfile(userId, updates);

	return reply.code(200).send({
		message: 'User updated successfully',
		user: updatedUser
	});
}
