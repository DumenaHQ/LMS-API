import { Router } from 'express';
import { isAuthenticated, isSchool } from '../middleware/verifyToken';
import { listSchoolLearnersActivities, listUserActivities, recordUserActivity } from './constroller';
import validate, { activityCreationRules } from '../middleware/validators/activityValidators';


export const router = Router();

router.post('/', isAuthenticated, activityCreationRules(), validate, recordUserActivity);

router.get('/', isAuthenticated, listUserActivities);

router.get('/school-learners', isAuthenticated, isSchool, listSchoolLearnersActivities);