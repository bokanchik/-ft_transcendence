import Fastify, {  FastifyInstance,  FastifyReply, FastifyRequest } from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import fastifyRateLimit from '@fastify/rate-limit';
import { tournamentRoutes } from './routes/tournaments.ts';
//@ts-ignore
import { setupPlugins } from './shared/auth-plugin/tokens.js'

const fastify: FastifyInstance = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

// set rate-limit to avoid too many requests
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
  
  fastify.register(tournamentRoutes, { prefix: '/api/tournament/' });
 
  fastify.log.info('Routes registred');
};

// Start server game and setup socket.io
const start = async () => {
  try {

    await fastify.ready(); // wait for all plugins to be ready    

    await fastify.listen({ port: 6001, host: '0.0.0.0' });

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

export { fastify } ; // Export the io instance for use in other modules
