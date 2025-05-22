import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
	getUsersHandler,
	getUserMeHandler,
	getUserMeMatchHandler,
	updateUserMeHandler,
} from '../handlers/userHandlers.js';
import { UpdateUserPayload } from '../shared/types.js';
import { updateUserSchema } from '../schemas/userSchemas.js';

export default async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
	const URL_ALL_USERS = process.env.URL_ALL_USERS;
	const URL_USER = process.env.URL_USER;
	const URL_USER_MATCH = process.env.URL_USER_MATCH;

	if (!URL_ALL_USERS) {
		throw new Error('Missing required environment variable: URL_ALL_USERS');
	}
	if (!URL_USER) {
		throw new Error('Missing required environment variable: URL_USER');
	}
	if (!URL_USER_MATCH) {
		throw new Error('Missing required environment variable: URL_USER_MATCH');
	}

	fastify.get(URL_ALL_USERS, getUsersHandler);

	fastify.get(URL_USER,
		{ onRequest: [fastify.authenticate] },
		getUserMeHandler
	);

	fastify.patch<{ Body: UpdateUserPayload }>(URL_USER,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: updateUserSchema
		},
		updateUserMeHandler
	);

	fastify.get(URL_USER_MATCH,
		{ onRequest: [fastify.authenticate] },
		getUserMeMatchHandler
	);
}