import { Request, Response, NextFunction } from 'express';
import { couponService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';



export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { discount, title, expiry_date } = req.body;
        const coupon = await couponService.generateCouponCode(title, discount, new Date(expiry_date));
        sendResponse(res, 201, 'Coupon created', coupon);
    } catch (err) {
        next(err);
    }
};

export const listCoupons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const coupons = await couponService.list();
        sendResponse(res, 201, 'Coupons fetched', { coupons });
    } catch (err) {
        next(err);
    }
};