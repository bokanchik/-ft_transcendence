
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