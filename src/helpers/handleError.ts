import HttpException from "../common/http-exception";

export class handleError extends HttpException {
    data: any;
    constructor(statusCode: number, message: string, data?: any) {
        super(statusCode, message);
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}