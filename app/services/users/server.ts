import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { validatorCompiler, serializerCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { config } from './shared/env.js';
import { initializeDb } from './utils/dbConfig.js';
import { setupPlugins } from './shared/auth-plugin/tokens.js';
import { setupErrorHandler } from './utils/appError.js';
import friendRoutes from './routes/friends.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';


// const fastify: FastifyInstance = Fastify({ logger: { level: config.LOG_LEVEL } });
const fastify: FastifyInstance = Fastify({ logger: { level: config.LOG_LEVEL } }).withTypeProvider<ZodTypeProvider>();

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

function setupHooks(): void {
	fastify.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
		if (fastify.log.level === 'trace') {
			req.log.trace({ path: req.raw.url, cookies: req.cookies, headers: req.headers }, '[Logging Hook]');
		} else {
			req.log.debug({ path: req.raw.url, method: req.method }, '[Request Received]');
		}
	});
	fastify.log.info('Logging onRequest hook registered');
}

function setupRoutes(): void {
	fastify.get('/api/users/csrf-token', async (request: FastifyRequest, reply: FastifyReply) => {
		const token: string = await reply.generateCsrf();
		request.log.debug(`[CSRF Endpoint] Token CSRF fourni au client: ${token}`);
		return { csrfToken: token };
	});
	fastify.log.info('CSRF token endpoint /api/users/csrf-token registered');

	fastify.register(userRoutes);
	fastify.register(authRoutes);
	fastify.register(friendRoutes);
	fastify.log.info('Routes registered');
}

async function buildApp(): Promise<FastifyInstance> {
	try {
		await initializeDb();
		fastify.log.info('Database initialized');
		await setupPlugins(fastify);
		setupHooks();
		setupRoutes();
		setupErrorHandler(fastify);
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
