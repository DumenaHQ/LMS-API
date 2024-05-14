import { Router } from 'express';
import { isAuthenticated } from '../middleware/verifyToken';
import { createQuestion } from './controller';
import validate, { questionCreationRules } from '../middleware/validators/supportValidators';

export const router = Router();


// Api to create a question POST
router.post('/class/:class_id/questions', isAuthenticated, questionCreationRules(), validate, createQuestion );

// Api to get questions from a particular class GET
// router.get('/class/:id/questions');

// Api to get questions from a school GET
// router.get('/school/:id/questions');

// Api to get all questions GET
// router.get('/questions');

// Api to reply to a question POST
// router.post('/questions/:id/comments');

// Api to get all comments to a given question GET
// router.get('/questions/:id/comments');
