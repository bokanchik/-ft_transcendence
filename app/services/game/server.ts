import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { Server, Socket } from 'socket.io';
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import fastifyRateLimit from '@fastify/rate-limit'
// @ts-ignore
import authPlugin from './shared/auth-plugin/index.ts';
import db from './database/connectDB.ts'
// import { gameShemas } from './schemas/matchSchemas.ts'; TODO
import matchRoutes from './routes/matchRoutes.ts'
import { matchSocketHandler } from './sockets/matchSocketHandler.ts';
// import settingsRoutes from './routes/settings.ts' TODO


const fastify: FastifyInstance = Fastify({ logger: true });

// Initilize socket.io
const io: Server = new Server(fastify.server, {
  // cors -> dit au server depuis quels domains/ports il peut charger les resources 
    cors: {
      origin: "http://localhost:5000", // l'url du frontend
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type, Authorization"],
      credentials: true,
    },
});

// Attach io to fastify instance
fastify.decorate('io', io);

// Register auth plugin
const registerAuthPlugin = async () => {
  try {
    await fastify.register(authPlugin);
    fastify.log.info('Auth plugin registered');
  } catch (err) {
    fastify.log.error({ err }, 'Failed to register auth plugin.');
    process.exit(1);
  }
};

// Set rate-limit to avoid too many requests (protection)
fastify.register(fastifyRateLimit, {
  max: 10,
  timeWindow: '1 minute',
});

// Add schema validator and serializer
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Register routes
const registerRoutes = () => {
  fastify.register(matchRoutes, { prefix: '/match' });
  // fastify.register(settingsRoutes); TODO
};

// Start server game and setup socket.io
const start = async () => {
  try {
    await db; // connect to database
    fastify.log.info('Connected to database');
      
    await fastify.ready(); // wait for all plugins to be ready
    
    fastify.io.on('connection', (socket: Socket) => {
      matchSocketHandler(socket);
    });
      
    fastify.log.info('Socket server is ready');
      
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
      fastify.log.error(err);
      process.exit(1);
  }
};

const run = async() => {
  await registerAuthPlugin();
  registerRoutes();
  start();
};

run();

export { fastify } ; // Export the io instance for use in other modules
