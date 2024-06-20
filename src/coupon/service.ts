import Coupon from './model';

export const couponService = {
    async findOne(criteria: object) {
        return Coupon.findOne(criteria);
    },
    async list() {
        return Coupon.find();
    }
};