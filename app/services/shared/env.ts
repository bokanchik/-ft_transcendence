// src/config/env.ts
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	LOG_LEVEL: z.string().min(1, " is required"),
	NGINX_CONF_FILE: z.string().min(1, "NGINX_CONF_FILE is required"),
	DOMAIN_NAME: z.string().min(1, "DOMAIN_NAME is required"),
	SSL_CERT: z.string().min(1, "SSL_CERT is required"),
	SSL_KEY: z.string().min(1, "SSL_KEY is required"),
	DB_NAME: z.string().min(1, "DB_NAME is required"),
	GF_DATABASE_TYPE: z.string().min(1, "GF_DATABASE_TYPE is required"),
	GF_DATABASE_HOST: z.string().min(1, "GF_DATABASE_HOST is required"),
	GF_DATABASE_NAME: z.string().min(1, "GF_DATABASE_NAME is required"),
	GF_SERVER_ROOT_URL: z.string().min(1, "GF_SERVER_ROOT_URL is required"),
	GF_AUTH_COOKIE_SECURE: z.string().min(1, "GF_AUTH_COOKIE_SECURE is required"),
	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET is required"),
	API_USER_PORT: z.coerce.number().int().positive().default(3000), // coerce convertit la string en nombre
	USER_DATA_KEY: z.string().min(1, "USER_DATA_KEY is required"),
	USER_DATA_EXPIRATION_KEY: z.string().min(1, "USER_DATA_EXPIRATION_KEY is required"),
	CSRF_TOKEN_KEY: z.string().min(1, "CSRF_TOKEN_KEY is required"),
	URL_ALL_USERS: z.string().min(1, "URL_ALL_USERS is required"),
	URL_USER: z.string().min(1, "URL_USER is required"),
	URL_USER_ME: z.string().min(1, "URL_USER_ME is required"),
	URL_USER_MATCH: z.string().min(1, "URL_USER_MATCH is required"),
	URL_REGISTER: z.string().min(1, "URL_REGISTER is required"),
	URL_LOGIN: z.string().min(1, "URL_LOGIN is required"),
	URL_LOGOUT: z.string().min(1, "URL_LOGOUT is required"),
	URL_FRIEND_REQUEST: z.string().min(1, "URL_FRIEND_REQUEST is required"),
	URL_FRIEND_RECEIVED: z.string().min(1, "URL_FRIEND_RECEIVED is required"),
	URL_FRIEND_SENT: z.string().min(1, "URL_FRIEND_SENT is required"),
	URL_FRIEND_ACCEPT: z.string().min(1, "URL_FRIEND_ACCEPT is required"),
	URL_FRIEND_DECLINE: z.string().min(1, "URL_FRIEND_DECLINE is required"),
	URL_FRIEND_REMOVE: z.string().min(1, "URL_FRIEND_REMOVE is required"),
	URL_FRIEND_CANCEL: z.string().min(1, "URL_FRIEND_CANCEL is required"),
	URL_FRIEND_LIST: z.string().min(1, "URL_FIEND_LIST is required"),
	// API_KEY: z.string().optional(), // Pour les variables optionnelles
});

let validatedEnv;
try {
	validatedEnv = envSchema.parse(process.env);
} catch (error) {
	if (error instanceof z.ZodError) {
		console.error("Environment variable validation failed:");
		error.errors.forEach(err => {
			console.error(`- ${err.path.join('.')}: ${err.message}`);
		});
	} else {
		console.error("An unexpected error occurred during environment variable validation:", error);
	}
	process.exit(1);
}

export const config = validatedEnv;
export type AppConfig = z.infer<typeof envSchema>;
