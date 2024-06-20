import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';
import { create, listSubcriptions, migrateExistingSchoolsToSubscription, updateSchoolSubscription } from './controller';
import validate, { schoolSubscriptionUpdateRules, subscriptionCreationRules } from '../middleware/validators/subscriptionValidator';

export const router = Router();

// router.post('/',);

router.get('/', listSubcriptions);
router.post('/', isAuthenticated, isAdmin, subscriptionCreationRules(), validate, create);

router.put('/school/:school_sub_id', isAuthenticated, isAdmin, schoolSubscriptionUpdateRules(), validate , updateSchoolSubscription);

router.put('migrate-schools', migrateExistingSchoolsToSubscription)
