// // app/services/users/utils/appError.ts
// import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';

// export class AppError extends Error {
// 	public statusCode: number;
// 	constructor(message: string, statusCode: number) {
// 		super(message);
// 		this.statusCode = statusCode;
// 		Object.setPrototypeOf(this, AppError.prototype);
// 	}
// }

// export class ValidationError extends AppError {
// 	constructor(message: string) {
// 		super(message, 400);
// 		Object.setPrototypeOf(this, ValidationError.prototype);
// 	}
// }

// export class UnauthorizedError extends AppError {
// 	constructor(message: string) {
// 		super(message, 401);
// 		Object.setPrototypeOf(this, UnauthorizedError.prototype);
// 	}
// }
// export class ForbiddenError extends AppError {
// 	constructor(message: string) {
// 		super(message, 403);
// 		Object.setPrototypeOf(this, ForbiddenError.prototype);
// 	}
// }

// export class NotFoundError extends AppError {
// 	constructor(message: string) {
// 		super(message, 404);
// 		Object.setPrototypeOf(this, NotFoundError.prototype);
// 	}
// }

// export class ConflictError extends AppError {
// 	constructor(message: string) {
// 		super(message, 409);
// 		Object.setPrototypeOf(this, ConflictError.prototype);
// 	}
// }

// export const ERROR_MESSAGES: Record<string, string> = {
// 	INVALID_FRIENDSHIP_ID: 'Invalid friendship ID format.',
// 	USER_NOT_FOUND: 'User not found.',
// 	FRIEND_REQUEST_NOT_FOUND: 'Friend request not found.',
// 	FORBIDDEN: 'You are not authorized to perform this action.',
// 	INVALID_CREDENTIALS: 'Invalid username/email or password.',
// 	EMAIL_ALREADY_EXISTS: 'Email already exists.',
// 	USERNAME_ALREADY_EXISTS: 'Username already exists.',
// 	DISPLAY_NAME_ALREADY_EXISTS: 'Display name already exists.',
// 	INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token.',
// 	REFRESH_TOKEN_MISSING: 'Refresh token missing.',
// 	SELF_FRIEND_REQUEST: 'You cannot send a friend request to yourself.',
// 	FRIENDSHIP_ALREADY_EXISTS: 'A friendship or request already exists.',
// 	DATABASE_ERROR: 'A database error occurred.',
// };

// export function setupErrorHandler(fastify: FastifyInstance): void {
// 	fastify.setErrorHandler(function(error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) {
// 		request.log.error(error);

// 		let statusCode: number = 500;
// 		let message: string = ERROR_MESSAGES.DATABASE_ERROR;

// 		if (error instanceof AppError) {
//             statusCode = error.statusCode;
//             message = error.message;
//         } else if ((error as FastifyError).statusCode) {
//             statusCode = (error as FastifyError).statusCode!;
//             message = error.message;
//         }
//         const payload = {
// 			error: message,
// 			statusCode: statusCode,
// 		};
// 		reply.code(statusCode).send(payload);
// 	});
// 	fastify.log.info('Error handler registered');
// }
import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';

export const ERROR_KEYS = {
    // Erreurs de Login/Register
    LOGIN_INVALID_CREDENTIALS: 'error.login.invalidCredentials',
    LOGIN_ACCOUNT_BANNED: 'error.login.accountBanned',
    REGISTER_USERNAME_EXISTS: 'error.register.usernameExists',
    REGISTER_EMAIL_EXISTS: 'error.register.emailExists',
    REGISTER_DISPLAYNAME_EXISTS: 'error.register.displayNameExists',
	INVALID_REFRESH_TOKEN: 'error.refreshToken.invalid', // Invalid or expired refresh token.
	REFRESH_TOKEN_MISSING: 'error.refreshToken.missing', // Refresh token missing.

	// a virer
	INVALID_FRIENDSHIP_ID: 'error.friendship.invalidId', // Invalid friendship ID format

    // Erreurs d'amis
    FRIEND_SELF_REQUEST: 'error.friend.selfRequest',
    FRIEND_ALREADY_EXISTS: 'error.friend.alreadyExists',
    FRIEND_REQUEST_ALREADY_PENDING: 'error.friend.requestAlreadyPending',
    FRIEND_TARGET_HAS_PENDING: 'error.friend.targetHasPending',
    FRIEND_NOT_FOUND: 'error.friend.notFound',
    FRIEND_REQUEST_NOT_FOUND: 'error.friend.requestNotFound',
    FRIEND_CANNOT_ACCEPT_OWN_REQUEST: 'error.friend.cannotAcceptOwn',
    FRIEND_NOT_PART_OF_REQUEST: 'error.friend.notPartOfRequest',

    // Erreurs générales
    USER_NOT_FOUND: 'error.user.notFound', //
    UNAUTHORIZED: 'error.general.unauthorized',
    FORBIDDEN: 'error.general.forbidden',
    DATABASE_ERROR: 'error.general.databaseError',
    UNKNOWN_ERROR: 'error.general.unknown'
} as const;

export class AppError extends Error {
    public statusCode: number;
    public messageKey: string;
    public messageParams?: Record<string, any>;

    constructor(messageKey: string, statusCode: number, messageParams?: Record<string, any>) {
        super(messageKey);
        this.statusCode = statusCode;
        this.messageKey = messageKey;
        this.messageParams = messageParams;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export class ValidationError extends AppError {
    constructor(messageKey: string, messageParams?: Record<string, any>) {
        super(messageKey, 400, messageParams);
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class UnauthorizedError extends AppError {
    constructor(messageKey: string, messageParams?: Record<string, any>) {
        super(messageKey, 401, messageParams);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

export class ForbiddenError extends AppError {
    constructor(messageKey: string, messageParams?: Record<string, any>) {
        super(messageKey, 403, messageParams);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class NotFoundError extends AppError {
    constructor(messageKey: string, messageParams?: Record<string, any>) {
        super(messageKey, 404, messageParams);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class ConflictError extends AppError {
    constructor(messageKey: string, messageParams?: Record<string, any>) {
        super(messageKey, 409, messageParams);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

export function setupErrorHandler(fastify: FastifyInstance): void {
    fastify.setErrorHandler(function (error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) {
        request.log.error(error);

        let payload: {
            error: string;
            statusCode: number;
            messageKey: string;
            messageParams?: Record<string, any>;
        };

        if (error instanceof AppError) {
            payload = {
                error: error.message,
                statusCode: error.statusCode,
                messageKey: error.messageKey,
                messageParams: error.messageParams,
            };
        } else {
            const statusCode = (error as FastifyError).statusCode || 500;
            payload = {
                error: error.message || 'An internal server error occurred',
                statusCode: statusCode,
                messageKey: ERROR_KEYS.UNKNOWN_ERROR, // Clé de fallback
            };
        }

        reply.code(payload.statusCode).send(payload);
    });
    fastify.log.info('Internationalized error handler registered');
}