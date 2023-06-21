import { Router } from 'express';
import { isAdmin, isAuthenticated, isSchoolOrAdmin } from "../middleware/verifyToken";

import { addCourses, addLearners, addTemplateCourses, createClass, createTemplate, deleteClass, listClassTemplates, listClasses, listCourses, updateClass, viewClass, viewClassTemplate } from './controller';

export const router = Router();

router.post('/', isAuthenticated, isSchoolOrAdmin, createClass);

router.get('/', isAuthenticated, listClasses);

router.post('/templates', isAuthenticated, isAdmin, createTemplate);

router.get('/templates', isAuthenticated, isSchoolOrAdmin, listClassTemplates);

router.get('/templates/:id', isAuthenticated, isSchoolOrAdmin, viewClassTemplate);

router.patch('/templates/:id/courses', isAuthenticated, isAdmin, addTemplateCourses);

router.get('/:id', isAuthenticated, viewClass);

router.put('/:id', isAuthenticated, isSchoolOrAdmin, updateClass);

router.patch('/:id/courses', isAuthenticated, isSchoolOrAdmin, addCourses);

router.get('/:id/courses', isAuthenticated, listCourses);

router.patch('/:id/learners', isAuthenticated, isSchoolOrAdmin, addLearners);

router.delete('/:id', isAuthenticated, isSchoolOrAdmin, deleteClass);

