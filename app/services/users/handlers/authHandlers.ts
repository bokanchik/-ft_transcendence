import { FastifyRequest, FastifyReply } from 'fastify';
import { createUserAccount, loginUser, updateUserStatus } from '../services/userService.js';
import { jwtToken, cookieOptions, csrfCookieName, csrfOptions } from '../shared/auth-plugin/tokens.js';
import { ERROR_KEYS, UnauthorizedError } from '../utils/appError.js';
import { JWTPayload, RegisterRequestBody, LoginRequestBody, UserOnlineStatus } from '../shared/schemas/usersSchemas.js';

export async function registerHandler(req: FastifyRequest<{ Body: RegisterRequestBody }>, reply: FastifyReply) {
	await createUserAccount(req.body);

	return reply.code(201).send({
		message: 'Registration successful. Please log in.' // to translate
	});
}

export async function loginHandler(req: FastifyRequest<{ Body: LoginRequestBody }>, reply: FastifyReply) {
	const userWithSecrets = await loginUser(req.body);

	if (userWithSecrets.is_two_fa_enabled) {
        const tempTokenPayload = { id: userWithSecrets.id, username: userWithSecrets.username, scope: '2fa-pending' };
        const tempToken = reply.server.jwt.sign(tempTokenPayload, { expiresIn: '5m' });

        reply.setCookie('jwt_temp_2fa', tempToken, {
            ...cookieOptions,
            maxAge: 5 * 60, // 5 minutes
            sameSite: 'strict',
        });

        return reply.send({ 
            message: 'Two-factor authentication required.',
            two_fa_required: true,
        });
    }

	const tokenPayload: JWTPayload = { id: userWithSecrets.id, username: userWithSecrets.username };
	const token = reply.server.jwt.sign(tokenPayload);
	const decodedToken = reply.server.jwt.decode(token) as { exp: number };
	await updateUserStatus(userWithSecrets.id, UserOnlineStatus.ONLINE);

	reply.setCookie(jwtToken, token, {
		...cookieOptions,
		expires: new Date(decodedToken.exp * 1000),
	});

	const { password_hash, two_fa_secret, ...user } = userWithSecrets;
	return reply.send({
		message: 'Login accepted', // to translate
		user,
	});
}

export async function logoutHandler(req: FastifyRequest, reply: FastifyReply) {
	const id = (req.user as JWTPayload).id;
	await updateUserStatus(id, UserOnlineStatus.OFFLINE);
	reply.clearCookie(jwtToken, cookieOptions);
	reply.clearCookie(csrfCookieName, csrfOptions);
	reply.clearCookie('jwt_temp_2fa', { path: '/' });
	return reply.send({ message: 'Logout successful' }); // to translate
}

export async function refreshTokenHandler(req: FastifyRequest, reply: FastifyReply) {
	const refreshToken = (req.cookies as any).refreshToken;
	if (!refreshToken) {
		throw new UnauthorizedError(ERROR_KEYS.REFRESH_TOKEN_MISSING);
	}

	try {
		const decoded = reply.server.jwt.verify(refreshToken, { ignoreExpiration: false }) as JWTPayload & { exp: number };
		const newToken = reply.server.jwt.sign({ id: decoded.id, username: decoded.username });
		reply.setCookie(jwtToken, newToken, {
			...cookieOptions,
			expires: new Date(decoded.exp * 1000),
		});
		return reply.send({ message: 'Token refreshed successfully' }); // to translate
	} catch (err) {
		return reply.code(401).send({ error: ERROR_KEYS.INVALID_REFRESH_TOKEN });
	}
}