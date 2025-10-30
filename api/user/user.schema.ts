import { z } from 'zod';

export const settingsSchema = z.object({
    isTwoFactorEnabled: z.boolean().optional(),
});

export const deleteAccountSchema = z.object({
    password: z.string().trim().min(8),
});

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(20),
});

export const forgotPasswordSchema = z.object({
    email: z.email().trim(),
});

export const resetPasswordSchema = z.object({
    token: z.string().trim(),
    password: z.string().trim().min(8),
});

export type Settings = z.infer<typeof settingsSchema>;
export type DeleteAccount = z.infer<typeof deleteAccountSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
