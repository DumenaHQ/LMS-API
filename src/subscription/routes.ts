import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';
import { create, listSubcriptions } from './controller';

export const router = Router();

// router.post('/',);

router.get('/', isAuthenticated, listSubcriptions);
router.post('/', isAuthenticated, isAdmin, create);