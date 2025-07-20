import Fastify, {  FastifyInstance,  FastifyReply, FastifyRequest } from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import fastifyRateLimit from '@fastify/rate-limit';
import { Server, Socket } from 'socket.io';
import db from './database/connectDB.ts'
import matchRoutes from './routes/matchRoutes.ts'
import { matchSocketHandler } from './pong/matchSocketHandler.ts';
// @ts-ignore
import { setupPlugins } from './shared/auth-plugin/tokens.js'


const fastify: FastifyInstance = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

// Initialize socket.io
const io: Server = new Server(fastify.server, {
    path: "/socket-client/"
});

// Attach io to fastify instance
fastify.decorate('io', io);

// Set rate-limit to avoid too many requests (protection)
fastify.register(fastifyRateLimit, {
  max: 50,
  timeWindow: '1 minute',
});

// Add schema validator and serializer
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

// Register routes
const registerRoutes = () => {
  fastify.get('/api/users/csrf-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const token: string = await reply.generateCsrf();
		request.log.debug(`[CSRF Endpoint] Token CSRF fourni au client: ${token}`);
		return { csrfToken: token };
  })
  
  fastify.register(matchRoutes, { prefix: '/api/game/' });
  fastify.log.info('Routes registred');
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
  } catch (err: unknown) {
      fastify.log.error(`Error while configuring game server: ${err}`);
      process.exit(1);
  }
};

const run = async() => {
  await setupPlugins(fastify);
  registerRoutes();
  start();
};

run();

export { fastify } ;
