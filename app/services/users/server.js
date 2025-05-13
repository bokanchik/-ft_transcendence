import Fastify from 'fastify';
import { initializeDb } from './utils/dbConfig.js';
import { registerJWTPlugin, cookieOptions, jwtToken } from './utils/jwtUtils.js'
import friendRoutes from './routes/friends.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js'
import { AppError } from './utils/appError.js';

const fastify = Fastify({ logger: { level: 'debug' }, }); // level info
// const fastify = Fastify({ logger: { level: 'info', transport: { target: 'pino-pretty',options: { colorize: true, translateTime: 'SYS:standard', }, }, }, })


async function buildApp() {
	try {
		await initializeDb();
		fastify.log.info('Database initialized');
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
		fastify.register(userRoutes, { prefix: '/api/users' });
		fastify.register(authRoutes, { prefix: '/api/users/auth' });
		fastify.register(friendRoutes, { prefix: '/api/friends' });

		fastify.setErrorHandler(function(error, request, reply) {
			request.log.error(error);
			const statusCode = error instanceof AppError ? error.statusCode : 500;
			const message = error.message || 'Internal Server Error';
			reply.code(statusCode).send({
				error: message,
				statusCode: statusCode
			});
		});
		return fastify;
	} catch (err) {
		fastify.log.error('Error initializing database: ', err);
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
		app.log.error('Failed to start server:', err);
		process.exit(1);
	}
};

start();
