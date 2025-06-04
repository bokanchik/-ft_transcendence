import { z } from 'zod';
import { UserBaseSchema, UserOnlineStatus } from './schemas/usersSchemas.js';

export type {
	User,
	UserWithPasswordHash,
	RegisterRequestBody,
	LoginRequestBody,
	UpdateUserPayload,
	CreateUserPayload,
	JWTPayload
} from './schemas/usersSchemas.js';
export { UserOnlineStatus } from './schemas/usersSchemas.js';

export type {
	Friendship,
	Friend,
	PendingFriendRequest,
	FriendRequestUserData,
} from './schemas/friendsSchemas.js';
export { FriendshipStatus } from './schemas/friendsSchemas.js';

export interface Match {
	id: number;
	player1_id: number;
	player2_id: number;
	player1_score: number;
	player2_score: number;
	winner_id: number | null;
	win_type: string; // 'score', 'forfeit', etc.
	match_date: string; // ou Date
	game_type: string;
	tournament_id: number | null;
}


export const UpdatedDbResultSchema = z.object({
    changes: z.number().int().optional(),
});
export type UpdatedUserResult = z.infer<typeof UpdatedDbResultSchema>;

export const ApiSuccessResponseSchema = z.object({
    message: z.string(),
    user: UserBaseSchema, // Ou un autre schéma ??
});
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>;

export const ApiErrorResponseSchema = z.object({
    error: z.string(),
    statusCode: z.number().optional(), // Si on fait les codes
    details: z.any().optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// typer génériquement avec Zod si le type de `data` !!!
// en TypeScript :
export type ApiResult<TSuccessData = ApiSuccessResponse> =
	| { success: true; data: TSuccessData }
	| { success: false; error: string; details?: any; statusCode?: number };