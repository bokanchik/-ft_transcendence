// app/services/users/utils/appError.ts
import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';

export class AppError extends Error {
	public statusCode: number;
	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		Object.setPrototypeOf(this, AppError.prototype);
	}
}

export class ValidationError extends AppError {
	constructor(message: string) {
		super(message, 400);
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string) {
		super(message, 401);
		Object.setPrototypeOf(this, UnauthorizedError.prototype);
	}
}
export class ForbiddenError extends AppError {
	constructor(message: string) {
		super(message, 403);
		Object.setPrototypeOf(this, ForbiddenError.prototype);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string) {
		super(message, 404);
		Object.setPrototypeOf(this, NotFoundError.prototype);
	}
}

export class ConflictError extends AppError {
	constructor(message: string) {
		super(message, 409);
		Object.setPrototypeOf(this, ConflictError.prototype);
	}
}

export const ERROR_MESSAGES: Record<string, string> = {
	INVALID_FRIENDSHIP_ID: 'Invalid friendship ID format.',
	USER_NOT_FOUND: 'User not found.',
	FRIEND_REQUEST_NOT_FOUND: 'Friend request not found.',
	FORBIDDEN: 'You are not authorized to perform this action.',
	INVALID_CREDENTIALS: 'Invalid username/email or password.',
	EMAIL_ALREADY_EXISTS: 'Email already exists.',
	USERNAME_ALREADY_EXISTS: 'Username already exists.',
	DISPLAY_NAME_ALREADY_EXISTS: 'Display name already exists.',
	INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token.',
	REFRESH_TOKEN_MISSING: 'Refresh token missing.',
	SELF_FRIEND_REQUEST: 'You cannot send a friend request to yourself.',
	FRIENDSHIP_ALREADY_EXISTS: 'A friendship or request already exists.',
	DATABASE_ERROR: 'A database error occurred.',
};

export function setupErrorHandler(fastify: FastifyInstance): void {
	fastify.setErrorHandler(function(error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) {
		request.log.error(error);

		let statusCode: number = 500;
		let message: string = ERROR_MESSAGES.DATABASE_ERROR;

		if (error instanceof AppError) {
            statusCode = error.statusCode;
            message = error.message;
        } else if ((error as FastifyError).statusCode) {
            statusCode = (error as FastifyError).statusCode!;
            message = error.message;
        }
        const payload = {
			error: message,
			statusCode: statusCode,
		};
		reply.code(statusCode).send(payload);
	});
	fastify.log.info('Error handler registered');
}
