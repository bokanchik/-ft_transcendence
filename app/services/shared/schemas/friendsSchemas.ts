import { z } from 'zod';
import { UserBaseSchema, UserOnlineStatusSchema, UserOnlineStatus } from './usersSchemas.js'; // Importer depuis vos schémas utilisateur

export enum FriendshipStatus {
	PENDING = 'pending',
	ACCEPTED = 'accepted',
	DECLINED = 'declined', // Pertinent ?
	BLOCKED = 'blocked',
}
export const FriendshipStatusSchema = z.nativeEnum(FriendshipStatus);

export const FriendshipBaseSchema = z.object({
    id: z.number().int(),
    user1_id: z.number().int(),
    user2_id: z.number().int(),
    initiator_id: z.number().int(),
    status: FriendshipStatusSchema,
    created_at: z.string(), // Ou z.string().date()
});
export type Friendship = z.infer<typeof FriendshipBaseSchema>;


export const SendFriendRequestBodySchema = z.object({
    friendId: z.number().int().min(1, "L'ID de l'ami est requis et doit être positif."),
});
export type SendFriendRequestBody = z.infer<typeof SendFriendRequestBodySchema>;

export const SendFriendRequestRouteSchema = {
    body: SendFriendRequestBodySchema,
    response: {
        201: z.object({
            message: z.string(),
            friendship: FriendshipBaseSchema
        })
    }
};

// Schéma pour les paramètres d'URL contenant friendshipId
export const FriendshipIdParamsSchema = z.object({
    friendshipId: z.string().regex(/^\d+$/, "Friendship ID doit être un nombre"),
});
export type FriendshipIdParams = z.infer<typeof FriendshipIdParamsSchema>;

// Schéma pour les routes qui utilisent friendshipId en paramètre et retournent un message simple
export const FriendshipActionRouteSchema = {
    params: FriendshipIdParamsSchema,
    response: {
        200: z.object({ message: z.string() })
    }
};

// Schéma pour représenter un ami dans une liste
export const FriendSchema = z.object({
    friendship_id: z.number().int(),
    friendship_status: FriendshipStatusSchema, // Devrait toujours être 'accepted' pour une liste d'amis
    friend_id: z.number().int(),
    friend_username: z.string(),
    friend_display_name: z.string(),
    friend_avatar_url: z.string().url().nullable().optional(), // Correspond à UserBaseSchema.shape.avatar_url
    friend_wins: z.number().int().default(0),
    friend_losses: z.number().int().default(0),
    friend_online_status: UserOnlineStatusSchema,
});
export type Friend = z.infer<typeof FriendSchema>;

export const FriendsListResponseSchema = z.array(FriendSchema);
export const GetFriendsListRouteSchema = {
    response: {
        200: FriendsListResponseSchema
    }
};


export const FriendRequestUserSchema = UserBaseSchema.pick({
    id: true,
    username: true,
    email: true, // email ici ?
    display_name: true,
    avatar_url: true,
});
export type FriendRequestUserData = z.infer<typeof FriendRequestUserSchema>;


export const PendingFriendRequestSchema = z.object({
    friendship_id: z.number().int(),
    requester: FriendRequestUserSchema.optional(),
    receiver: FriendRequestUserSchema.optional(),
    created_at: z.string(),
});
export type PendingFriendRequest = z.infer<typeof PendingFriendRequestSchema>;

export const PendingRequestsResponseSchema = z.array(PendingFriendRequestSchema);
export const GetPendingRequestsRouteSchema = {
    response: {
        200: PendingRequestsResponseSchema
    }
};


// --- Schémas pour d'autres types ---


// ApiResult, ApiSuccessResponse, ApiErrorResponse - Ces types sont plus génériques et
// pourraient rester des interfaces/types TypeScript standard, ou vous pouvez les construire
// avec Zod si vous voulez valider la structure des réponses de succès/erreur elles-mêmes.
// Pour l'instant, je les laisse comme types TypeScript car ils sont des wrappers.

// Interface pour le retour d'une opération de base de données (comme updateUserInDb)
export const UpdatedDbResultSchema = z.object({
    changes: z.number().int().optional(), // SQLite retourne `changes`
    // lastID n'est généralement pas pour les UPDATEs, mais pour les INSERTs
});
export type UpdatedDbResult = z.infer<typeof UpdatedDbResultSchema>;

// --- Exemples de schémas de route Fastify que vous aviez en JSON ---
// Ceux-ci sont déjà couverts ci-dessus par des noms plus spécifiques
// comme `FriendshipActionRouteSchema` ou `SendFriendRequestRouteSchema`.

// friendshipIdParamSchema (JSON) -> FriendshipIdParamsSchema (Zod)
// export const friendshipIdParamSchema = { params: FriendshipIdParamsSchema };

// sendFriendRequestSchema (JSON) -> SendFriendRequestRouteSchema (Zod)
// export const sendFriendRequestSchema = SendFriendRequestRouteSchema;

// friendResponseSchema (JSON) -> FriendSchema (Zod, pour un seul ami) ou FriendsListResponseSchema (pour un tableau)
// export const friendResponseSchema = FriendSchema; // Pour la réponse d'un ami individuel si nécessaire

// Dans usersSchemas.ts ou un fichier de schémas partagés
export const ApiSuccessResponseSchema = z.object({
    message: z.string(),
    user: UserBaseSchema, // Ou un autre schéma selon le contexte
});

// Puis dans types.ts
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>;

export const ApiErrorResponseSchema = z.object({
    error: z.string(),
    statusCode: z.number().optional(), // Si vous avez un code d'erreur applicatif
    details: z.any().optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// ApiResult devient plus complexe à typer génériquement avec Zod si le type de `data` varie.
// Vous pourriez le garder comme type TypeScript :
// export type ApiResult<TSuccessData = ApiSuccessResponse> =
// 	| { success: true; data: TSuccessData }
// 	| { success: false; error: string; details?: any; statusCode?: number };