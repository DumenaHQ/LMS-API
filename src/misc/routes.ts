import { Router } from 'express';
import { isAuthenticated, isSchoolOrAdmin } from "../middleware/verifyToken";
import { downloadTemplateFile } from './controller';

export const router = Router();

router.get('/template', downloadTemplateFile);