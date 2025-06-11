// Gère les requêtes Fastify (req, reply)
import { FastifyRequest, FastifyReply } from 'fastify';
import * as userService from '../services/userService.js';
import { UserIdParams, UpdateUserPayload, JWTPayload } from '../shared/schemas/usersSchemas.js';

type AuthenticatedRequest = FastifyRequest & { user: JWTPayload };

export async function getUsersHandler(req: FastifyRequest, reply: FastifyReply) {
	const users = await userService.getAllUsers();
	return reply.code(200).send(users);
}

export async function getUserMeHandler(req: AuthenticatedRequest, reply: FastifyReply) {
	const user = await userService.getUserById(req.user.id);
	return reply.code(200).send(user);
}

export async function updateUserMeHandler(req: AuthenticatedRequest, reply: FastifyReply) {
	const userId = req.user.id;
	const updates = req.body as UpdateUserPayload;

	req.log.info({ userId, updates }, 'Attempting to update user profile');
	const updatedUser = await userService.updateUserProfile(userId, updates);

	return reply.code(200).send({
		message: 'User updated successfully',
		user: updatedUser
	});
}

export async function getUserInfoHandler(req: AuthenticatedRequest, reply: FastifyReply) {
	const userId = parseInt((req.params as UserIdParams).userId, 10);

	if (isNaN(userId)) {
		return reply.code(400).send({ error: 'Invalid user ID.' });
	}

	const user = await userService.getUserById(userId);
	if (!user) {
		return reply.code(404).send({ error: 'User not found.' });
	}

	return reply.code(200).send(user);
}
