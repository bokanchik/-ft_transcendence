import { getUsersHandler, getUserMeHandler, getUserMeMatchHandler, updateUserMeHandler } from '../handlers/userHandlers.js';
import { updateUserSchema } from '../schemas/userSchemas.js';

export default async function userRoutes(fastify, options) {
	fastify.get('/', getUsersHandler);
	fastify.get('/me', { onRequest: [fastify.authenticate] }, getUserMeHandler);
	fastify.patch('/me', { onRequest: [fastify.authenticate], schema: updateUserSchema }, updateUserMeHandler);
	fastify.get('/me/matches', getUserMeMatchHandler);
}
