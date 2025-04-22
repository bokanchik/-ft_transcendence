import { getUsersHandler, postUserHandler } from '../handlers/userHandlers.js';
import { postUserSchema } from '../schemas/userSchemas.js';

async function userRoutes(fastify, options) {
  fastify.get('/api/users/', getUsersHandler);


  fastify.post('/api/users', { schema: postUserSchema }, postUserHandler);
}

export default userRoutes;

