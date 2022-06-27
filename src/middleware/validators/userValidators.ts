import { check } from 'express-validator';
import User, { Role } from '../../user/models';
import { validate } from './validate';

export default validate;

export const userCreationRules = () => {
    return [
        check('fullname').custom((fullname: string, { req }) => {
            if (req.body.user_type != 'learner' && !fullname) throw new Error('Fullname must be specified');
            if (req.body.user_type == 'learner' && !req.body.parent && !fullname) throw new Error('Fullname must be specified');
            return true;
        }),
        check('user_type').not().isEmpty().withMessage('user_type must be specified'),
        check('user_type').custom(async (user_type: string, { req }) => {
            const { firstname, lastname, parent } = req.body;
            const userTypes = await Role.find();
            const userRole = userTypes.find(userRole => user_type && userRole.role.toLowerCase() == user_type.toLowerCase());
            if (!userRole) throw new Error('Invalid user type');

            if (user_type == 'learner' && parent) req.body.fullname = `${lastname} ${firstname}`;
        }),
        check('firstname').custom((firstname: string, { req }) => {
            if (req.body.user_type == 'learner' && req.body.parent && !firstname) throw new Error('Firstname must be specified');
            return true;
        }),
        check('lastname').custom((lastname: string, { req }) => {
            if (req.body.user_type == 'learner' && req.body.parent && !lastname) throw new Error('Lastname must be specified');
            return true;
        }),
        check('email').custom(async (email: string, { req }) => {
            if (req.body.user_type == 'learner' && req.body.parent) {
                delete req.body.email;
                return true;
            }
            if (!email) throw new Error('Email must be provided');

            const existingUser = await User.findOne({ email }).lean();
            if (existingUser) throw new Error('Email already in use');
        }),
        check('password').not().isEmpty().withMessage('password must be specified'),
        check('school').custom((school: string, { req }) => {
            if (req.body.user_type == 'school' && !school) throw new Error('School name must be provided');
            return true;
        }),
    ];
}

export const loginRules = () => {
    return [
        check('username').exists().withMessage('Email/username field must be provided'),
        check('password').exists().withMessage('Password field must be provided')
    ]
}
