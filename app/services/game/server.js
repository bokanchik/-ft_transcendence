import Fastify from 'fastify'
import { Server } from 'socket.io';
import db from './database/connectDB.js'
import matchRoutes from './routes/matchRoutes.js'
import { matchSocketHandler } from '../sockets/matchSocketHandler.js';
// import settingsRoutes from './routes/settings.js'

const fastify = Fastify({
    logger:true
});

const io = new Server(fastify.server, {
    cors: {
      origin: "*",
    }
});

// attach io to fastify instance
fastify.decorate('io', io);

// declare routes for game service
fastify.register(matchRoutes, {
    prefix: '/api/game/1v1'
});

fastify.ready().then(() => {
  matchSocketHandler(io);
})
// fastify.register(settingsRoutes); ?

const start = async () => {
  try {
    await db;

    await fastify.listen({
      port: 3001,
      host: '0.0.0.0',
    })
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

export default fastify;