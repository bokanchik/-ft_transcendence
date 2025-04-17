// routes/index.js
import userRoutes from './user.js';

export default async function routes(fastify, options) {
  fastify.register(userRoutes);
}

