import Fastify from 'fastify';
import { initializeDb } from './utils/dbConfig.js';
import { registerJWTPlugin } from './utils/jwtUtils.js'
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.js'

const fastify = Fastify({ logger: true });

async function buildUser() {
	try {
		await initializeDb();
		fastify.log.info('Database initialized');
		await registerJWTPlugin(fastify);
		fastify.decorate("authenticate", async function(request, reply) {
			try {
				await request.jwtVerify();
			} catch (err) {
				fastify.log.warn('JWT verification failed: ', err);
				reply.code(401).send({ error: 'Unauthorized' });
			}
		});
		fastify.register(userRoutes, { prefix: '/api' });
		fastify.register(authRoutes, { prefix: '/api' });
		return fastify;
	} catch (err) {
		fastify.log.error('Error initializing database: ', err);
		process.exit(1);
	}
}

async function start() {
	const app = await buildUser();
	try {
		await app.listen({ port: 4000, host: '0.0.0.0' });
		app.log.info(`Server listening on ${app.server.address().port}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
