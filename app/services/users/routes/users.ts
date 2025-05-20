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
	fastify.get('/', getUsersHandler);

	fastify.get('/me',
		{ onRequest: [fastify.authenticate] },
		getUserMeHandler
	);

	fastify.patch<{ Body: UpdateUserPayload }>('/me',
		{
            onRequest: [fastify.authenticate, fastify.csrfProtection],
            schema: updateUserSchema
        },
		updateUserMeHandler
	);

	fastify.get('/me/matches',
        { onRequest: [fastify.authenticate] },
		getUserMeMatchHandler
	);
}
