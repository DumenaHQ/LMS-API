import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';
import { School } from '../user/models';
import { classSubscriptionService } from './classSubscriptionService';
import { paymentService } from '../payment/service';

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

export const subscribeToClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, id } = req.user;
        const { classes, couponCode } = req.body;
        const order = await classSubscriptionService.createClassSubscriptions(classes, String(id), couponCode);
        if (!order)
            throw Error('Something went wrong while creating your order');
        const { reference, total_amount } = order;
        const { data: { access_code } } = await paymentService.initializePayment(email, Number(total_amount), reference);
        sendResponse(res, 200, 'Class Subscription Initiated', { access_code });
    } catch (err) {
        next(err);
    }
}

export const listClassSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const classSubscriptions = await subscriptionService.listSubs();
        sendResponse(res, 200, 'Class Subscription Fetched', { classSubscriptions });
    } catch (err) {
        next(err);
    }
}

export const viewSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { slug } = req.params;
        const subscription = await subscriptionService.view({ slug });
        sendResponse(res, 200, 'Class Subscription Fetched', { subscription });
    } catch (err) {
        next(err);
    }
}


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


// This Block Of Code is for seeding purposes and will be removed after it is triggered once on production and staging, this comment will be removed also
export const migrateExistingSchoolsToSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get all schools
        const schools = await School.find({});

        await Promise.all(schools.map(async (school) => {
            const subscription = await subscriptionService.findOne({
                slug: 'standard-plan'
            });
            if (subscription){
                await subscriptionService.migrateSchoolToSubscription(school.user, subscription.id);
            }
        }));

        sendResponse(res, 201, 'Schools Migrating to Subscriptions');
    } catch (err) {
        next(err);
    }
};