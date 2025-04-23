import fastifyJwt from '@fastify/jwt';

export async function registerJWTPlugin(fastify) {
	fastify.register(fastifyJwt, {
		secret: process.env.JWT_SECRET || 'super-secret-change-me', // Remplace par ta variable d'environnement
		sign: { expiresIn: '7d' },
	});
}

export function generateJWT(fastify, payload) {
	return fastify.jwt.sign(payload);
}

export function verifyJWT(fastify, token) {
	try {
		return fastify.jwt.verify(token);
	} catch (err) {
		console.error('JWT verification error:', err);
		throw new Error('Token invalid or expired');
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
