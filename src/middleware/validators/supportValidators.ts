import { body, param } from 'express-validator';
import { validate } from './validate';
import { Types } from 'mongoose';
import { classService } from '../../class/service';
import { courseService } from '../../course/service';

export default validate;


export const questionCreationRules = () => {
    return [
        body('question').notEmpty().isString().isLength({max: 5000, min: 2}),
        param('class_id').notEmpty().isMongoId().custom(async (class_id: string) => {
            // Check if class with id actually exist
            const classExist = await classService.view({ _id: class_id });
            if (!classExist) throw new Error(`Class with id ${class_id} does not exist`);
            return true;
        }),
        body('course_id').notEmpty().isMongoId().custom(async (course_id: string) => {
            // Check if course with id actually exist
            const courseExist =  await courseService.view({ _id: course_id });
            if (!courseExist) throw new Error(`Course with id ${course_id} does not exist`);
            return true;
        }),
        body('lesson').custom(async (lesson: any) => {
            // Check if the lesson object has all the required properties
            if (
                typeof lesson === 'object' &&
        lesson !== null &&
        Types.ObjectId.isValid(lesson.id) &&
        typeof lesson.title === 'string' &&
        typeof lesson.note === 'string' 
        // &&
        // typeof lesson.has_video === 'boolean' &&
        // typeof lesson.duration === 'number' &&
        // typeof lesson.lesson_video === 'string' &&
        // Types.ObjectId.isValid(lesson.quiz_link)
            ) {
                // Object matches the Lesson schema
                return true;
            }else {
                throw new Error('Invalid lesson object');
            }
        })
    ];
};