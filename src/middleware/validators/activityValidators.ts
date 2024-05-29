import { body } from 'express-validator';
import { EActivityType } from '../../activity/enum';
import { validate } from './validate';

export default validate;

export const activityCreationRules = () => {
    return [
        body('activity_type').notEmpty().isString().withMessage('Activity type must be a string').isIn(Object.values(EActivityType)).withMessage(`Invalid activity type, choose from any of these: [${Object.values(EActivityType).join(', ')}]`),
        body('activity_data').notEmpty().isObject().withMessage('Invalid activity data, must be an object'),

    ];
};