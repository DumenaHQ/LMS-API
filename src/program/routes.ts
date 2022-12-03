import { Router } from 'express';
import { isAdmin, isAuthenticated, isParent, isSchoolOrAdmin } from "../middleware/verifyToken";
import { addCourses, addLearners, addParents, addSchools, createProgram, deleteProgram, listCourses, listPrograms, listSchools, updateProgram, viewProgram } from './controller';

export const router = Router();


router.post('/', isAuthenticated, isAdmin, createProgram);

router.get('/', isAuthenticated, listPrograms);

router.get('/:id', isAuthenticated, viewProgram);

router.put('/:id', isAuthenticated, isAdmin, updateProgram);

router.get('/:id/schools', isAuthenticated, isSchoolOrAdmin, listSchools);

router.patch('/:id/schools', isAuthenticated, isSchoolOrAdmin, addSchools);

router.patch('/:id/parents', isAuthenticated, isParent, addParents);

router.patch('/:id/courses', isAuthenticated, isAdmin, addCourses);

router.get('/:id/courses', isAuthenticated, listCourses);

router.patch('/:id/learners', isAuthenticated, addLearners);

router.delete('/:id', isAuthenticated, isAdmin, deleteProgram);