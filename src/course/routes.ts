import { Router } from "express";
import { createCourse, updateCourse, addLesson, viewCourse, listCourses, createCourseModule, listModuleCourses } from './controller';
import validate, { courseCreationRules } from '../middleware/validators/courseValidators';
import { isAdmin, isAuthenticated } from "../middleware/verifyToken";

export const router = Router();

router.post('/', isAuthenticated, isAdmin, courseCreationRules(), validate, createCourse);

router.get('/', isAuthenticated, listCourses);

router.put('/:id', isAuthenticated, isAdmin, updateCourse);

router.get('/:id', isAuthenticated, viewCourse);

router.post('/:id/modules', isAuthenticated, isAdmin, createCourseModule);

router.post('/:id/modules/:moduleId/lessons', isAuthenticated, isAdmin, addLesson);

router.get('/:id/modules/:moduleId/lessons', isAuthenticated, isAdmin, listModuleCourses);