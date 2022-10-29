import { Router } from 'express';
import { isAdmin, isAuthenticated } from "../middleware/verifyToken";
import { addCourses, addSchools, createProgram, deleteProgram, listCourses, listPrograms, listSchools, updateProgram, viewProgram } from './controller';

export const router = Router();


router.post('/', isAuthenticated, isAdmin, createProgram);

router.get('/', isAuthenticated, listPrograms);

router.get('/:id', isAuthenticated, viewProgram);

router.put('/:id', isAuthenticated, isAdmin, updateProgram);

router.patch('/:id/schools', isAuthenticated, isAdmin, addSchools);

router.get('/:id/schools', isAuthenticated, isAdmin, listSchools);

router.patch('/:id/courses', isAuthenticated, isAdmin, addCourses);

router.get('/:id/courses', isAuthenticated, isAdmin, listCourses);

router.delete('/:id', isAuthenticated, isAdmin, deleteProgram);