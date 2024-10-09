import { Request, Response, NextFunction } from 'express';
import { paymentService } from './service';
import { subscriptionService } from '../subscription/service';
import { send as sendResponse } from '../helpers/httpResponse';
import * as crypto from 'crypto';

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
        const payments = await paymentService.list({});
        sendResponse(res, 201, 'Payments fetched', { payments });
    } catch (err) {
        next(err);
    }
};

export const handleWebhookEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hash = crypto.createHmac('sha512', process.env.SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
        if (hash == req.headers['x-paystack-signature']) {
            const event = req.body;
            paymentService.handleWebhook(event);
        }
        sendResponse(res, 200, 'Payments fetched');
    } catch (err) {
        next(err);
    }
};