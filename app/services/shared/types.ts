import { z } from 'zod';
import { UserBaseSchema } from './schemas/usersSchemas.js';

export const ApiSuccessResponseSchema = z.object({
	message: z.string(),
	user: UserBaseSchema, // Ou un autre schéma ??
});
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>;

export const ApiErrorResponseSchema = z.object({
	error: z.string(),
	statusCode: z.number().optional(), // Si on fait les codes
	details: z.any().optional(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

// typer génériquement avec Zod si le type de `data` !!!
// en TypeScript :
export type ApiResult<TSuccessData = ApiSuccessResponse> =
	| { success: true; data: TSuccessData }
	| { success: false; error: string; details?: any; statusCode?: number };
