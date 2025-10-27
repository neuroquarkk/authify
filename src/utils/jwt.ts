import { config } from '@config';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { ApiError } from './ApiError';

interface Payload {
    userId: string;
    iat?: number;
    exp?: number;
}

type TokenType = 'access' | 'refresh';

export class JWT {
    public static generate(payload: Payload, type: TokenType): string {
        const expiry =
            type === 'access' ? config.JWT_EXPIRY : config.REFRESH_EXPIRY;

        return jwt.sign(payload, config.JWT_SECRET, {
            expiresIn: expiry,
        } as SignOptions);
    }

    public static verify(token: string): Payload {
        try {
            return jwt.verify(token, config.JWT_SECRET) as Payload;
        } catch (error) {
            console.log(error);
            if (error instanceof jwt.TokenExpiredError) {
                throw new ApiError(401, 'Access token expired');
            }

            if (error instanceof jwt.JsonWebTokenError) {
                throw new ApiError(401, 'Invalid Access token');
            }

            throw new ApiError(401, 'Token verification failed');
        }
    }
}
