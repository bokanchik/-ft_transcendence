import { getUsersHandler, getUserMeHandler, getUserMeMatchHandler } from '../handlers/userHandlers.js';

export default async function userRoutes(fastify, options) {
	fastify.get('/', getUsersHandler);
//	fastify.get('/me', getUserMeHandler);
	fastify.get('/me', { onRequest: [fastify.authenticate] }, getUserMeHandler);
	fastify.get('/me/matches', getUserMeMatchHandler);
}
