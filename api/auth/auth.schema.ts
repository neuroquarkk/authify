import { z } from 'zod';

export const authSchema = z.object({
    email: z.string().trim(),
    password: z.string().trim().min(8),
});

export const logoutSchema = z.object({
    allDevices: z.boolean(),
});

export type Auth = z.infer<typeof authSchema>;
export type Logout = z.infer<typeof logoutSchema>;
