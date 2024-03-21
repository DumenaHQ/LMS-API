import { Response } from 'express';

export const send = (res: Response, statusCode: number, message: string | null, data?: object, metadata?: object) => {
    let response: any = {
        status: true,
        message
    };

    if (statusCode < 300) {
        if (data) response.data = data;
        if (metadata) response.metadata = metadata;
    }

    statusCode = statusCode || 500;
    if (statusCode > 299) response = { ...response, status: false, error: { code: statusCode, errors: data } };

    return res.status(statusCode).json(response);
};