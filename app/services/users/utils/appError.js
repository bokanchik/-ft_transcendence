export class AppError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message) {
		super(message, 401);
	}
}

export class ForbiddenError extends AppError {
	constructor(message) {
		super(message, 403); // 403 Forbidden
	}
}

export class NotFoundError extends AppError {
	constructor(message) {
		super(message, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message) {
		super(message, 409);
	}
}

export const ERROR_MESSAGES = {
	INVALID_FRIENDSHIP_ID: 'Invalid friendship ID format.',
	USER_NOT_FOUND: 'User not found.',
	FRIEND_REQUEST_NOT_FOUND: 'Friend request not found.',
	FORBIDDEN: 'You are not authorized to perform this action.',
	INVALID_CREDENTIALS: 'Invalid username/email or password.',
	EMAIL_ALREADY_EXISTS: 'Email already exists.',
	USERNAME_ALREADY_EXISTS: 'Username already exists.',
	INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token.',
	REFRESH_TOKEN_MISSING: 'Refresh token missing.',
	SELF_FRIEND_REQUEST: 'You cannot send a friend request to yourself.',
	FRIENDSHIP_ALREADY_EXISTS: 'A friendship or request already exists.',
	DATABASE_ERROR: 'A database error occurred.',
};

export function setupErrorHandler(fastify) {
	fastify.setErrorHandler(function(error, request, reply) {
		request.log.error(error);
		const statusCode = error instanceof AppError ? error.statusCode : 500;
		const message = error.message || ERROR_MESSAGES.DATABASE_ERROR;
		reply.code(statusCode).send({
			error: message,
			statusCode: statusCode,
		});
	});
	fastify.log.info('Error handler registered');
}
