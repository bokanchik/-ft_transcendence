// export enum UserOnlineStatus {
// 	ONLINE = 'online',
// 	OFFLINE = 'offline',
// 	IN_GAME = 'in-game',
// }

// export interface User {
// 	id: number;
// 	username: string;
// 	email: string;
// 	display_name: string;
// 	avatar_url: string | null;
// 	wins: number;
// 	losses: number;
// 	status: UserOnlineStatus;
// 	created_at: string; // ou Date
// 	updated_at: string; // ou Date
// }

// export interface UserWithPasswordHash extends User {
// 	password_hash: string;
// }

// export interface CreateUserPayload {
// 	username: string;
// 	email: string;
// 	password_hash: string;
// 	display_name: string;
// 	avatar_url?: string | null;
// }

// export interface RegisterRequestBody {
// 	username: string;
// 	email: string;
// 	password: string;
// 	display_name: string;
// 	avatar_url?: string;
// }

// export interface LoginRequestBody {
// 	identifier: string;
// 	password: string;
// }

// export interface UpdateUserPayload {
// 	email?: string;
// 	display_name?: string;
// 	avatar_url?: string;
// }

// export interface JWTPayload {
// 	id: number;
// 	username: string;
// 	iat?: number; // Issued at
// 	exp?: number; // Expiration time
// }

import type { User } from './schemas/usersSchemas.js'; // Importer le type
import { UserOnlineStatus } from './schemas/usersSchemas.js'; // Importer l'enum

// Ré-exporter les types et valeurs importés pour qu'ils soient disponibles à l'extérieur
export type {
    User, // Exporter sous le nom 'User'
    UserWithPasswordHash,
    RegisterRequestBody,
    LoginRequestBody,
    UpdateUserPayload,
    CreateUserPayload,
    JWTPayload
} from './schemas/usersSchemas.js';

export { UserOnlineStatus }; 

export enum FriendshipStatus {
	PENDING = 'pending',
	ACCEPTED = 'accepted',
	DECLINED = 'declined',
	BLOCKED = 'blocked',
}

export interface Friendship {
	id: number;
	user1_id: number;
	user2_id: number;
	initiator_id: number;
	status: FriendshipStatus;
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



export interface UpdatedUserResult {
	changes?: number;
	lastID?: number; // lastID n'est pas pertinent pour UPDATE
}

export interface ApiSuccessResponse {
	message: string;
	user: User;
}

export type ApiResult =
	| { success: true; data: ApiSuccessResponse }
	| { success: false; error: string };

export interface FriendRequestUserData {
	id: number;
	username: string;
	email: string;
	display_name: string;
	avatar_url: string | null;
}

export interface PendingFriendRequest {
	friendship_id: number;
	requester?: FriendRequestUserData;
	receiver?: FriendRequestUserData;
	created_at: string;
}

export interface ApiErrorResponse {
	error: string;
	details?: any;
}

export interface Friend {
	friendship_id: number;
	friendship_status: FriendshipStatus;
	friend_id: number;
	friend_username: string;
	friend_display_name: string;
	friend_avatar_url?: string;
	friend_wins: number;
	friend_losses: number;
	friend_online_status: UserOnlineStatus;
}

export type FriendRequestResult =
	| { success: true; data: PendingFriendRequest[] }
	| { success: false; error: string };

export type FriendActionResult =
	| { success: true; message: string }
	| { success: false; error: string };

// import { CookieSerializeOptions } from '@fastify/cookie';
// export interface AppCookieOptions extends CookieSerializeOptions {
// 	// Ajoutez des propriétés spécifiques si nécessaire
// }
