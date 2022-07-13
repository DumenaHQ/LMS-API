import Coupon from './model'

export const couponService = {
    async list() {
        return Coupon.find();
    }
}