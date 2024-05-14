import { Router } from 'express';

export const router = Router();


// Api to create a question POST
router.post('/class/:id/questions');

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
