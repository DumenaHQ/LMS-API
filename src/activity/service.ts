import { Request } from 'express';
import useragent from 'useragent'; // for more info, visit https://www.npmjs.com/package/useragent

import { EActivityType } from './enum';
import { Activity } from './model';
import { handleError } from '../helpers/handleError';


export const activityService = {
    async create(req: Request, userId: string, activityType:EActivityType, activityData: object){
        if (activityType === 'login') {
            if (!req.headers) throw new handleError(400,'Something is wrong with this request, so we cant process it. Please verify you are sending this request with a header');
            // access device information
            const agent = useragent.lookup(req.headers['user-agent']);
            const device = `DEVICE: ${agent.device.toString()}. OPERATING_SYSTEM: ${agent.os.toString()}. BROWSER: ${agent.toString()}`;
            activityData = {
                ...activityData,
                meta:{
                    device,
                }
            };
        }
        return Activity.create({ user: userId, activityType, activityData });
    },

    async list(match = {}){
        return Activity.find(match);
    },
};