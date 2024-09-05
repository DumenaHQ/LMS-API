import Coupon,{ICoupon} from './model';

import Chance from 'chance';

export const couponService = {
    async create(data: {
        title: string,
        code: string,
        discount: number,
        expiry_date: Date
    }) {
        return Coupon.create(data);
    },

    async list() {
        return Coupon.find();
    },



    async generateCouponCode(
    
        title: string,
        discount: number,
        expiry_date: Date
        
    ) {
        const coupons = await this.list();

        const chance = new Chance();
        let generatedString = chance.string({ length: 5, casing: 'upper', alpha: true, numeric: false, symbols: false });
        generatedString = `$${generatedString}${Number(coupons.length) + Number(1)}`; // Adding the number of coupons + 1, ensures unique ness of coupon code


        const coupon = await this.create({
            title,
            code: generatedString,
            discount,
            expiry_date
        });
        return coupon;
    },


    async isValidCoupon(code: string): Promise<{ coupon: ICoupon | null, isValidCoupon: boolean }> {
        const coupon = await Coupon.findOne({ code, status: 'active', expiry_date: { $gte: new Date()} }).lean();
        if (!coupon) 
            return { isValidCoupon: false, coupon };
        return { coupon, isValidCoupon: coupon ? true : false };
    }
};