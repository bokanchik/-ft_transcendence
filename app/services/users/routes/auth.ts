import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { config } from '../shared/env.js'
import * as ah from '../handlers/authHandlers.js';
import * as tfah from '../handlers/twoFactorAuthHandlers.js';
import * as as from '../shared/schemas/usersSchemas.js';

export default async function authRoute(fastify: FastifyInstance, options: FastifyPluginOptions) {
	fastify.post(
		config.URL_LOGIN,
		{
			schema: as.LoginRouteSchema,
			handler: ah.loginHandler
		},
	);
	fastify.post(
		config.URL_REGISTER,
		{
			schema: as.RegisterRouteSchema,
			handler: ah.registerHandler
		},
	);
	fastify.post(
		config.URL_LOGOUT,
		{
			schema: as.LogoutRouteSchema,
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			handler: ah.logoutHandler
		},
	);
	fastify.post(
		config.URL_2FA_GENERATE,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: as.Generate2FARouteSchema,
			handler: tfah.generate2FAHandler
		},
	);
	fastify.post(
		config.URL_2FA_VERIFY,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: as.Verify2FARouteSchema,
			handler: tfah.verify2FAHandler
		},
	);
	fastify.post(
		config.URL_2FA_DISABLE,
		{
			onRequest: [fastify.authenticate, fastify.csrfProtection],
			schema: as.Disable2FARouteSchema,
			handler: tfah.disable2FAHandler
		},
	);
	fastify.post(
		config.URL_2FA_LOGIN,
		{
			schema: as.Login2FARouteSchema,
			handler: tfah.login2FAHandler
		},
	);
	fastify.get(
        config.URL_CSRF,
        {
            schema: as.GetCsrfTokenRouteSchema,
            handler: ah.getCsrfTokenHandler
        }
    );
}
