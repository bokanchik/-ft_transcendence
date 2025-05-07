import Fastify from 'fastify';
import { initializeDb } from './utils/dbConfig.js';
// import { registerJWTPlugin } from './utils/jwtUtils.js'
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js'
import { AppError } from './utils/appError.js';
// @ts-ignore
import authPlugin from './shared/auth-plugin/index.ts';


const fastify = Fastify({ logger: { level: 'debug' }, }); // level info
// const fastify = Fastify({ logger: { level: 'info', transport: { target: 'pino-pretty',options: { colorize: true, translateTime: 'SYS:standard', }, }, }, })

async function buildUser() {
	try {
		await initializeDb();
		fastify.log.info('Database initialized');
		// authPlugin pour la gestion de l'authentification
		await fastify.register(authPlugin);
		fastify.log.info('Auth plugin registered');
		// await registerJWTPlugin(fastify);
		// // fastify.authenticate pour vérifier le token JWT 
		// fastify.decorate("authenticate", async function (request, reply) {
		// 	try {
		// 		await request.jwtVerify();
		// 	} catch (err) {
		// 		fastify.log.warn('JWT verification failed: ', err);
		// 		reply.code(401).send({ error: 'Unauthorized' });
		// 	}
		// });
		fastify.register(userRoutes, { prefix: '/api/users' });
		fastify.register(authRoutes, { prefix: '/api/users/auth' });
		fastify.setErrorHandler(function (error, request, reply) {
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
	try {
	const app = await buildUser();
	await app.listen({ port: 4000, host: '0.0.0.0' });
	app.log.info(`Server listening on ${app.server.address().port}`);
	} catch (err) {
		app.log.error('Failed to start server:', err);
		process.exit(1);
	}
};

start();
