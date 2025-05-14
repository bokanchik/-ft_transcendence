import fastifyCookie from '@fastify/cookie';

export async function registerCookiePlugin(fastify) {
    const cookieSecret = process.env.COOKIE_SECRET || 'COOKIE_SECRET_DUR';
    await fastify.register(fastifyCookie, {
        secret: cookieSecret,
        parseOptions: {},
    });
    fastify.log.info('Cookie plugin registered');
}