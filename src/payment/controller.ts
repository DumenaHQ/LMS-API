import { Request, Response, NextFunction } from 'express';
import { paymentService } from './service';
import { subscriptionService } from '../subscription/service';
import { send as sendResponse } from '../helpers/httpResponse';

export const initializePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {

    } catch (err) {

    }
}

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { reference } = req.body;
        const { payment, order } = await paymentService.save(reference);

        sendResponse(res, 201, 'Payment successful', { payment });

        // grant access to content
        await subscriptionService.grantAccess(order);
    } catch (err) {
        next(err);
    }
};


export const fetchPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payments = await paymentService.list();
        sendResponse(res, 201, 'Payments fetched', { payments });
    } catch (err) {
        next(err);
    }
};