// Gère les requêtes Fastify (req, reply)
import { FastifyRequest, FastifyReply } from 'fastify';
import * as userService from '../services/userService.js'; // userService avec alias
import { User } from '../services/types.js';
import { UpdateUserProfileData } from '../services/userService.js'; // Importez le type du payload de mise à jour

// Pour getUsersHandler, le type de retour est implicite par le service
export async function getUsersHandler(req: FastifyRequest, reply: FastifyReply) {
	const users = await userService.getAllUsers();
	return reply.code(200).send(users);
}

// req.user est typé grâce à la déclaration de module Fastify
export async function getUserMeHandler(req: FastifyRequest, reply: FastifyReply) {
	const user = await userService.getUserById(req.user.id); // req.user.id est number
	return reply.code(200).send(user);
}

export async function getUserMeMatchHandler(req: FastifyRequest, reply: FastifyReply) {
	const matches = await userService.getUserMatches(req.user.id);
	return reply.code(200).send(matches);
}

// Supprime l'interface UpdateUserMeRequest

export async function updateUserMeHandler(req: FastifyRequest, reply: FastifyReply) {
    const userId = req.user.id;
    const updates = req.body as UpdateUserProfileData;

    req.log.info({ userId, updates }, 'Attempting to update user profile');
    const updatedUser = await userService.updateUserProfile(userId, updates);

    return reply.code(200).send({
        message: 'User updated successfully',
        user: updatedUser
    });
}
