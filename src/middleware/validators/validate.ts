import { Request, Response, NextFunction } from 'express';
import { send as sendResponse } from '../../helpers/httpResponse';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const raw_errors = validationResult(req);

    if (raw_errors.isEmpty()) {
        return next();
    }
    // @ts-expect-error: just ignore
    const errors = raw_errors.errors.map((err: { param: any; msg: any; }) => ({ field: err.param, message: err.msg }));

    return sendResponse(res, 400, 'Invalid Input', errors);
};