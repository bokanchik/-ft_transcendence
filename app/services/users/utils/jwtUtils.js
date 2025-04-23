import fastifyJwt from '@fastify/jwt';

// Décorateurs pour générer et vérifier les JWT dans Fastify
export async function registerJWTPlugin(fastify) {
  // Enregistre le plugin Fastify JWT
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super-secret-change-me', // Remplace par ta variable d'environnement
    sign: { expiresIn: '7d' },  // Le JWT expirera après 7 jours
  });
}

// Générer un JWT (fonction utilitaire)
export function generateJWT(fastify, payload) {
  return fastify.jwt.sign(payload); // Utilise la méthode `sign` de Fastify pour créer le token
}

// Vérifier un JWT (fonction utilitaire)
export function verifyJWT(fastify, token) {
  try {
    return fastify.jwt.verify(token); // Utilise la méthode `verify` de Fastify pour vérifier le token
  } catch (err) {
    throw new Error('Token invalid or expired');
  }
}
