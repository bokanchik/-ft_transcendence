import { getUsersHandler, getUserMeHandler, getUserMeMatchHandler } from '../handlers/userHandlers.js';

export default async function userRoutes(fastify, options) {
	fastify.get('/users/', getUsersHandler);
	fastify.get('/users/me', getUserMeHandler);
	fastify.get('/users/me/matches', getUserMeMatchHandler);
}
