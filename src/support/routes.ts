import { Router } from 'express';
import { isAuthenticated } from '../middleware/verifyToken';
import { createComment, createQuestion, getComments, getQuestions, getSchoolQuestions } from './controller';
import validate, { commentCreationRules, getCommentsRules, getQuestionsRules, getSchoolQuestionsRules, questionCreationRules } from '../middleware/validators/supportValidators';

export const router = Router();


// Api to create a question POST
router.post('/questions', isAuthenticated, questionCreationRules(), validate, createQuestion );

// Api to get all questions GET
router.get('/questions', isAuthenticated, getQuestions);

// Api to get questions from a particular class GET
router.get('/class/:class_id/questions', isAuthenticated, getQuestionsRules(),validate, getQuestions);

// Api to get questions from a school GET
router.get('/school/:school_id/questions', isAuthenticated, getSchoolQuestionsRules(), validate, getSchoolQuestions);

// Api to reply to a question POST
router.post('/questions/:question_id/comments', isAuthenticated, commentCreationRules(), validate, createComment);

// Api to get all comments to a given question GET
router.get('/questions/:question_id/comments', isAuthenticated, getCommentsRules(), validate, getComments);
