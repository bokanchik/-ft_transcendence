import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyCsrf from '@fastify/csrf-protection';

export const jwtToken = 'jwt_token';

export const cookieOptions = {
	path: '/', // Allow the cookie to be sent to all routes
	httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
	//secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
	secure: true,
	sameSite: 'Strict', // Prevent CSRF attacks
	maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
}

export async function registerCookiePlugin(fastify) {
	const cookieSecret = process.env.COOKIE_SECRET || 'COOKIE_SECRET_DUR';
	await fastify.register(fastifyCookie, {
		secret: cookieSecret,
		parseOptions: {},
	});
	fastify.log.info('Cookie plugin registered');
}

export async function registerCsrfPlugin(fastify) {
	await fastify.register(fastifyCsrf, {
		cookieKey: 'csrf-secret',
		cookieOpts: {
			signed: true,
			httpOnly: false,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'Lax', // <-- Change Strict
			path: '/',
		},
	});
	fastify.log.info('CSRF protection registered');
}

export async function registerJWTPlugin(fastify) {
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
	} catch (err) {
		fastify.log.error({ err }, 'FAILED to register @fastify/jwt plugin!');
		throw new Error(err);
	}
}
