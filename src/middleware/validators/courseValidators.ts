const { check } = require("express-validator");
import { DIFFICULTY_LEVEL, COURSE_QUADRANT } from '../../config/constants';
import { validate } from './validate';

export default validate;

export const courseCreationRules = () => {
    return [
        check('title').not().isEmpty().withMessage('Course must have a title'),
        check('description').not().isEmpty().withMessage('Course must have a description'),
        check('difficulty_level').not().isEmpty().withMessage('Difficulty level must be specified'),
        check('course_quadrant').not().isEmpty().withMessage('Course quadrant must be specified'),
        check('difficulty_level').custom(async (level: string) => {
            if (!DIFFICULTY_LEVEL.includes(level)) throw new Error(`Invalid difficulty level, Choose from any of these: [${DIFFICULTY_LEVEL.join(', ')}]`);
        }),
        check('course_quadrant').custom(async (quadrant: string) => {
            if (!COURSE_QUADRANT.includes(quadrant)) throw new Error('Invalid course quadrant');
        })
    ];
}