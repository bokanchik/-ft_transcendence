import { z } from 'zod';

// --- Base Schemas ---
export enum UserOnlineStatus {
	ONLINE = 'online',
	OFFLINE = 'offline',
	IN_GAME = 'in-game',
}
export const UserOnlineStatusSchema = z.nativeEnum(UserOnlineStatus);

export const UserPublicSchema = z.object({
    id: z.number().int(),
    display_name: z.string().min(3).max(20),
    avatar_url: z.string().url().nullable(),
    wins: z.number().int().default(0),
    losses: z.number().int().default(0),
    status: UserOnlineStatusSchema.default(UserOnlineStatus.OFFLINE),
    created_at: z.string(),
    updated_at: z.string(),
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const UserBaseSchema = UserPublicSchema.extend({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    language: z.string().length(2).default('en'),
    is_two_fa_enabled: z.boolean().default(false),
});

export type User = z.infer<typeof UserBaseSchema>;

export const UserWithPasswordHashSchema = UserBaseSchema.extend({
    password_hash: z.string(),
});
export type UserWithPasswordHash = z.infer<typeof UserWithPasswordHashSchema>;

export const UserWithSecretsSchema = UserBaseSchema.extend({
    password_hash: z.string(),
    two_fa_secret: z.string().nullable(),
});
export type UserWithSecrets = z.infer<typeof UserWithSecretsSchema>;

// --- Schemas for API requests (Body, Params, Responses) ---

export const ErrorResponseSchema = z.object({
    error: z.string(),
    statusCode: z.number().int(),
    messageKey: z.string().optional(),
    messageParams: z.record(z.any()).optional(),
});

// REGISTER
export const RegisterBodySchema = z.object({
    username: UserBaseSchema.shape.username,
    email: UserBaseSchema.shape.email,
    password: z.string().min(8).max(100),
    display_name: UserBaseSchema.shape.display_name,
    language: UserBaseSchema.shape.language.optional(),
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
            user: UserBaseSchema.optional(),
            two_fa_required: z.boolean().optional(),
        }).refine(data => data.user || data.two_fa_required, {
            message: "Either user data or two-factor authentication requirement must be present."
        }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

// --- CSRF TOKEN ---
export const GetCsrfTokenResponseSchema = z.object({
    csrfToken: z.string(),
});

export const GetCsrfTokenRouteSchema = {
    response: {
        200: GetCsrfTokenResponseSchema,
        500: ErrorResponseSchema
    }
};

// LOGIN WITH 2FA
export const Login2FARouteSchema = {
    response: {
        200: z.object({
            message: z.string(),
            user: UserBaseSchema.optional(),
            two_fa_required: z.boolean().optional(),
        }).refine(data => data.user || data.two_fa_required, {
            message: "Either user data or two-factor authentication requirement must be present."
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
    language: UserBaseSchema.shape.language.optional(),
    is_two_fa_enabled: UserBaseSchema.shape.is_two_fa_enabled.optional(),
    two_fa_secret: UserWithSecretsSchema.shape.two_fa_secret.optional(),
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

export const GetUserPublicRouteSchema = {
    params: UserIdParamsSchema,
    response: {
        200: UserPublicSchema,
        401: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

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
    language: UserBaseSchema.shape.language.optional(),
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

// --- 2FA Schemas ---
export const MessageResponseSchema = z.object({ message: z.string() });

export const Generate2FAResponseSchema = z.object({
    qrCodeDataURL: z.string().url(),
});
export type Generate2FAResponse = z.infer<typeof Generate2FAResponseSchema>;

export const Generate2FARouteSchema = {
    response: {
        200: Generate2FAResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
    }
};

export const Verify2FABodySchema = z.object({
    token: z.string().length(6, "Token must be 6 digits.").regex(/^\d+$/),
});
export type Verify2FABodySchema = z.infer<typeof Verify2FABodySchema>;

export const Verify2FARouteSchema = {
    body: Verify2FABodySchema,
    response: {
        200: MessageResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
    }
};

export const Disable2FARouteSchema = {
    response: {
        200: MessageResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
    }
};

// UPDATE USER STATS (INTERNAL)
export const UpdateUserStatsBodySchema = z.object({
    result: z.enum(['win', 'loss'], {
        required_error: "Result required.",
        invalid_type_error: "Result must be 'win' or 'loss'."
    })
});
export type UpdateUserStatsBody = z.infer<typeof UpdateUserStatsBodySchema>;

export const UpdateUserStatsRouteSchema = {
    params: UserIdParamsSchema,
    body: UpdateUserStatsBodySchema,
    response: {
        200: z.object({
            message: z.string(),
            user: UserBaseSchema
        }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};

// UPDATE USER STATUS (INTERNAl)
export const UpdateUserStatusBodySchema = z.object({
    status: UserOnlineStatusSchema,
});
export type UpdateUserStatusBody = z.infer<typeof UpdateUserStatusBodySchema>;

export const UpdateUserStatusRouteSchema = {
    params: UserIdParamsSchema,
    body: UpdateUserStatusBodySchema,
    response: {
        200: z.object({
            message: z.string(),
            user: UserBaseSchema
        }),
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
    }
};