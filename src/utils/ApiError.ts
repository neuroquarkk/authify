export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly data: null = null;
    public readonly errors?: string[];

    constructor(statusCode: number, message: string, errors?: string[]) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
