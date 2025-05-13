import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';

export const cookieOptions = {
	path: '/', // Allow the cookie to be sent to all routes
	httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
	//secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
	secure: true,
	sameSite: 'Strict', // Prevent CSRF attacks
	maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
}

export const jwtToken = 'jwt_token';

export async function registerJWTPlugin(fastify) {
	const jwtSecret = process.env.JWT_SECRET; // A GERER DANS ENV
	const cookieSecret = process.env.COOKIE_SECRET; // A GERER DANS ENV
	if (!jwtSecret || !cookieSecret) {
		fastify.log.warn('JWT_SECRET OR COOKIE_SECRET NOT SET : OCCUPE TOI DES DOCKER SECRETS !!');
	}
	await fastify.register(fastifyCookie, {
		secret: process.env.COOKIE_SECRET || 'COOKIE_SECRET_DUR',
		parseOptions: {},
	});

	try {
		await fastify.register(fastifyJwt, {
			secret: jwtSecret || 'SECRET_EN_DUR',// Utilise le secret ou une valeur par défaut (à changer absolument en production)
			sign: { expiresIn: '7d' },
			cookie: {
				cookieName: jwtToken,
				signed: false,
			},
		});
		fastify.log.debug('JWT plugin registered successfully');
	} catch (err) {
		fastify.log.error({ err }, 'FAILED to register @fastify/jwt plugin!');
		throw err; // Relancer bonne pratique ?
	}
}

export function generateJWT(fastify, payload, options = {}) {
	return fastify.jwt.sign(payload, options);
}

export function verifyJWT(fastify, token) {
	try {
		return fastify.jwt.verify(token);
	} catch (err) {
		fastify.log.warn({ err }, 'Manual verification error:');
		throw new AppError('Token invalid or expired', 401);
	}
}

export function getJWTSecret() {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		console.warn("JWT secret is not set. Using default");
		return "super-secret-change-me";
	}
	return secret;
}
