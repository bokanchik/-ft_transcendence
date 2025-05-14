// Gère les requêtes Fastify (req, reply)
import { createUserAccount, loginUser } from '../services/userService.js';
import { jwtToken, cookieOptions } from '../utils/jwtUtils.js';
import { ERROR_MESSAGES } from '../utils/errorMessages.js';

export async function registerHandler(req, reply) {
    const newUser = await createUserAccount(req.body);

    return reply.code(201).send({
        message: 'Registration successful',
        user: newUser,
    });
}
     
export async function loginHandler(req, reply) {
    const user = await loginUser(req.body);
    const tokenPayload = { id: user.id, username: user.username };
    const token = req.server.jwt.sign(tokenPayload);
    const decodedToken = req.server.jwt.decode(token);

    // Définir le cookie JWT
    reply.setCookie(jwtToken, token, {
        ...cookieOptions,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(decodedToken.exp * 1000),
    });

    return reply.send({
        message: 'Login accepted',
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.display_name,
        },
    });
}

export async function logoutHandler(req, reply) {
	reply.clearCookie(jwtToken, cookieOptions);
	return reply.send({ message: 'Logout successful' });
}

export async function refreshTokenHandler(req, reply) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return reply.code(401).send({ error: ERROR_MESSAGES.REFRESH_TOKEN_MISSING });
    }

    try {
        const decoded = req.server.jwt.verify(refreshToken, { ignoreExpiration: false });
        const newToken = req.server.jwt.sign({ id: decoded.id, username: decoded.username });
        reply.setCookie(jwtToken, newToken, {
            ...cookieOptions,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(decoded.exp * 1000),
        });
        return reply.send({ message: 'Token refreshed successfully' });
    } catch (err) {
        return reply.code(401).send({ error: ERROR_MESSAGES.INVALID_REFRESH_TOKEN });
    }
}
