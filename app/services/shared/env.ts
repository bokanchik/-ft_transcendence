import { z } from 'zod';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

function getSecret(variableName: string): string | undefined {
  const secretPath = process.env[`${variableName}__FILE`];
  if (secretPath) {
    try {
      return fs.readFileSync(secretPath, 'utf-8').trim();
    } catch (error) {
      console.error(`Failed to read secret from file: ${secretPath}`, error);
      return undefined;
    }
  }
  return process.env[variableName];
}

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	LOG_LEVEL: z.string().min(1, " is required"),
	JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
	COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET is required"),
	API_USER_PORT: z.coerce.number().int().positive().default(4000),
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
});

let validatedEnv;
try {
	const envVarsToValidate = {
        ...process.env,
        JWT_SECRET: getSecret('JWT_SECRET'),
        COOKIE_SECRET: getSecret('COOKIE_SECRET'),
        // autres secrets
    };

	validatedEnv = envSchema.parse(envVarsToValidate);

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