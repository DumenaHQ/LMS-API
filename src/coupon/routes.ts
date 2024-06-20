import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';
import { createCoupon, listCoupons } from './controller';
import validate, { couponCreationRules } from '../middleware/validators/couponValidators';

export const router = Router();

router.post('/', isAuthenticated, isAdmin, couponCreationRules(), validate, createCoupon);

router.get('/', isAuthenticated, isAdmin, listCoupons);