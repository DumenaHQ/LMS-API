import { Router } from 'express';
import { isAuthenticated, isSchoolOrAdmin } from '../middleware/verifyToken';
import { downloadTemplateFile, normaliseEmails, seedDatabase, swapClassSchoolId, swapLearnerSchoolId } from './controller';

export const router = Router();

router.get('/seed', seedDatabase);
router.get('/template', downloadTemplateFile);
router.get('/swaplearnerid', swapLearnerSchoolId);
router.get('/swapClassSchoolId', swapClassSchoolId);
router.get('/normalize', normaliseEmails);