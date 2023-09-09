import { Router } from "express";
import { isAuthenticated, isSchool, isSchoolOrAdmin } from "../middleware/verifyToken";
import { addSchoolStudents, downloadSchoolStudents, listSchoolStudents, removeChild } from "./controller";

export const router = Router();

router.get('/:id/learners', isAuthenticated, isSchoolOrAdmin, listSchoolStudents);

router.post('/:id/learners', isAuthenticated, isSchoolOrAdmin, addSchoolStudents);

router.delete('/:id/learners/:learnerid', isAuthenticated, isSchool, removeChild);

router.get('/:id/download-students-list', downloadSchoolStudents);