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
    VERIFICATION_EXPIRY: z.coerce.number().int().positive().default(24),
    CLIENT_URL: z.string().trim(),
    OTP_EXPIRY: z.coerce.number().int().positive().default(5),
    EMAIL_HOST: z.string().trim().default('smtp.gmail.com'),
    EMAIL_PORT: z.coerce.number().int().positive().default(587),
    EMAIL_SECURE: z.boolean().default(false),
    EMAIL_USER: z.string().trim(),
    EMAIL_PASS: z.string().trim(),
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
