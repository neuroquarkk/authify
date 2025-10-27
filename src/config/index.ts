import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    DATABASE_URL: z.url().trim(),
    JWT_SECRET: z.string().trim(),
    JWT_EXPIRY: z
        .string()
        .toLowerCase()
        .regex(/^[0-9]+[smhdwy]$/i),
    REFRESH_EXPIRY: z
        .string()
        .toLowerCase()
        .regex(/^[0-9]+[smhdwy]$/i),
    OTP_EXPIRY: z.coerce.number().int().positive().default(5),
});

const results = envSchema.safeParse(process.env);

if (!results.success) {
    console.error(results.error.issues);
    throw new Error('Invalid env vars');
}

const env = results.data;

export const config = {
    ...env,
    MorganFormat: env.NODE_ENV === 'production' ? 'combined' : 'dev',
    IsProd: env.NODE_ENV === 'production',
} as const;
