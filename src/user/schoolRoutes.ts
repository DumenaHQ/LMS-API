import { Router } from "express";
import { isAuthenticated, isSchool } from "../middleware/verifyToken";
import { addSchoolStudents, listSchoolStudents } from "./controller";

export const router = Router();

router.get('/:id/learners', isAuthenticated, isSchool, listSchoolStudents);

router.post('/:id/learners', isAuthenticated, isSchool, addSchoolStudents);