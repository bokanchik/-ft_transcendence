import fastifyJwt from '@fastify/jwt';

// export async function registerJWTPlugin(fastify) {
// 	fastify.register(fastifyJwt, {
// 		secret: process.env.JWT_SECRET || 'super-secret-change-me', // Remplace par ta variable d'environnement
// 		sign: { expiresIn: '7d' },
// 	});
// }


export async function registerJWTPlugin(fastify) {
  const secret = process.env.JWT_SECRET; // A GERER DANS ENV
  if (!secret) {
    fastify.log.warn('JWT_SECRET NOT SET : OCCUPE TOI DES DOCKER SECRETS !!');
  }
  try {
    await fastify.register(fastifyJwt, {
      // Utilise le secret ou une valeur par défaut (à changer absolument en production)
      secret: secret || 'SECRET_EN_DUR',
	  sign: { expiresIn: '7d' },
    });
  } catch (err) {-
    fastify.log.error({ err }, 'FAILED to register @fastify/jwt plugin!');
    throw err; // Relancer bonne pratique ?
  }
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
