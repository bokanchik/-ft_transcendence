import { getUsersHandler, registerHandler, getUserMeHandler, getUserMeMatchHandler } from '../handlers/userHandlers.js';
import { registerSchema } from '../schemas/userSchemas.js';

export default async function userRoutes(fastify, options) {
	fastify.get('/users/', getUsersHandler);
	fastify.get('/users/me', getUserMeHandler);
	fastify.get('/users/me/matches', getUserMeMatchHandler);
	fastify.post('/users', { schema: registerSchema }, registerHandler);
}
