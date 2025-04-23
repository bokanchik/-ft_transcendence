import Fastify from 'fastify'
import db from './database/connectDB.js'
import matchRoutes from './routes/match.js'
// import settingsRoutes from './routes/settings.js'

const fastify = Fastify({
    logger:true
});

// declare routes for game service
fastify.register(matchRoutes);

// fastify.register(settingsRoutes); ?

const start = async () => {
  try {
    if (!db) {
      throw new Error('Failed to connect to the database');
    }
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