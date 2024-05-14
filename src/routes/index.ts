import { Router, Request, Response } from 'express';
import { router as userRoutes } from '../user/routes';
import { router as schoolRoutes } from '../user/schoolRoutes';
import { router as courseRoutes } from '../course/routes';
import { router as quizRoutes } from '../quiz/routes';
import { router as paymentRoutes } from '../payment/routes';
import { router as orderRoutes } from '../order/routes';
import { router as subscriptionRoutes } from '../subscription/routes';
import { router as couponRoutes } from '../coupon/routes';
import { router as programRoutes } from '../program/routes';
import { router as classRouter } from '../class/routes';
import { router as miscRoutes } from '../misc/routes';
import {router as supportRoutes} from '../support/routes';

export const router = Router();

router.get('/', (req: Request, res: Response) => res.json({ message: 'Dumena, LMS API' }));

router.use('/users', userRoutes);

router.use('/courses', courseRoutes);

router.use('/quizzes', quizRoutes);

router.use('/parents', userRoutes);

router.use('/learners', userRoutes);

router.use('/schools', schoolRoutes);

router.use('/orders', orderRoutes);

router.use('/payments', paymentRoutes);

router.use('/subscriptions', subscriptionRoutes);

router.use('/coupons', couponRoutes);

router.use('/programs', programRoutes);

router.use('/classes', classRouter);

router.use('/downloads', miscRoutes);

router.use('/setup', miscRoutes);

router.use('/support', supportRoutes);