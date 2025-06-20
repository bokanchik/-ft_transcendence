import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as uh from '../handlers/userHandlers.js';
import { config } from '../shared/env.js';
import { UpdateUserRouteSchema, GetUserByIdRouteSchema, GetUsersListRouteSchema, GetMeRouteSchema } from '../shared/schemas/usersSchemas.js';


export default async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.get(
		config.URL_ALL_USERS,
		{
			onRequest: [fastify.authenticate],
			schema: GetUsersListRouteSchema,
			handler: uh.getUsersHandler
		},
	);
	fastify.get(
		config.URL_USER_ME,
		{
			onRequest: [fastify.authenticate],
			schema: GetMeRouteSchema,
			handler: uh.getUserMeHandler
		},
	);
	fastify.get(
		config.URL_USER,
		{
			onRequest: [fastify.authenticate],
			schema: GetUserByIdRouteSchema,
			handler: uh.getUserInfoHandler
		},
	);
	fastify.patch(
		config.URL_USER_ME,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: UpdateUserRouteSchema,
			handler: uh.updateUserMeHandler
		},
	);
}
