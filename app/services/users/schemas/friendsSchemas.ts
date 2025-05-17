export const friendshipIdParamSchema = {
	params: {
		type: 'object',
		properties: {
			friendshipId: { type: 'integer', minimum: 1 },
		},
		required: ['friendshipId'],
	},
};

export const sendFriendRequestSchema = {
	body: {
		type: 'object',
		properties: {
			receiverUsername: { type: 'string', minLength: 1 },
		},
		required: ['friendId'],
	}
};

export const friendResponseSchema = {
	type: 'object',
	properties: {
		friendship_id: { type: 'integer' },
		friend_id: { type: 'integer' },
		friend_username: { type: 'string' },
		friend_display_name: { type: 'string' },
		friend_avatar_url: { type: 'string', format: 'url', nullable: true },
		friend_online_status: { type: 'string', enum: ['online', 'offline', 'in-game'] },
	},
	required: ['friendship_id', 'friend_id', 'friend_username'],
};
