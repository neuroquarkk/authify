import { config } from '@config';
import ms, { type StringValue } from 'ms';

export const USER_SELECT = {
    id: true,
    email: true,
    createdAt: true,
    updatedAt: true,
    isVerified: true,
    isTwoFactorEnabled: true,
} as const;

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.IsProd,
    maxAge: ms(config.JWT_EXPIRY as StringValue),
    sameSite: 'strict',
} as const;

export const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.IsProd,
    maxAge: ms(config.REFRESH_EXPIRY as StringValue),
    sameSite: 'strict',
} as const;
