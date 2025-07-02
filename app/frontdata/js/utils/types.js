import { z } from 'zod';
import { UserBaseSchema } from '../shared/schemas/usersSchemas.js';
export const ApiLoginSuccessDataSchema = z.object({
    message: z.string(),
    user: UserBaseSchema.optional(),
    two_fa_required: z.boolean().optional(),
}).refine((data) => data.user || data.two_fa_required, "A successful login response must contain either user data or a two_fa_required flag.");
export const ApiUpdateUserSuccessDataSchema = z.object({
    message: z.string(),
    user: UserBaseSchema,
});
export const ApiRegisterSuccessDataSchema = z.object({
    message: z.string(),
});
