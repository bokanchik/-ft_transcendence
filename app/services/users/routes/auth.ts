import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { config } from '../shared/env.js'
import { loginHandler, logoutHandler, registerHandler } from '../handlers/authHandlers.js';
import { registerSchema, loginSchema, logoutSchema } from '../schemas/userSchemas.js';


export default async function authRoute(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.post(
		config.URL_LOGIN,
		{ schema: loginSchema },
		loginHandler
	);
	fastify.post(
		config.URL_REGISTER,
		{ schema: registerSchema },
		registerHandler
	);
	fastify.post(
		config.URL_LOGOUT,
		{
			schema: logoutSchema,
			onRequest: [fastify.authenticate, fastify.csrfProtection],
		},
		logoutHandler
	);
}
