import { Router } from 'express';
import { createQuiz, addQuestions, listQuizzes, viewQuiz, attachQuiz, submitQuiz, getLearnerQuizResult, updateQuiz, updateQuizQuestion, deleteQuiz, removeQuiz } from './controller';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';

export const router = Router();

router.post('/', isAuthenticated, isAdmin, createQuiz);

router.post('/:id/questions', isAuthenticated, isAdmin, addQuestions);

router.get('/', isAuthenticated, isAdmin, listQuizzes);

router.get('/:id', isAuthenticated, viewQuiz);

router.put('/:id', isAuthenticated, isAdmin, updateQuiz);

router.delete('/:id', isAuthenticated, isAdmin, deleteQuiz);

router.put('/:id/questions/questionId', isAuthenticated, isAdmin, updateQuizQuestion);

router.put('/:id/attach', isAuthenticated, isAdmin, attachQuiz);

router.patch('/:id/remove', isAuthenticated, isAdmin, removeQuiz);

router.patch('/:id/submit-answers', isAuthenticated, submitQuiz);

router.get('/:id/learners/:learnerId/result', isAuthenticated, getLearnerQuizResult);
