import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '@utils';

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            message: err.message,
            error: err.errors,
            data: err.data,
        });
    }

    console.error('Unexpected error:', err);
    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        errors: [],
        data: null,
    });
}
