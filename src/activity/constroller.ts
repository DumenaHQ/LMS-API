import { Request, Response, NextFunction } from 'express';
import useragent from 'useragent'; // for more info, visit https://www.npmjs.com/package/useragent

import { activityService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';
import { handleError } from '../helpers/handleError';



export const recordUserActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.user;
        let {activity_type, activity_data} = req.body;

        if (activity_type === 'login') {
            if (!req.headers) throw new handleError(400,'Something is wrong with this request, so we cant process it. Please verify you are sending this request with a header');
            // access device information
            const agent = useragent.lookup(req.headers['user-agent']);
            const device = `DEVICE: ${agent.device.toString()}. OPERATING_SYSTEM: ${agent.os.toString()}. BROWSER: ${agent.toString()}`;
            activity_data = {
                ...activity_data,
                meta:{
                    device,
                }
            };
        }

        const data = await activityService.create(id, activity_type, activity_data);
        sendResponse(res, 201, 'Activity recorded', data);
    } catch (err) {
        next(err);
    }
};


export const listUserActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.user;
        const activities = await activityService.list({user: id});
        sendResponse(res, 200, 'Activities', activities);
    } catch (err) {
        next(err);
    }
};