import Fastify from 'fastify'
import { Server } from 'socket.io';
import db from './database/connectDB.js'
import matchRoutes from './routes/matchRoutes.js'
import { matchSocketHandler } from './sockets/matchSocketHandler.js';
import authPlugin from 'shared-auth-plugin';
// import settingsRoutes from './routes/settings.js' TODO

const fastify = Fastify({ logger:true });

// initilize socket.io
const io = new Server(fastify.server, {
    cors: {
      origin: "*", // dev option
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
     // credentials: true, rajouter a la production + changer le origin
    }
});

// attach io to fastify instance
fastify.decorate('io', io);

// register auth plugin
try {
  await fastify.register(authPlugin);
  fastify.log.info('Auth plugin registered');
} catch (err) {
  fastify.log.error({ err }, 'Failed to register auth plugin.');
  process.exit(1); // Relancer bonne pratique ?
}

// register routes
fastify.register(matchRoutes, { prefix: '/1v1' });
// fastify.register(settingsRoutes); TODO

// start server game and setup socket.io
const start = async () => {
  try {
    await db; // connect to database
    fastify.log.info('Connected to database');
      
    await fastify.ready();
    fastify.io.on('connection', matchSocketHandler)
    fastify.log.info('Socket server is ready');
      
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
      fastify.log.error(err);
      process.exit(1);
  }
};

start();

export default fastify;