import type { Request } from 'express';
import type { User } from 'prisma/generated/client';

export {};

declare global {
    namespace Express {
        interface Request {
            validatedQuery: any;
            user: {
                id: string;
            };
        }
    }

    interface BigInt {
        toJSON(): string;
    }
}
