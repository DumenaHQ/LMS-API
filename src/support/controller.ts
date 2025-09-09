import { Request, Response, NextFunction } from 'express';
import {supportService} from './service';
import { send as sendResponse } from '../helpers/httpResponse';



export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.user;
        const question = await supportService.createQuestion({ ...req.body, user_id: id });
        sendResponse(res, 201, 'Question Posted', { question });
    } catch (err) {
        next(err);
    }
};



export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const questions = await supportService.list({}, true, true);
        sendResponse(res, 200, 'Questions Fetched', { questions });
    } catch (err) {
        next(err);
    }
};

export const getClassQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { class_id } = req.params;
        const questions = await supportService.fetchClassQuestions(class_id);
        sendResponse(res, 200, 'Questions Fetched', { questions });
    } catch (err) {
        next(err);
    }
};

export const getProgramQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { program_id } = req.params;
        const questions = await supportService.fetchProgramQuestions(program_id);
        sendResponse(res, 200, 'Questions Fetched', { questions });
    } catch (err) {
        next(err);
    }
};



export const createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.user;
        const { body, params: { question_id } } = req;
        const comment = await supportService.createComment({
            comment: body.comment,
            user_id: String(id),
            question_id
        });
        sendResponse(res, 201, 'Comment Posted', { comment });
    } catch (err) {
        next(err);
    }
};



export const getComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question_id } = req.params;
        const comments = await supportService.getComments(question_id);
        sendResponse(res, 200, 'Comments Fetched', { comments });
    } catch (err) {
        next(err);
    }
};
