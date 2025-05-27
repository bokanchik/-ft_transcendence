import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import {
	getUsersHandler,
	getUserMeHandler,
	getUserInfoHandler,
	getUserMeMatchHandler,
	updateUserMeHandler,
} from '../handlers/userHandlers.js';
import { UpdateUserPayload } from '../shared/types.js';
import { config } from '../shared/env.js';
import { updateUserSchema, userIdParamSchema, userResponseSchema } from '../schemas/userSchemas.js';


export default async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {

	fastify.get(
		config.URL_ALL_USERS,
		getUsersHandler
	);

	fastify.get(
		config.URL_USER_ME,
		{ onRequest: [fastify.authenticate] },
		getUserMeHandler
	);

	fastify.get<{ Params: { userId: string } }>(
		config.URL_USER,
		{
			onRequest: [fastify.authenticate],
			schema: {
				params: userIdParamSchema.params,
				response: {
					200: userResponseSchema
				}
			}
		},
		getUserInfoHandler
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
