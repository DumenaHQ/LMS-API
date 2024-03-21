import { Request, Response, NextFunction } from 'express';
import { couponService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';

export const listCoupons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const coupons = await couponService.list();
        sendResponse(res, 201, 'Coupons fetched', { coupons });
    } catch (err) {
        next(err);
    }
};