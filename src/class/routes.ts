import { Router } from 'express';
import { isAuthenticated, isSchoolOrAdmin } from "../middleware/verifyToken";

import { addCourses, addLearners, createClass, deleteClass, listClasses, listCourses, updateClass, viewClass } from './controller';

export const router = Router();

router.post('/', isAuthenticated, isSchoolOrAdmin, createClass);

router.get('/', isAuthenticated, listClasses);

router.get('/:id', isAuthenticated, viewClass);

router.put('/:id', isAuthenticated, isSchoolOrAdmin, updateClass);

router.patch('/:id/courses', isAuthenticated, isSchoolOrAdmin, addCourses);

router.get('/:id/courses', isAuthenticated, listCourses);

router.patch('/:id/learners', isAuthenticated, isSchoolOrAdmin, addLearners);

// router.get('/:id/learners', isAuthenticated, listLearners);

router.delete('/:id', isAuthenticated, isSchoolOrAdmin, deleteClass);

