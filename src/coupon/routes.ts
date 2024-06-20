import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';
import { listCoupons } from './controller';

export const router = Router();

router.post('/', isAuthenticated, isAdmin, listCoupons);

router.get('/', isAuthenticated, isAdmin, listCoupons);