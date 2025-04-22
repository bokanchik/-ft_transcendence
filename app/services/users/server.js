import Fastify from 'fastify';
import { initializeDb } from './config/dbConfig.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js'

const fastify = Fastify({ logger: true });

fastify.register(userRoutes);
fastify.register(authRoutes);

const start = async () => {
  await initializeDb(); // Initialiser la base de données
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    console.log('Serveur démarré sur https://KingPong.fr');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
