// app/services/users/utils/jwtUtils.ts
import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';

interface JWTPayload {
  [key: string]: any;
  id: number;
  username: string;
}

export function generateJWT(fastify: FastifyInstance, payload: JWTPayload): string {
	return fastify.jwt.sign(payload);
}

export function verifyJWT(fastify: FastifyInstance, token: string): JWTPayload {
	try {
		return fastify.jwt.verify<JWTPayload>(token);
	} catch (err) {
		console.error('JWT verification error:', err);
		throw new Error('Token invalid or expired');
	}
}

export function getJWTSecret(): string {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		console.warn("JWT secret is not set. Using default");
		return "super-secret-change-me";
	}
	return secret;
}
