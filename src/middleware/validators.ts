const { check, body, validationResult } = require("express-validator");
import { send as sendResponse } from '../helpers/httpResponse';
import TeamModel from '../models/team';

export const teamCreationRules = () => {
    return [
        check('name').not().isEmpty().withMessage('Team name cannot be empty'),
        check('manager').not().isEmpty().withMessage('Manage cannot be empty'),
        check('name').custom(async name => {
            const team = await TeamModel.findOne({ name });
            if (team) throw new Error('Duplicate team name');
        })
    ];
}

export const fixtureCreationRules = () => {
    return [
        check('teamA').not().isEmpty().withMessage('TeamA name cannot be empty'),
        check('teamB').not().isEmpty().withMessage('TeamB cannot be empty'),
        check('teamA').custom(async id => {
            const team = await TeamModel.findOne({ _id: id });
            if (!team) throw new Error('TeamA not found');
        }),
        check('teamB').custom(async id => {
            const team = await TeamModel.findOne({ _id: id });
            if (!team) throw new Error('TeamB not found');
        }),
        check('venue').not().isEmpty().withMessage('Fixture venue cannot be empty'),
        check('time').not().isEmpty().withMessage('Fixute time cannot be empty'),
    ];
}

export const validate = (req, res, next) => {
    const raw_errors = validationResult(req);

    if (raw_errors.isEmpty()) {
        return next();
    }

    const errors = raw_errors.errors.map(err => ({ message: err.msg }));

    return sendResponse(res, 400, 'Invalid Input', errors);
}