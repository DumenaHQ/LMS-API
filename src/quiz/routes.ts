import { Router } from "express";
import { addQuiz, addQuizQuestions } from './controller';
// import validate, { courseCreationRules } from '../middleware/validators/courseValidators';
import { isAdmin, isAuthenticated } from "../middleware/verifyToken";

export const router = Router();

router.post('/', isAuthenticated, isAdmin, addQuiz);

router.post('/:id/questions', isAuthenticated, isAdmin, addQuizQuestions);