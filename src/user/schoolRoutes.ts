import { Router } from "express";
import { isAuthenticated, isSchool, isSchoolOrAdmin } from "../middleware/verifyToken";
import { addSchoolStudents, downloadSchoolStudents, listSchoolStudents } from "./controller";

export const router = Router();

router.get('/:id/learners', isAuthenticated, isSchool, listSchoolStudents);

router.post('/:id/learners', isAuthenticated, isSchool, addSchoolStudents);

router.get('/:id/download-students-list', downloadSchoolStudents);