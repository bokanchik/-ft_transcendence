import { registerHandler, loginHandler } from '../handlers/authHandlers.js';
import { registerSchema, loginSchema } from '../schemas/userSchemas.js';

export default async function authRoute(fastify, options) {
	fastify.post('/users/auth/login', { schema: loginSchema }, loginHandler);
	fastify.post('/users/auth/register', { schema: registerSchema }, registerHandler);
}
