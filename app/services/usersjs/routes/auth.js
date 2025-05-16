import {
	registerHandler,
	loginHandler
} from '../handlers/authHandlers.js';

import {
	registerSchema,
	loginSchema
} from '../schemas/userSchemas.js';

export default async function authRoute(fastify, options) {
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
}
