import Coupon from './model';

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

        // used the fisher yates shuffle algorithm because its faster
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const shuffledAlphabet = alphabet.split('').sort(() => 0.5 - Math.random());
        const randomAlphabet = shuffledAlphabet.slice(0, 3).join('');

        let generatedString = randomAlphabet;
        // this ensures the coupon code is unique
        generatedString = `${Number(coupons.length) + Number(1)}-${
            title.toLowerCase().replace(/\s+/g, '-') // Convert title to lowercase and replace spaces with hyphens
        }-${generatedString}`;


        const coupon = await this.create({
            title,
            code: generatedString,
            discount,
            expiry_date
        });
        return coupon;
    }
};