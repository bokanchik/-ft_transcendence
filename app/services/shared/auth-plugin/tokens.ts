import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JWTPayload } from '../types.js';
import { config } from '../env.js';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie, { CookieSerializeOptions } from '@fastify/cookie';
import fastifyCsrfProtection from '@fastify/csrf-protection';

export const jwtToken: string = 'jwt_token';
export const csrfCookieName: string = 'csrf_token';

export const cookieOptions: CookieSerializeOptions = {
	path: '/',
	httpOnly: true,
	secure: true,
	// secure: config.NODE_ENV === 'production',
	sameSite: 'strict',
	maxAge: 60 * 60 * 24 * 7,
};

export const csrfOptions: CookieSerializeOptions = {
	path: '/',
	httpOnly: true,
	secure: true,
	// secure: config.NODE_ENV === 'production',
	sameSite: 'lax',
	signed: true,
	maxAge: 60 * 60 * 24 * 7,
};

export async function setupPlugins(fastify: FastifyInstance): Promise<void> {
	await registerCookiePlugin(fastify);
	await registerJWTPlugin(fastify);
	authenticateDecorator(fastify);
	await registerCsrfPlugin(fastify);
}

export async function registerCookiePlugin(fastify: FastifyInstance): Promise<void> {
	const cookieSecret = config.COOKIE_SECRET;
	await fastify.register(fastifyCookie, {
		secret: cookieSecret,
		parseOptions: {},
	});
	fastify.log.info('Cookie plugin registered');
}

export async function registerCsrfPlugin(fastify: FastifyInstance): Promise<void> {
	await fastify.register(fastifyCsrfProtection, {
		cookieKey: csrfCookieName,
		cookieOpts: csrfOptions,
	});
	fastify.log.info('CSRF protection registered');
}

export async function registerJWTPlugin(fastify: FastifyInstance): Promise<void> {
	const jwtSecret = config.JWT_SECRET;
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

declare module 'fastify' {
	interface FastifyInstance {
		authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
	}

	interface FastifyRequest {
		user: JWTPayload;
	}
}


declare module '@fastify/jwt' {
	interface FastifyJWT {
		payload: JWTPayload;
		user: JWTPayload;
	}
}
