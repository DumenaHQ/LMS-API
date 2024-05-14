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
