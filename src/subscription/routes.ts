import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';
import { create, listSubcriptions, updateSchoolSubscription } from './controller';

export const router = Router();

// router.post('/',);

router.get('/', listSubcriptions);
router.post('/', isAuthenticated, isAdmin, create);

router.put('/school/:school_sub_id', isAuthenticated, isAdmin, updateSchoolSubscription);
