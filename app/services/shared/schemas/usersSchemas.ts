import { z } from 'zod';

export enum UserOnlineStatus {
	ONLINE = 'online',
	OFFLINE = 'offline',
	IN_GAME = 'in-game',
}
export const UserOnlineStatusSchema = z.nativeEnum(UserOnlineStatus);

// --- Base Schemas ---
export const UserBaseSchema = z.object({
    id: z.number().int(),
    username: z.string().min(3).max(20),
    email: z.string().email(),
    display_name: z.string().min(3).max(20),
    avatar_url: z.string().url().nullable(),
    wins: z.number().int().default(0),
    losses: z.number().int().default(0),
    status: UserOnlineStatusSchema.default(UserOnlineStatus.OFFLINE),
    created_at: z.string(), // Ou z.date()
    updated_at: z.string(), // Ou z.date()
});
export type User = z.infer<typeof UserBaseSchema>;

export const UserWithPasswordHashSchema = UserBaseSchema.extend({
    password_hash: z.string(),
});
export type UserWithPasswordHash = z.infer<typeof UserWithPasswordHashSchema>;

// --- Schemas for API requests (Body, Params, Responses) ---

export const ErrorResponseSchema = z.object({
    error: z.string(),
    statusCode: z.number().int()
});

// REGISTER
export const RegisterBodySchema = z.object({
    username: UserBaseSchema.shape.username,
    email: UserBaseSchema.shape.email,
    password: z.string().min(8).max(100),
    display_name: UserBaseSchema.shape.display_name,
    avatar_url: UserBaseSchema.shape.avatar_url.optional(),
});
export type RegisterRequestBody = z.infer<typeof RegisterBodySchema>;

export const RegisterRouteSchema = {
    body: RegisterBodySchema,
    response: {
        201: z.object({ message: z.string() }),
        400: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

// LOGIN
export const LoginBodySchema = z.object({
    identifier: z.string().min(1),
    password: z.string().min(1),
});
export type LoginRequestBody = z.infer<typeof LoginBodySchema>;

export const LoginRouteSchema = {
    body: LoginBodySchema,
    response: {
        200: z.object({
            message: z.string(),
            user: UserBaseSchema,
            // csrfToken: z.string().optional(),
        }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

export const LogoutRouteSchema = {
    response: {
        200: z.object({ message: z.string()}),
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

// GET ALL USERS
export const GetUsersListRouteSchema = {
    response: {
        200: z.array(UserBaseSchema),
        401: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

// GET /me
export const GetMeRouteSchema = {
    response: {
        200: UserBaseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

// UPDATE USER
export const UpdateUserBodySchema = z.object({
    email: UserBaseSchema.shape.email.optional(),
    display_name: UserBaseSchema.shape.display_name.optional(),
    avatar_url: UserBaseSchema.shape.avatar_url.optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one change."
});
export type UpdateUserPayload = z.infer<typeof UpdateUserBodySchema>;

export const UpdateUserRouteSchema = {
    body: UpdateUserBodySchema,
    response: {
        200: z.object({
            message: z.string(),
            user: UserBaseSchema
        }),
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

export const UpdatedDbResultSchema = z.object({
	changes: z.number().int().optional(),
});
export type UpdatedUserResult = z.infer<typeof UpdatedDbResultSchema>;

// GET USER BY ID
export const UserIdParamsSchema = z.object({
    userId: z.string().regex(/^\d+$/, "User ID must be a positive integer."),
});
export type UserIdParams = z.infer<typeof UserIdParamsSchema>;

export const GetUserByIdRouteSchema = {
    params: UserIdParamsSchema,
    response: {
        200: UserBaseSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

// --- Schémas pour la couche Service/Modèle (si différent de l'API) ---
export const CreateUserPayloadSchema = z.object({
    username: UserBaseSchema.shape.username,
    email: UserBaseSchema.shape.email,
    password_hash: z.string(),
    display_name: UserBaseSchema.shape.display_name,
    avatar_url: UserBaseSchema.shape.avatar_url.optional(),
});
export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;

export const JWTPayloadSchema = z.object({
    id: z.number().int(),
    username: z.string(),
    iat: z.number().optional(), // JWT ajoute ces champs automatiquement
    exp: z.number().optional(),
});
export type JWTPayload = z.infer<typeof JWTPayloadSchema>;

