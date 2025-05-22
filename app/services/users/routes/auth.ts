import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { loginHandler, logoutHandler, registerHandler } from '../handlers/authHandlers.js';
import { registerSchema, loginSchema, logoutSchema } from '../schemas/userSchemas.js';

export default async function authRoute(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.post(
		'/login',
		{ schema: loginSchema },
		loginHandler
	);
	fastify.post(
		'/register',
		{ schema: registerSchema },
		registerHandler
	);
	fastify.post(
		'/logout',
		{ schema: logoutSchema },
		logoutHandler
	);
}
