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
export { FriendshipStatus, ApiResult, ApiErrorResponse, ApiSuccessResponse, UpdatedUserResult } from './schemas/friendsSchemas.js';

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
