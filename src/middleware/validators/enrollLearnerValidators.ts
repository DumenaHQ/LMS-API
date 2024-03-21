import { check } from 'express-validator';
import { validate } from './validate';

export default validate;

export const enrollLearnerRules = () => {
    return [
        check('firstname').not().isEmpty().withMessage('Firstname must be specified'),
        check('lastname').not().isEmpty().withMessage('Lastname must be specified'),
        check('password').not().isEmpty().withMessage('password must be specified')
    ];
};