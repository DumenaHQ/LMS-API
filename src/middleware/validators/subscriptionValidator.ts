import { body, check } from 'express-validator';
import { validate } from './validate';
import { subscriptionService } from '../../subscription/service';
import { couponService } from '../../coupon/service';

export default validate;

export const subscriptionCreationRules = () => {
    return [
        body('title').notEmpty().isString().isLength({max: 50, min: 2}).withMessage('Title must be between 2 and 50 characters'),
        body('amount').notEmpty().isNumeric().withMessage('Amount must be a number'),
    ];
};

export const schoolSubscriptionUpdateRules = () => {
    return [
        check('school_sub_id').notEmpty().isString().custom(async (school_sub_id: string) => {
            const schoolSubscription = await subscriptionService.findOne({ _id: school_sub_id });
            if (!schoolSubscription) throw new Error('School Subscription does not exist');
            return true;
        }),
        body('coupon').notEmpty().isString().custom(async (coupon: string) => {
            const koupon = await couponService.findOne({ _id: coupon });
            if (!koupon) throw new Error('Coupon does not exist');
            return true;
        })
    ];
};