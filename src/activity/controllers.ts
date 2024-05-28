import { Request, Response, NextFunction } from 'express';
import { activityService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';




export const recordUserActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { user :{id}, body:{activity_name, activity} } = req;
        const data = await activityService.createActivity(id, activity_name, activity);
        sendResponse(res, 201, 'Activity recorded', data);
    } catch (err) {
        next(err);
    }
};



export const listUserActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { user :{id} } = req;
        const activities = await activityService.listActivities({user: id});
        sendResponse(res, 200, 'Activities retrieved', activities);
    } catch (err) {
        next(err);
    }
};