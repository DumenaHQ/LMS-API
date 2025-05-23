import { body, check } from 'express-validator';
import User, { AdminRole, Role, School } from '../../user/models';
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
            if (user_type == 'instructor') req.body.password = 'dumena';
            // This makes sure this endpoint cant be used to create an admin
            if(user_type == 'admin') throw new Error('Action forbidden, you are not allowed to create an admin account');
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
        // check('school_email').custom(async (email: string, { req }) => {
        //     if (req.body.user_type == 'school'){
        //         if (!email) throw new Error('Email must be provided');
        //         const existingSchool = await School.findOne({ school_email:email }).lean();
        //         if (existingSchool) throw new Error('School email already in use');
        //     }
        // }),
        check('password').not().isEmpty().withMessage('password must be specified'),
        check('school').custom(async (school: string, { req }) => {

            if (req.body.user_type == 'school' && !school) throw new Error('School name must be provided');

            if (req.body.user_type == 'school') {
                const existingSchool = await School.findOne({ school }).lean();
                if (existingSchool) throw new Error('School name already in use');
            }

            return true;
        }),
    ];
};

export const loginRules = () => {
    return [
        check('email').exists().withMessage('Email/username field must be provided'),
        check('password').exists().withMessage('Password field must be provided')
    ];
};

export const adminOnboardingRules = () => {
    return [
        body('admin_role').notEmpty().withMessage('admin_role must be specified').custom(async (admin_role: string) => {
            
            if (!Object.values(AdminRole).includes(admin_role as AdminRole)) throw new Error(`Invalid admin role, Choose from any of these: [${Object.values(AdminRole).join(', ')}]`);

            return true;
        }),
        body('firstname').notEmpty().withMessage('firstname must be specified'),
        body('lastname').notEmpty().withMessage('lastname must be specified'),
        body('phone').notEmpty().withMessage('phone must be specified').isMobilePhone('any').withMessage('invalid phone'),
        body('email').notEmpty().withMessage('email must be specified').isEmail().withMessage('invalid email').custom(async (email: string) => {
            const existingUser = await User.findOne({ email }).lean();
            if (existingUser) throw new Error('Email already in use');
        }),
    ];
};