import { Router } from 'express';
import { isAuthenticated } from '../middleware/verifyToken';
import { listUserActivities, recordUserActivity } from './controllers';
import validate, { activityCreationRules } from '../middleware/validators/activityValidators';


export const router = Router();

router.post('/', isAuthenticated, activityCreationRules(), validate, recordUserActivity);

router.get('/', isAuthenticated, listUserActivities);