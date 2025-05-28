export const postUserSchema = {
	body: {
		type: 'object',
		required: ['username', 'email', 'password', 'display_name'],
		properties: {
			username: { type: 'string' },
			email: { type: 'string', format: 'email' },
			password: { type: 'string' },
			display_name: { type: 'string' },
			avatar_url: { type: 'string', nullable: true }
		}
	}
};

export const registerSchema = {
	body: {
		type: 'object',
		required: ['username', 'email', 'password', 'display_name'],
		properties: {
			username: { type: 'string', minLength: 3, maxLength: 20 },
			email: { type: 'string', format: 'email' },
			password: { type: 'string', minLength: 8, maxLength: 100 },
			display_name: { type: 'string', minLength: 3, maxLength: 20 },
			avatar_url: { type: 'string', format: 'url', nullable: true }
		}
	}
};

export const loginSchema = {
	body: {
		type: 'object',
		required: ['identifier', 'password'],
		properties: {
			identifier: { type: 'string' },
			password: { type: 'string' }
		}
	}
};

export const updateUserSchema = {
	body: {
		type: 'object',
		properties: {
			email: { type: 'string', format: 'email' },
			display_name: { type: 'string', minLength: 3, maxLength: 20 },
			avatar_url: { type: 'string', format: 'url', nullable: true },
		},
		minProperties: 1,
		additionalProperties: false
	}
};

export const userIdParamSchema = {
	params: {
		type: 'object',
		properties: {
			userId: { type: 'string' }
		},
		required: ['userId']
	}
};

export const userResponseSchema = {
    type: 'object',
    properties: {
        id: { type: 'integer' },
        username: { type: 'string' },
        email: { type: 'string', format: 'email' },
        display_name: { type: 'string' },
        avatar_url: { type: 'string', format: 'url', nullable: true },
        wins: { type: 'integer' },
        losses: { type: 'integer' },
        status: { type: 'string', enum: ['online', 'offline', 'in-game'] },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'username', 'email', 'display_name', 'created_at', 'updated_at'],
};

export const logoutSchema = {
  description: 'Logout the current user by clearing the JWT cookie',
  tags: ['auth'],
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
};

// import { z } from 'zod';

// // --- Schémas de Base pour les Entités ---
// export const UserBaseSchema = z.object({
//     id: z.number().int(),
//     username: z.string().min(3).max(20),
//     email: z.string().email(),
//     display_name: z.string().min(3).max(20),
//     avatar_url: z.string().url().nullable(),
//     wins: z.number().int().default(0),
//     losses: z.number().int().default(0),
//     status: z.enum(['online', 'offline', 'in-game']),
//     created_at: z.string().datetime(), // Ou z.date()
//     updated_at: z.string().datetime(), // Ou z.date()
// });
// export type User = z.infer<typeof UserBaseSchema>;

// export const UserWithPasswordHashSchema = UserBaseSchema.extend({
//     password_hash: z.string(),
// });
// export type UserWithPasswordHash = z.infer<typeof UserWithPasswordHashSchema>;

// // --- Schémas pour les Requêtes API (Corps, Paramètres, Réponses) ---

// // REGISTER
// export const RegisterBodySchema = z.object({
//     username: UserBaseSchema.shape.username,
//     email: UserBaseSchema.shape.email,
//     password: z.string().min(8).max(100),
//     display_name: UserBaseSchema.shape.display_name,
//     avatar_url: UserBaseSchema.shape.avatar_url.optional(),
// });
// export type RegisterRequestBody = z.infer<typeof RegisterBodySchema>;
// export const RegisterRouteSchema = { // Pour Fastify
//     body: RegisterBodySchema,
//     response: {
//         201: z.object({ message: z.string() })
//     }
// };

// // LOGIN
// export const LoginBodySchema = z.object({
//     identifier: z.string().min(1),
//     password: z.string().min(1),
// });
// export type LoginRequestBody = z.infer<typeof LoginBodySchema>;
// export const LoginRouteSchema = { // Pour Fastify
//     body: LoginBodySchema,
//     response: {
//         200: z.object({
//             message: z.string(),
//             user: UserBaseSchema // Exclure password_hash de la réponse
//         })
//     }
// };

// // UPDATE USER (/me)
// export const UpdateUserBodySchema = z.object({
//     email: UserBaseSchema.shape.email.optional(),
//     display_name: UserBaseSchema.shape.display_name.optional(),
//     avatar_url: UserBaseSchema.shape.avatar_url.optional(), // .nullable().optional() si vous voulez permettre d'envoyer explicitement null
// }).min(1, "Au moins un champ doit être fourni pour la mise à jour.");
// export type UpdateUserPayload = z.infer<typeof UpdateUserBodySchema>;
// export const UpdateUserRouteSchema = { // Pour Fastify
//     body: UpdateUserBodySchema,
//     response: {
//         200: z.object({
//             message: z.string(),
//             user: UserBaseSchema
//         })
//     }
// };

// // GET USER BY ID (Params)
// export const UserIdParamsSchema = z.object({
//     userId: z.string().regex(/^\d+$/, "User ID doit être un nombre").transform(Number),
// });
// export const GetUserByIdRouteSchema = { // Pour Fastify
//     params: UserIdParamsSchema,
//     response: {
//         200: UserBaseSchema,
//         404: z.object({ error: z.string() })
//     }
// };

// // --- Schémas pour la couche Service/Modèle (si différent de l'API) ---
// export const CreateUserPayloadSchema = z.object({
//     username: UserBaseSchema.shape.username,
//     email: UserBaseSchema.shape.email,
//     password_hash: z.string(), // Hash, pas le mot de passe en clair
//     display_name: UserBaseSchema.shape.display_name,
//     avatar_url: UserBaseSchema.shape.avatar_url.optional(),
// });
// export type CreateUserPayload = z.infer<typeof CreateUserPayloadSchema>;

// // --- Autres types utiles ---
// export const JWTPayloadSchema = z.object({
//     id: z.number().int(),
//     username: z.string(),
//     // iat: z.number().optional(), // JWT ajoute ces champs automatiquement
//     // exp: z.number().optional(),
// });
// export type JWTPayload = z.infer<typeof JWTPayloadSchema>;