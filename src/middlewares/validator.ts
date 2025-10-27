import { ApiError } from '@utils';
import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

type ReqPart = 'body' | 'query' | 'params';

function formatZError(e: ZodError): string[] {
    return e.issues.map((i) => {
        const path = i.path.length > 0 ? `${i.path.join('.')}: ` : '';
        return `${path}${i.message}`;
    });
}

export function validate<T>(schema: ZodType<T>, part: ReqPart) {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const validatedData = schema.parse(req[part]);

            if (part === 'query') {
                req.validatedQuery = validatedData;
            } else {
                req[part] = validatedData;
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errMsg = formatZError(error);
                return next(new ApiError(400, 'validation failed', errMsg));
            }
            return next(new ApiError(500, 'internal server error'));
        }
    };
}
