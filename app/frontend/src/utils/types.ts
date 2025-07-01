import { z } from 'zod';
import { UserBaseSchema } from '../shared/schemas/usersSchemas.js';

export const ApiLoginSuccessDataSchema = z.object({
	message: z.string(),
	user: UserBaseSchema.optional(),
    two_fa_required: z.boolean().optional(),
}).refine(
    (data: any) => data.user || data.two_fa_required,
    "A successful login response must contain either user data or a two_fa_required flag."
);
export type ApiLoginSuccessData = z.infer<typeof ApiLoginSuccessDataSchema>;

export const ApiUpdateUserSuccessDataSchema = z.object({
    message: z.string(),
    user: UserBaseSchema,
});
export type ApiUpdateUserSuccessData = z.infer<typeof ApiUpdateUserSuccessDataSchema>;

export const ApiRegisterSuccessDataSchema = z.object({
    message: z.string(),
});
export type ApiRegisterSuccessData = z.infer<typeof ApiRegisterSuccessDataSchema>;

export type ApiResult<TSuccessData> =
	| { success: true; data: TSuccessData }
	| { success: false; error: string; statusCode?: number };