import { Router } from 'express';
import { isAuthenticated, isSchoolOrAdmin } from '../middleware/verifyToken';
import { downloadTemplateFile, seedDatabase, swapClassSchoolId, swapLearnerSchoolId } from './controller';

export const router = Router();

router.get('/seed', seedDatabase);
router.get('/template', downloadTemplateFile);
router.get('/swaplearnerid', swapLearnerSchoolId);
router.get('/swapClassSchoolId', swapClassSchoolId);