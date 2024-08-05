import { body } from 'express-validator';
import { validate } from './validate';

export default validate;

export const couponCreationRules = () => {
    return [
        body('title').notEmpty().isString().isLength({max: 50, min: 2}).withMessage('Title must be between 2 and 50 characters'),
        body('discount').notEmpty().isNumeric().withMessage('Discount must be numeric'),
        body('expiry_date')
            .notEmpty().withMessage('Expiry date is required')
            .isISO8601().withMessage('Invalid expiry date format')
            .custom((date: string) => new Date(date) > new Date()).withMessage('Expiry date must be in the future'),
    ];
};