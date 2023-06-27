import { Router } from 'express';
import { isAuthenticated, isSchoolOrAdmin } from "../middleware/verifyToken";
import { downloadTemplateFile, seedDatabase } from './controller';

export const router = Router();

router.get('/seed', seedDatabase);
router.get('/template', downloadTemplateFile);