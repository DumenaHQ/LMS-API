import { Request, Response, NextFunction } from "express";
import { subscriptionService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";

export const listSubcriptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subscriptions = await subscriptionService.list();
        sendResponse(res, 201, 'Subscriptions fetched', { subscriptions });
    } catch (err) {
        next(err);
    }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subscription = await subscriptionService.create(req.body);
        sendResponse(res, 201, 'Subscription Created', { subscription });
    } catch (err) {
        next(err);
    }
}