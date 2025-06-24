import { z } from 'zod';
import { User, UserBaseSchema } from '../shared/schemas/usersSchemas.js';

// Réponse de succès spécifique au login, qui peut contenir l'un ou l'autre.
export const ApiLoginSuccessDataSchema = z.object({
	message: z.string(),
	user: UserBaseSchema.optional(),
    two_fa_required: z.boolean().optional(),
}).refine(
    (data) => data.user || data.two_fa_required,
    "A successful login response must contain either user data or a two_fa_required flag."
);
export type ApiLoginSuccessData = z.infer<typeof ApiLoginSuccessDataSchema>;

// Réponse de succès pour la mise à jour de profil
export const ApiUpdateUserSuccessDataSchema = z.object({
    message: z.string(),
    user: UserBaseSchema,
});
export type ApiUpdateUserSuccessData = z.infer<typeof ApiUpdateUserSuccessDataSchema>;

// Réponse de succès pour l'enregistrement
export const ApiRegisterSuccessDataSchema = z.object({
    message: z.string(),
});
export type ApiRegisterSuccessData = z.infer<typeof ApiRegisterSuccessDataSchema>;

export type ApiResult<TSuccessData> =
	| { success: true; data: TSuccessData }
	| { success: false; error: string; statusCode?: number };