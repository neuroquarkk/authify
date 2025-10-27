import type { NextFunction, Request, Response } from 'express';

type AsyncHandler<B = any, P = any, Q = any> = (
    req: Request<P, any, B, Q>,
    res: Response,
    next: NextFunction
) => Promise<any>;

export function asyncHandler<B = any, P = any, Q = any>(
    handler: AsyncHandler<B, P, Q>
) {
    return async (
        req: Request<P, any, B, Q>,
        res: Response,
        next: NextFunction
    ) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
