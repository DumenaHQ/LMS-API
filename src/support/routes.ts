import { Router } from 'express';
import { isAuthenticated } from '../middleware/verifyToken';
import { createComment, createQuestion, getClassQuestions, getComments, getProgramQuestions, getQuestions } from './controller';
import validate, { commentCreationRules, getCommentsRules, getQuestionsRules, questionCreationRules } from '../middleware/validators/supportValidators';

export const router = Router();


router.post('/questions', isAuthenticated, questionCreationRules(), validate, createQuestion );

router.get('/questions', isAuthenticated, getQuestions);

router.get('/class/:class_id/questions', isAuthenticated, getQuestionsRules(),validate, getClassQuestions);

router.get('/program/:program_id/questions', isAuthenticated, getProgramQuestions);

router.post('/questions/:question_id/comments', isAuthenticated, commentCreationRules(), validate, createComment);

router.get('/questions/:question_id/comments', isAuthenticated, getCommentsRules(), validate, getComments);
