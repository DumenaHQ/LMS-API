// const { check } = require('express-validator');
// import { ORDER_TYPES } from '../../config/constants';
import { validate } from './validate';
// import Coupon from '../../coupon/model';

export default validate;

export const orderValidationRules = () => {
    return [
        // check('user_id').not().isEmpty().withMessage('User ID must be provided'),
        // check('user_id').custom(async (user_id: string, { req }) => {
        //     const user = await User.findById(user_id);
        //     if (!user) throw new Error('User doesn\'t exist');
        //     delete req.body.user_id;
        //     req.body.user = user_id;
        // }),
        // check('order_type').not().isEmpty().withMessage('Order type must be provided'),
        // check('order_type').custom((order_type: string) => {
        //     if (!ORDER_TYPES.includes(order_type)) throw new Error(`Invalid order type, choose from any of these: [${ORDER_TYPES.join(', ')}]`);
        //     return true;
        // }),
        // check('slug').custom((slug: string) => {
        //     const plans = ['standard-plan', 'pro-plan'];
        //     if (!plans.includes(slug)) throw new Error(`Invalid slug, choose from any of these [${plans.join(', ')}]`);
        //     return true;
        // })
        // check('coupon_code').custom(async (code: string, { req }) => {
        //     if (code) {
        //         const coupon = await Coupon.findOne({ code });
        //         if (!coupon) throw new Error('Invalid coupon code');
        //         delete req.body.coupon_code;
        //         req.body.coupon = coupon._id;
        //     }
        // })
    ];
};