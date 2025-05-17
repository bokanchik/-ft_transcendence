import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload } from '../types.js';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie, { CookieSerializeOptions } from '@fastify/cookie';
import fastifyCsrfProtection from '@fastify/csrf-protection';

export const jwtToken: string = 'jwt_token';

export const cookieOptions: CookieSerializeOptions = {
	path: '/',
	httpOnly: true,
	secure: true,
	// secure: process.env.NODE_ENV === 'production',
	sameSite: 'strict',
	maxAge: 60 * 60 * 24 * 7,
};

export async function setupPlugins(fastify: FastifyInstance): Promise<void> {
	await registerCookiePlugin(fastify);
	await registerJWTPlugin(fastify);
	authenticateDecorator(fastify);
	await registerCsrfPlugin(fastify);
}

export async function registerCookiePlugin(fastify: FastifyInstance): Promise<void> {
	const cookieSecret = process.env.COOKIE_SECRET || 'COOKIE_SECRET_DUR';
	await fastify.register(fastifyCookie, {
		secret: cookieSecret,
		parseOptions: {},
	});
	fastify.log.info('Cookie plugin registered');
}

export async function registerCsrfPlugin(fastify: FastifyInstance): Promise<void> {
	await fastify.register(fastifyCsrfProtection, {
		cookieKey: 'csrf-secret', // Convention: _csrf
		cookieOpts: {
			signed: true,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
		},
	});
	fastify.log.info('CSRF protection registered');
}

export async function registerJWTPlugin(fastify: FastifyInstance): Promise<void> {
	const jwtSecret = process.env.JWT_SECRET || 'SECRET_EN_DUR';
	try {
		await fastify.register(fastifyJwt, {
			secret: jwtSecret,
			sign: { expiresIn: '7d' },
			cookie: {
				cookieName: jwtToken,
				signed: false,
			},
		});
		fastify.log.debug('JWT plugin registered successfully');
	} catch (err: any) {
		fastify.log.error({ err: err.message }, 'FAILED to register @fastify/jwt plugin!');
		throw new Error(err.message || 'Failed to register JWT plugin');
	}
}

export function authenticateDecorator(fastify: FastifyInstance): void {
	fastify.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
		try {
			await request.jwtVerify<JWTPayload>();
		} catch (err) {
			fastify.log.warn('JWT verification failed: ', err);
			reply.clearCookie(jwtToken, cookieOptions);
			reply.code(401).send({ error: 'Unauthorized' });
		}
	});
	fastify.log.info('JWT & authenticate plugin registered');
}
