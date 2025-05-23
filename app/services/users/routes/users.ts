import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
	getUsersHandler,
	getUserMeHandler,
	getUserMeMatchHandler,
	updateUserMeHandler,
} from '../handlers/userHandlers.js';
import { UpdateUserPayload } from '../shared/types.js';
import { config } from '../shared/env.js';
import { updateUserSchema } from '../schemas/userSchemas.js';


export default async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

	fastify.get(
		config.URL_ALL_USERS,
		getUsersHandler
	);

	fastify.get(
		config.URL_USER,
		{ onRequest: [fastify.authenticate] },
		getUserMeHandler
	);

	fastify.patch<{ Body: UpdateUserPayload }>(
		config.URL_USER,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: updateUserSchema
		},
		updateUserMeHandler
	);

	fastify.get(
		config.URL_USER_MATCH,
		{ onRequest: [fastify.authenticate] },
		getUserMeMatchHandler
	);
}
