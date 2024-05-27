import { Router } from 'express';
import { authorizeAdminRoles, isAdmin, isAuthenticated } from '../middleware/verifyToken';
import validate, { adminOnboardingRules } from '../middleware/validators/userValidators';
import { onboardAdmin } from './controller';
import { AdminRole } from './models';

export const router = Router();



router.post('/enroll', isAuthenticated, isAdmin, authorizeAdminRoles([AdminRole.Super]), adminOnboardingRules(), validate, onboardAdmin);
