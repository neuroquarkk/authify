export class ApiResponse {
    public readonly statusCode: number;
    public readonly message: string;
    public readonly data: any;

    constructor(statusCode: number, data: any, message: string = 'success') {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }
}
