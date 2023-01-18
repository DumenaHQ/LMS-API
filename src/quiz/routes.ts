import { Router } from "express";
import { createQuiz, addQuestions } from './controller';
import { isAdmin, isAuthenticated } from "../middleware/verifyToken";

export const router = Router();

router.post('/', isAuthenticated, isAdmin, createQuiz);

router.post('/:id/questions', isAuthenticated, isAdmin, addQuestions);