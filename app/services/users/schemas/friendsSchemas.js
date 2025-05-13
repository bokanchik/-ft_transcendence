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
		required: ['receiverUsername'],
	}
};
