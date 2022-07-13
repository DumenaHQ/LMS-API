import { Router, Request, Response } from 'express';
import { router as userRoutes } from '../user/routes';
import { router as courseRoutes } from '../course/routes';
import { router as paymentRoutes } from '../payment/routes';
import { router as orderRoutes } from '../order/routes';
import { router as subscriptionRoutes } from '../subscription/routes';
import { router as couponRoutes } from '../coupon/routes';

export const router = Router();

router.get('/', (req: Request, res: Response) => res.json({ message: 'Dumena, LMS API' }));

router.use('/users', userRoutes);

router.use('/courses', courseRoutes);

router.use('/parents', userRoutes);

router.use('/orders', orderRoutes);

router.use('/payments', paymentRoutes);

router.use('/subscriptions', subscriptionRoutes);

router.use('/coupons', couponRoutes);