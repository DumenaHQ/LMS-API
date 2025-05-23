import { body, check, param } from 'express-validator';
import { validate } from './validate';
import { Types } from 'mongoose';
import { classService } from '../../class/service';
import { courseService } from '../../course/service';
import { Question } from '../../support/model';

export default validate;


export const questionCreationRules = () => {
    return [
        body('question').notEmpty().isString().isLength({ max: 5000, min: 2 }),
        // body('class_id').notEmpty().isMongoId().custom(async (class_id: string) => {
        //     // Check if class with id actually exist
        //     const classExist = await classService.findOne({ _id: class_id });
        //     if (!classExist) throw new Error(`Class with id ${class_id} does not exist`);
        //     return true;
        // }),
        body('course_id').notEmpty().isMongoId().custom(async (course_id: string) => {
            // Check if course with id actually exist
            const courseExist = await courseService.findOne({ _id: course_id });
            if (!courseExist) throw new Error(`Course with id ${course_id} does not exist`);
            return true;
        }),
        body('lesson').custom(async (lesson: any) => {
            // Check if the lesson object has all the required properties
            if (
                typeof lesson === 'object'
                && lesson !== null
                && Types.ObjectId.isValid(lesson.id)
                && typeof lesson.title === 'string'
            ) {
                // Object matches the Lesson schema
                return true;
            } else {
                throw new Error('Invalid lesson object');
            }
        })
    ];
};


export const getQuestionsRules = () => {
    return [
        param('class_id').notEmpty().isMongoId().custom(async (class_id: string) => {
            const classExist = await classService.findOne({ _id: class_id });
            if (!classExist) throw new Error(`Class with id ${class_id} does not exist`);
            return true;
        }),
    ];
};

export const commentCreationRules = () => {
    return [
        body('comment').notEmpty().isString().isLength({ max: 5000, min: 2 }),
        check('question_id').notEmpty().isMongoId().custom(async (question_id: string) => {
            // Check if question with id actually exist
            const questionExist = await Question.findById(question_id);
            if (!questionExist) throw new Error(`Question with id ${question_id} does not exist`);
            return true;
        }),
    ];
};

export const getCommentsRules = () => {
    return [
        check('question_id').notEmpty().isMongoId().custom(async (question_id: string) => {
            // Check if question with id actually exist
            const questionExist = await Question.findById(question_id);
            if (!questionExist) throw new Error(`Question with id ${question_id} does not exist`);
            return true;
        }),
    ];
};