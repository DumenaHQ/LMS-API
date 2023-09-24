import { Request, Response, NextFunction } from "express";
import { quizService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";


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
        const quiz = await quizService.view({ _id: quizId });
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
        const { course_id: courseId, quiz_level, quiz_level_id } = req.body;
        await quizService.attachQuiz(quizId, courseId, quiz_level, quiz_level_id);
        sendResponse(res, 201, 'Quiz added to course');
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
}

export const submitQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        const { id: userId, school: school_id } = req.user;
        await quizService.saveAnswers(quizId, { userId, school_id }, req.body);
        sendResponse(res, 200, 'Quiz Submitted');
    } catch (err) {
        next(err);
    }
}