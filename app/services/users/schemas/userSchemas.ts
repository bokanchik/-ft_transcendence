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