import { Request, Response, NextFunction } from 'express';

import { activityService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';



export const recordUserActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.user;
        const { activity_type, activity_data } = req.body;
        const data = await activityService.create(req, id, activity_type, activity_data);
        sendResponse(res, 201, 'Activity recorded', data);
    } catch (err) {
        next(err);
    }
};


export const listUserActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, fullname, username, role } = req.user;
        const activities = await activityService.list({user: id});
        const data = {
            user:{id, role, fullname, username},
            activities
        };
        sendResponse(res, 200, 'Activities fetched', data);
    } catch (err) {
        next(err);
    }
};