import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';

export const listSubcriptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subscriptions = await subscriptionService.list();
        sendResponse(res, 201, 'Subscriptions fetched', { subscriptions });
    } catch (err) {
        next(err);
    }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subscription = await subscriptionService.create(req.body);
        sendResponse(res, 201, 'Subscription Created', { subscription });
    } catch (err) {
        next(err);
    }
};


export const updateSchoolSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { school_sub_id } = req.params;
        const { coupon } = req.body;
        const schoolSubscription = await subscriptionService.updateSchoolSubscription(school_sub_id, { coupon });
        sendResponse(res, 201, 'School Subscription Updated', { schoolSubscription });
    } catch (err) {
        next(err);
    }
};