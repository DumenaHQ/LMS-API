import { Router } from 'express';
import { downloadTemplateFile, normaliseUsernames, seedDatabase, swapClassSchoolId, swapLearnerSchoolId } from './controller';

export const router = Router();

router.get('/seed', seedDatabase);
router.get('/template', downloadTemplateFile);
router.get('/swaplearnerid', swapLearnerSchoolId);
router.get('/swapClassSchoolId', swapClassSchoolId);
router.get('/normalize', normaliseUsernames);