import Fastify from 'fastify';
import dotenv from 'dotenv';
import { initializeDb } from './utils/dbConfig.js';
import {
	registerJWTPlugin,
	cookieOptions,
	jwtToken,
	registerCookiePlugin,
	registerCsrfPlugin,
} from './utils/tokens.js';

import friendRoutes from './routes/friends.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js';
import { AppError } from './utils/appError.js';
import { ERROR_MESSAGES } from './utils/errorMessages.js';


dotenv.config();

const fastify = Fastify({ logger: { level: 'debug' } });

async function setupPlugins() {
	await registerCookiePlugin(fastify);
	await registerJWTPlugin(fastify);
	fastify.decorate("authenticate", async function(request, reply) {
		try {
			await request.jwtVerify();
		} catch (err) {
			fastify.log.warn('JWT verification failed: ', err);
			reply.clearCookie(jwtToken, cookieOptions);
			reply.code(401).send({ error: 'Unauthorized' });
		}
	});
	fastify.log.info('JWT & authenticate plugin registered');
	await registerCsrfPlugin(fastify);

}

function setupHooks() {
	fastify.addHook('onRequest', async (req, reply) => {
		fastify.log.debug({ path: req.raw.url, cookies: req.cookies, headers: req.headers }, '[Logging Hook]');
	});
	fastify.log.info('Logging onRequest hook registered');
}

function setupRoutes() {
	fastify.get('/api/users/csrf-token', async (request, reply) => {
		const token = await reply.generateCsrf();
		request.log.debug(`[CSRF Endpoint] Token CSRF fourni au client: ${token}`);
		return { csrfToken: token };
	});
	fastify.log.info('CSRF token endpoint /api/csrf-token registered');

	fastify.register(userRoutes, { prefix: '/api/users' });
	fastify.register(authRoutes, { prefix: '/api/users/auth' });
	fastify.register(friendRoutes, { prefix: '/api/friends' });
	fastify.log.info('Routes registered');
}

function setupErrorHandler() {
	fastify.setErrorHandler(function(error, request, reply) {
		request.log.error(error);
		const statusCode = error instanceof AppError ? error.statusCode : 500;
		const message = error.message || ERROR_MESSAGES.DATABASE_ERROR;
		reply.code(statusCode).send({
			error: message,
			statusCode: statusCode,
		});
	});
	fastify.log.info('Error handler registered');
}

async function buildApp() {
	try {
		await initializeDb();
		fastify.log.info('Database initialized');
		await setupPlugins();
		setupHooks();
		setupRoutes();
		setupErrorHandler();
		return fastify;
	} catch (err) {
		fastify.log.error('Error initializing app: ', err);
		process.exit(1);
	}
}

async function start() {
	let app;
	try {
		app = await buildApp();
		await app.listen({ port: process.env.PORT || 4000, host: '0.0.0.0' });
		const address = app.server.address();
		const port = typeof address === 'string' ? address : address.port;
		app.log.info(`Server listening on ${port}`);
	} catch (err) {
		if (app && app.log) {
			app.log.error('Failed to start server:', err);
		} else {
			console.error('Failed to start server:', err);
		}
		process.exit(1);
	}
}

start();
