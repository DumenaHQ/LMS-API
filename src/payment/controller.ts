import { Request, Response, NextFunction } from "express";
import { paymentService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";

export const acceptPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payment = await paymentService.acceptPayment(req.body);
        sendResponse(res, 201, 'Payment successful', { payment });
    } catch (err) {
        next(err);
    }
}