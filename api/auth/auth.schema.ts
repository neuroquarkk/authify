import { z } from 'zod';

export const authSchema = z.object({
    email: z.email().trim(),
    password: z.string().trim().min(8),
});

export const logoutSchema = z.object({
    allDevices: z.boolean(),
});

export const loginTfaSchema = z.object({
    email: z.email().trim(),
    otp: z.string().trim().length(6),
});

export const tokenQuerySchema = z.object({
    token: z.string().trim(),
});

export type Auth = z.infer<typeof authSchema>;
export type Logout = z.infer<typeof logoutSchema>;
export type LoginTfa = z.infer<typeof loginTfaSchema>;
export type TokenQuery = z.infer<typeof tokenQuerySchema>;
