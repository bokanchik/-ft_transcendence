import { registerHandler, loginHandler } from '../handlers/authHandlers.js';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';

async function authRoute (fastify, options) {
  fastify.post('/api/auth/register', { schema: registerSchema }, registerHandler);
  fastify.post('/api/auth/login', { schema: loginSchema }, loginHandler);
}

export default authRoute
