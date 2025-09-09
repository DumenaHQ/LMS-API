import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';
import { create, listClassSubscriptions, listSubcriptions, subscribeToClass, updateSchoolSubscription, viewSubscription } from './controller';

export const router = Router();

// router.post('/',);

router.get('/', listSubcriptions);

router.post('/', isAuthenticated, isAdmin, create);

router.put('/school/:school_sub_id', isAuthenticated, isAdmin, updateSchoolSubscription);

router.post('/class-sub', isAuthenticated, subscribeToClass);

router.get('/class-sub', isAuthenticated, listClassSubscriptions);

router.get('/slug/:slug', isAuthenticated, viewSubscription);
