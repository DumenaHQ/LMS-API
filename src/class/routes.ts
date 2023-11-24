import { Router } from 'express';
import { isAdmin, isAuthenticated, isSchoolOrAdmin } from "../middleware/verifyToken";

import { addCourses, addLearners, addTemplateCourses, createClass, createTemplate, deleteClass, getClassQuizResults, listClassTemplates, listClasses, listCourses, subscribe, updateClass, updateClassTemplate, viewClass, viewClassTemplate } from './controller';

export const router = Router();

router.post('/', isAuthenticated, createClass);

router.get('/', isAuthenticated, listClasses);

router.post('/templates', isAuthenticated, isAdmin, createTemplate);

router.get('/templates', isAuthenticated, listClassTemplates);

router.get('/templates/:id', isAuthenticated, viewClassTemplate);

router.put('/templates/:id', isAuthenticated, isAdmin, updateClassTemplate);

router.patch('/templates/:id/courses', isAuthenticated, isAdmin, addTemplateCourses);

router.get('/:id', isAuthenticated, viewClass);

router.put('/:id', isAuthenticated, updateClass);

router.patch('/:id/courses', isAuthenticated, isSchoolOrAdmin, addCourses);

router.get('/:id/courses', isAuthenticated, listCourses);

router.patch('/:id/learners', isAuthenticated, addLearners);

router.delete('/:id', isAuthenticated, deleteClass);

router.get('/:id/quizes/:quizId/result', isAuthenticated, getClassQuizResults);

router.post('/:id/subscribe', isAuthenticated, subscribe);

