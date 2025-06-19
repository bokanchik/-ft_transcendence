import { FastifyRequest, FastifyReply } from 'fastify';
import { createUserAccount, loginUser, updateUserStatus } from '../services/userService.js';
import { jwtToken, cookieOptions, csrfCookieName, csrfOptions } from '../shared/auth-plugin/tokens.js';
import { ERROR_KEYS, UnauthorizedError } from '../utils/appError.js';
// import { ERROR_MESSAGES } from '../utils/appError.js';
import { JWTPayload, RegisterRequestBody, LoginRequestBody, UserOnlineStatus } from '../shared/schemas/usersSchemas.js';

export async function registerHandler(req: FastifyRequest<{ Body: RegisterRequestBody }>, reply: FastifyReply) {
	await createUserAccount(req.body);

	return reply.code(201).send({
		message: 'Registration successful. Please log in.' // to translate
	});
}

export async function loginHandler(req: FastifyRequest<{ Body: LoginRequestBody }>, reply: FastifyReply) {
	const user = await loginUser(req.body);
	const tokenPayload: JWTPayload = { id: user.id, username: user.username };
	const token = reply.server.jwt.sign(tokenPayload);
	const decodedToken = reply.server.jwt.decode(token) as { exp: number };
	await updateUserStatus(user.id, UserOnlineStatus.ONLINE);

	reply.setCookie(jwtToken, token, {
		...cookieOptions,
		expires: new Date(decodedToken.exp * 1000),
	});

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
