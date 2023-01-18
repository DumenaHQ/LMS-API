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

export const addQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: quizId } = req.params;
        await quizService.saveQuizQuestions(quizId, req.body);
        sendResponse(res, 200, 'Quiz Questions Saved');
    } catch (err) {
        next(err);
    }
}