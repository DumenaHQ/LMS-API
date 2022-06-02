import { check } from 'express-validator';
import User, { Role } from '../../user/models';
import { validate } from './validate';

export default validate;

export const userCreationRules = () => {
    return [
        check('fullname').not().isEmpty().withMessage('full name must be specified'),
        check('email').not().isEmpty().withMessage('Email must be specified'),
        check('email').custom(async (email: string) => {
            const existingUser = await User.findOne({ email }).lean();
            if (existingUser) throw new Error('Email already in use');
        }),
        check('password').not().isEmpty().withMessage('password must be specified'),
        check('user_type').not().isEmpty().withMessage('user_type must be specified'),
        check('user_type').custom(async (user_type: string) => {
            const userTypes = await Role.find();
            const userRole = userTypes.find(userRole => user_type && userRole.role.toLowerCase() == user_type.toLowerCase());
            if (!userRole) throw new Error('Invalid user type');
        })
    ];
}

export const loginRules = () => {
    return [
        check('email').exists().withMessage('Email field must be provided'),
        check('password').exists().withMessage('Password field must be provided')
    ]
}
