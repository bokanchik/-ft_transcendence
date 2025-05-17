// app/services/users/types.ts (ou types/index.ts)

export interface User {
	id: number;
	username: string;
	email: string;
	display_name: string;
	avatar_url: string | null;
	wins: number;
	losses: number;
	status: 'online' | 'offline' | 'in-game';
	created_at: string; // ou Date
	updated_at: string; // ou Date
}

export interface UserWithPasswordHash extends User {
	password_hash: string;
}

export interface CreateUserPayload {
	username: string;
	email: string;
	password_hash: string;
	display_name: string;
	avatar_url?: string | null;
}

export interface RegisterRequestBody {
	username: string;
	email: string;
	password: string;
	display_name: string;
	avatar_url?: string;
}

export interface LoginRequestBody {
	identifier: string;
	password: string;
}

export interface UpdateUserPayload {
	email?: string;
	display_name?: string;
	avatar_url?: string | null;
}

export interface Friendship {
	id: number;
	user1_id: number;
	user2_id: number;
	initiator_id: number;
	status: 'pending' | 'accepted' | 'declined' | 'blocked';
	created_at?: string;
}

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

export interface JWTPayload {
	id: number;
	username: string;
	// iat?: number; // Issued at
	// exp?: number; // Expiration time
}

export interface UpdatedUserResult {
	changes?: number;
	lastID?: number; // lastID n'est pas pertinent pour UPDATE
}

export interface ApiErrorResponse {
    error: string;
    details?: any;
}

export interface ApiSuccessResponse<T> {
    message?: string;
    data?: T;
}

// import { CookieSerializeOptions } from '@fastify/cookie';
// export interface AppCookieOptions extends CookieSerializeOptions {
// 	// Ajoutez des propriétés spécifiques si nécessaire
// }
