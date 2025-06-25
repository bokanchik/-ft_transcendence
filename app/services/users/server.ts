import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { validatorCompiler, serializerCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { config } from './shared/env.js';
import { initializeDb } from './utils/dbConfig.js';
import { setupPlugins } from './shared/auth-plugin/tokens.js';
import { setupErrorHandler } from './utils/appError.js';
import friendRoutes from './routes/friends.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';


const fastify: FastifyInstance = Fastify({ logger: { level: config.LOG_LEVEL } }).withTypeProvider<ZodTypeProvider>();

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

function setupRoutes(): void {
	fastify.register(userRoutes);
	fastify.register(authRoutes);
	fastify.register(friendRoutes);
	fastify.log.info('Routes registered');
}

async function buildApp(): Promise<FastifyInstance> {
	try {
		await initializeDb();
		await setupPlugins(fastify);
		setupErrorHandler(fastify);
		setupRoutes();
		return fastify;
	} catch (err: any) {
		fastify.log.error({ err: err.message, stack: err.stack }, 'Error initializing app');
		process.exit(1);
	}
}

async function start() {
	let app: FastifyInstance | undefined;
	try {
		app = await buildApp();
		await app.listen({ port: config.API_USER_PORT, host: '0.0.0.0' });
		const address = app.server.address();
		const port = typeof address === 'string' ? address : (address?.port);
		app.log.info(`Server listening on ${port || 'unknown port'}`);
	} catch (err: any) {
		const logger = app?.log || console;
		logger.error({ err: err.message, stack: err.stack }, 'Failed to start server:');
		process.exit(1);
	}
}

start();