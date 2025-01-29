import { Request, Response, NextFunction } from 'express';
import { quizService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';


export const createQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const quiz = await quizService.create(req.body);
        sendResponse(res, 201, 'Quiz added', { quiz });
    } catch (err) {
        next(err);
    }
};

export const viewQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        const { id, role } = req.user;
        const quiz = await quizService.view({ _id: quizId }, { id, role });
        sendResponse(res, 200, 'Quiz Fetched', { quiz });
    } catch (err) {
        next(err);
    }
};

export const listQuizzes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const quizzes = await quizService.list({});
        sendResponse(res, 200, 'Quizzes Fetch', { quizzes });
    } catch (err) {
        next(err);
    }
};

export const attachQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        const { course_id: courseId, quiz_level, module_id, lesson_id } = req.body;
        await quizService.attachQuiz(quizId, courseId, quiz_level, module_id, lesson_id);
        sendResponse(res, 201, 'Quiz added to course');
    } catch (err) {
        next(err);
    }
};

export const removeQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        const { course_id: courseId, quiz_level, module_id, lesson_id } = req.body;
        await quizService.removeQuiz(quizId, courseId, quiz_level, module_id, lesson_id);
        sendResponse(res, 201, 'Quiz removed from course');
    } catch (err) {
        next(err);
    }
};

export const updateQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        await quizService.updateQuiz(quizId, req.body);
        sendResponse(res, 200, 'Quiz Updated');
    } catch (err) {
        next(err);
    }
};

export const deleteQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        await quizService.deleteQuiz(quizId);
        sendResponse(res, 200, 'Quiz Deleted');
    } catch (err) {
        next(err);
    }
};

export const addQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        await quizService.saveQuizQuestions(quizId, req.body);
        sendResponse(res, 200, 'Questions Added to quiz');
    } catch (err) {
        next(err);
    }
};

export const updateQuizQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId, questionId } = req.params;
        await quizService.updateQuizQuestion(quizId, questionId, req.body);
        sendResponse(res, 200, 'Quiz Question Updated');
    } catch (err) {
        next(err);
    }
};

export const submitQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        const { id: userId, school: school_id } = req.user;
        await quizService.saveAnswers(quizId, { userId: String(userId), school_id: String(school_id) }, req.body);
        sendResponse(res, 200, 'Quiz Submitted');
    } catch (err) {
        next(err);
    }
};

export const getLearnerQuizResult = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId, learnerId } = req.params;
        // const { id: userId, school: school_id } = req.user;
        const result = await quizService.computeLearnerResult(quizId, learnerId);
        sendResponse(res, 200, 'Quiz Result', result);
    } catch (err) {
        next(err);
    }
};