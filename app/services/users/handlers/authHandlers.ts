import { FastifyRequest, FastifyReply } from 'fastify';
import {
	createUserAccount,
	loginUser,
} from '../services/userService.js';

import {
	jwtToken,
	cookieOptions,
} from '../shared/auth-plugin/tokens.js';

import { ERROR_MESSAGES } from '../shared/auth-plugin/appError.js';
import { JWTPayload, User } from '../shared/types.js';

interface LoginRequestBody {
	identifier: string;
	password: string;
}
interface RegisterRequestBody {
	username: string;
	email: string;
	password: string;
	display_name: string;
	avatar_url?: string;
}

export async function registerHandler(req: FastifyRequest<{ Body: RegisterRequestBody }>, reply: FastifyReply) {
	const newUser = await createUserAccount(req.body);

	return reply.code(201).send({
		message: 'Registration successful',
		user: newUser,
	});
}

export async function loginHandler(req: FastifyRequest<{ Body: LoginRequestBody }>, reply: FastifyReply) {
	const user = await loginUser(req.body);
	const tokenPayload: JWTPayload = { id: user.id, username: user.username };
	const token = reply.server.jwt.sign(tokenPayload);
	const decodedToken = reply.server.jwt.decode(token) as { exp: number };

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

export async function logoutHandler(req: FastifyRequest, reply: FastifyReply) {
	reply.clearCookie(jwtToken, cookieOptions);
	return reply.send({ message: 'Logout successful' });
}

export async function refreshTokenHandler(req: FastifyRequest, reply: FastifyReply) {
	const refreshToken = (req.cookies as any).refreshToken;
	if (!refreshToken) {
		return reply.code(401).send({ error: ERROR_MESSAGES.REFRESH_TOKEN_MISSING });
	}

	try {
		const decoded = reply.server.jwt.verify(refreshToken, { ignoreExpiration: false }) as JWTPayload & { exp: number };
		const newToken = reply.server.jwt.sign({ id: decoded.id, username: decoded.username });
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
