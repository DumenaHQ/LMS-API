import { Router, Request, Response } from 'express';
import { router as userRoutes } from '../user/routes';
import { router as courseRoutes } from '../course/routes';

export const router = Router();

router.get('/', (req: Request, res: Response) => res.json({ message: 'Dumena, LMS API' }));

router.use('/users', userRoutes);

router.use('/courses', courseRoutes);