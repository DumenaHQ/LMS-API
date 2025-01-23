import { Router } from 'express';
import { isAdmin, isAuthenticated, isSchoolOrAdmin } from '../middleware/verifyToken';
import { validateClassSub } from '../middleware/validateClassSub';
import { addCourses, addLearners, addTemplateCourses, createClass, createTemplate, deleteClass, getClassQuizResults, listClassTemplates, listClasses, listCourses, listLearners, removeTeacherFromClass, removeTemplateCourse, updateClass, updateClassTemplate, viewClass, viewClassCourse, viewClassTemplate } from './controller';

export const router = Router();

router.post('/', isAuthenticated, createClass);

router.get('/', isAuthenticated, listClasses);

router.post('/templates', isAuthenticated, isAdmin, createTemplate);

router.get('/templates', isAuthenticated, listClassTemplates);

router.get('/templates/:id', isAuthenticated, viewClassTemplate);

router.put('/templates/:id', isAuthenticated, isAdmin, updateClassTemplate);

router.patch('/templates/:id/courses', isAuthenticated, isAdmin, addTemplateCourses);

router.patch('/templates/:id/courses/:courseId/remove', isAuthenticated, isAdmin, removeTemplateCourse);

router.get('/:id', isAuthenticated, validateClassSub, viewClass);

// router.get('/:id', isAuthenticated, viewRedactedClass);

router.put('/:id', isAuthenticated, updateClass);

router.patch('/:id/courses', isAuthenticated, isSchoolOrAdmin, addCourses);

router.get('/:id/courses', isAuthenticated, listCourses);

router.get('/:id/courses/:courseId', isAuthenticated, viewClassCourse);

router.patch('/:id/learners', isAuthenticated, addLearners);

router.get('/:id/learners', isAuthenticated, listLearners);

router.patch('/:id/teacher/remove', isAuthenticated, removeTeacherFromClass);

router.delete('/:id', isAuthenticated, deleteClass);

router.get('/:id/quizes/:quizId/result', isAuthenticated, getClassQuizResults);

// router.post('/:id/subscribe', isAuthenticated, subscribe);

