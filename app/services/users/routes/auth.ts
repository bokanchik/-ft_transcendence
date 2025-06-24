import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { config } from '../shared/env.js'
import * as ah from '../handlers/authHandlers.js';
import * as tfah from '../handlers/twoFactorAuthHandlers.js';
import { RegisterRouteSchema, LoginRouteSchema, LogoutRouteSchema } from '../shared/schemas/usersSchemas.js';

export default async function authRoute(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.post(
		config.URL_LOGIN,
		{
			schema: LoginRouteSchema,
			handler: ah.loginHandler
		},
	);
	fastify.post(
		config.URL_REGISTER,
		{
			schema: RegisterRouteSchema,
			handler: ah.registerHandler
		},
	);
	fastify.post(
		config.URL_LOGOUT,
		{
			schema: LogoutRouteSchema,
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			handler: ah.logoutHandler
		},
	);
	fastify.post(
		'/api/users/2fa/generate',
		{
			onRequest: [fastify.authenticate],
			handler: tfah.generate2FAHandler
		},
	);
	fastify.post(
		'/api/users/2fa/verify',
		{
			onRequest: [fastify.authenticate],
			handler: tfah.verify2FAHandler
		},
	);
	fastify.post(
		'/api/users/2fa/login',
		{
			handler: tfah.login2FAHandler
		},
	);
}
