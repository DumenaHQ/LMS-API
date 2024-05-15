import { Request, Response, NextFunction } from 'express';
import {supportService} from './service';
import { send as sendResponse } from '../helpers/httpResponse';


// Controller to create a question
export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.user;
        const body = req.body;
        const param = req.params;

        const question = await supportService.createQuestion({
            question: body.question,
            user_id: id,
            class_id: param.class_id,
            course_id: body.course_id,
            lesson: body.lesson,
        });
        sendResponse(res, 201, 'success', { question });
    } catch (err) {
        console.log(err);
        next(err);
    }
};


// Controller to get questions GET
export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const param = req.params;
        const questions = await supportService.getQuestions(param.class_id);
        sendResponse(res, 200, 'success', { questions });
    } catch (err) {
        next(err);
    }
};

// Controller to get questions from a school GET

export const getSchoolQuestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const param = req.params;
        const questions = await supportService.getQuestions(undefined, param.school_id);
        sendResponse(res, 200, 'success', { questions });
    } catch (err) {
        next(err);
    }
};


// Controller to create a comment replying to a question
export const createComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.user;
        const body = req.body;
        const param = req.params;

        const comment = await supportService.createComment({
            comment: body.comment,
            user_id: id,
            question_id: param.question_id
        });
        sendResponse(res, 201, 'success', { comment });
    } catch (err) {
        next(err);
    }
};


// COntroller to get all comments to a given question GET
export const getComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const param = req.params;
        const comments = await supportService.getComments(param.question_id);
        sendResponse(res, 200, 'success', { comments });
    } catch (err) {
        next(err);
    }
};
