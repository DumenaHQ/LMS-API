import { Router } from 'express';
import { createQuiz, addQuestions, listQuizzes, viewQuiz, attachQuiz, submitQuiz } from './controller';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';

export const router = Router();

router.post('/', isAuthenticated, isAdmin, createQuiz);

router.post('/:id/questions', isAuthenticated, isAdmin, addQuestions);

router.get('/', isAuthenticated, isAdmin, listQuizzes);

router.get('/:id', isAuthenticated, viewQuiz);

router.put('/:id/attach', isAuthenticated, isAdmin, attachQuiz);

router.patch('/:id/submit-answers', isAuthenticated, submitQuiz);