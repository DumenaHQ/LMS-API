import { Router } from 'express';
import { isAdmin, isAuthenticated, isSchool, isSchoolOrAdmin } from '../middleware/verifyToken';
import { addSchoolStudents, downloadSchoolStudents, getSchoolSettings, listSchoolStudents, listSchoolTeachers, removeChild, schoolsAnalytics, updateSchoolSettings } from './controller';

export const router = Router();

router.get('/:id/learners', isAuthenticated, isSchoolOrAdmin, listSchoolStudents);

router.post('/:id/learners', isAuthenticated, isSchoolOrAdmin, addSchoolStudents);

router.delete('/:id/learners/:learnerid', isAuthenticated, isSchool, removeChild);

router.get('/:id/download-students-list', downloadSchoolStudents);

router.get('/:id/teachers', isAuthenticated, isSchoolOrAdmin, listSchoolTeachers);

router.get('/analytics', isAuthenticated, isAdmin, schoolsAnalytics );

router.get('/settings', isAuthenticated, isSchool, getSchoolSettings);

router.put('/settings', isAuthenticated, isSchool, updateSchoolSettings);
