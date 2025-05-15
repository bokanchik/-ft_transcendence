import fp from 'fastify-plugin';
import fastifyJWT from '@fastify/jwt';
export default fp(async (fastify, options) => {
    // Gestione du secret JWT (a gerer dans ENV)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        fastify.log.warn('JWT_SECRET NOT SET : OCCUPE TOI DES DOCKER SECRETS !!');
        // process.exit(1); // Arrêter le serveur si le secret n'est pas défini
    }
    // Enregistrement du plugin @fastify/jwt
    try {
        await fastify.register(fastifyJWT, {
            // Utilise le secret ou une valeur par défaut (à changer absolument en production)
            secret: secret || 'SECRET_EN_DUR',
            sign: { expiresIn: '7d' },
        });
        fastify.log.info('JWT plugin successfully registered');
    }
    catch (err) {
        fastify.log.error({ err }, 'FAILED to register @fastify/jwt plugin!');
        throw new Error(err);
    }
    // to test
    fastify.log.info(`JWT_SECRET used: ${secret}`);
    // fastify.authenticate pour vérifier le token JWT 
    fastify.decorate("authenticate", async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            fastify.log.warn('JWT verification failed: ', err);
            reply.code(401).send({ error: 'Unauthorized' });
        }
    });
});
