import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as uh from '../handlers/userHandlers.js';
import { config } from '../shared/env.js';
import * as us from '../shared/schemas/usersSchemas.js';


export default async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.get(
		config.URL_ALL_USERS,
		{
			onRequest: [fastify.authenticate],
			schema: us.GetUsersListRouteSchema,
			handler: uh.getUsersHandler
		},
	);
	fastify.get(
		config.URL_USER_ME,
		{
			onRequest: [fastify.authenticate],
			schema: us.GetMeRouteSchema,
			handler: uh.getUserMeHandler
		},
	);
	fastify.get(
		config.URL_USER,
		{
			onRequest: [fastify.authenticate],
			schema: us.GetUserByIdRouteSchema,
			handler: uh.getUserInfoHandler
		},
	);
	fastify.patch(
		config.URL_USER_ME,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: us.UpdateUserRouteSchema,
			handler: uh.updateUserMeHandler
		},
	);
	fastify.patch(
        config.URL_USER_STATS,
        {
            // onRequest: [fastify.authenticate, fastify.csrfProtection],
			onRequest: [fastify.authenticateService],
            schema: us.UpdateUserStatsRouteSchema,
            handler: uh.updateUserStatsHandler
        }
    );
}
