import { Request, Response, NextFunction } from 'express';
import {supportService} from './service';
import { send as sendResponse } from '../helpers/httpResponse';



export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.user;
        const question = await supportService.createQuestion({ ...req.body, user_id: id });
        sendResponse(res, 201, 'success', { question });
    } catch (err) {
        next(err);
    }
};



export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { class_id }= req.params;
        const questions = await supportService.getQuestions(class_id);
        sendResponse(res, 200, 'success', { questions });
    } catch (err) {
        next(err);
    }
};



export const getSchoolQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { school_id } = req.params;
        const questions = await supportService.getQuestions(undefined, school_id);
        sendResponse(res, 200, 'success', { questions });
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
            user_id: id,
            question_id
        });
        sendResponse(res, 201, 'success', { comment });
    } catch (err) {
        next(err);
    }
};



export const getComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question_id } = req.params;
        const comments = await supportService.getComments(question_id);
        sendResponse(res, 200, 'success', { comments });
    } catch (err) {
        next(err);
    }
};
