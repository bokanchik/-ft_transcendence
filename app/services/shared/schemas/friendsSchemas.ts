import { z } from 'zod';
import { UserBaseSchema, UserOnlineStatusSchema, ErrorResponseSchema } from './usersSchemas.js';

export enum FriendshipStatus {
	PENDING = 'pending',
	ACCEPTED = 'accepted',
	DECLINED = 'declined',
	BLOCKED = 'blocked',
}
export const FriendshipStatusSchema = z.nativeEnum(FriendshipStatus);

// --- Base Schemas ---
export const FriendshipBaseSchema = z.object({
	id: z.number().int(),
	user1_id: z.number().int(),
	user2_id: z.number().int(),
	initiator_id: z.number().int(),
	status: FriendshipStatusSchema,
	created_at: z.string(),
});
export type Friendship = z.infer<typeof FriendshipBaseSchema>;

export const AdminFullFriendshipSchema = FriendshipBaseSchema.extend({
	user1_username: z.string(),
	user2_username: z.string(),
	initiator_username: z.string(),
});
export type AdminFullFriendship = z.infer<typeof AdminFullFriendshipSchema>;

export const FriendSchema = z.object({
	friendship_id: z.number().int(),
	friendship_status: FriendshipStatusSchema,
	friend_id: z.number().int(),
	friend_username: z.string(),
	friend_display_name: z.string(),
	friend_avatar_url: UserBaseSchema.shape.avatar_url.optional(),
	friend_wins: z.number().int().default(0),
	friend_losses: z.number().int().default(0),
	friend_online_status: UserOnlineStatusSchema,
});
export type Friend = z.infer<typeof FriendSchema>;

// --- Schemas for API requests (Body, Params, Responses) ---
export const SendFriendRequestBodySchema = z.object({
	friendId: z.number().int().min(1, "Friend ID must be a positive integer."),
});
export type SendFriendRequestBody = z.infer<typeof SendFriendRequestBodySchema>;

export const FriendshipIdParamsSchema = z.object({
	friendshipId: z.string().regex(/^\d+$/, "Friendship ID must be a positive integer."),
});
export type FriendshipIdParams = z.infer<typeof FriendshipIdParamsSchema>;

export const FriendRequestUserSchema = UserBaseSchema.pick({
	id: true,
	username: true,
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

//--- Routes Schemas ---
export const SendFriendRequestRouteSchema = {
	body: SendFriendRequestBodySchema,
	response: {
		201: z.object({
			message: z.string(),
			friendship: FriendshipBaseSchema
		}),
		400: ErrorResponseSchema,
		401: ErrorResponseSchema,
		403: ErrorResponseSchema,
		404: ErrorResponseSchema,
		409: ErrorResponseSchema,
		500: ErrorResponseSchema
	}
};

export const MessageResponseSchema = z.object({ message: z.string() });
export const FriendshipActionRouteSchema = {
	params: FriendshipIdParamsSchema,
	response: {
		200: MessageResponseSchema,
		400: ErrorResponseSchema,
		401: ErrorResponseSchema,
		403: ErrorResponseSchema,
		404: ErrorResponseSchema,
		409: ErrorResponseSchema,
		500: ErrorResponseSchema
	}
};

export const FriendsListResponseSchema = z.array(FriendSchema);
export const GetFriendsListRouteSchema = {
	response: {
		200: FriendsListResponseSchema,
		401: ErrorResponseSchema,
		404: ErrorResponseSchema,
		500: ErrorResponseSchema
	}
};

export const PendingRequestsResponseSchema = z.array(PendingFriendRequestSchema);
export const GetPendingRequestsRouteSchema = {
	response: {
		200: PendingRequestsResponseSchema,
		401: ErrorResponseSchema,
		404: ErrorResponseSchema,
		500: ErrorResponseSchema
	}
};

