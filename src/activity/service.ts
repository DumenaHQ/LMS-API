import { Request } from 'express';
import useragent from 'useragent'; // for more info, visit https://www.npmjs.com/package/useragent

import { EActivityType } from './enum';
import { Activity } from './model';
import { handleError } from '../helpers/handleError';
import { userService } from '../user/service';


export const activityService = {
    async create(req: Request, userId: string, activityType:EActivityType, activityData: object){

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
        
        return Activity.create({ user: userId, activityType, activityData });
    },

    async list(match = {}){
        return Activity.find(match);
    },


    async listSchoolLearnersActivities(school_id: string ) {
        const { learners: students, grades } = await userService.listSchoolStudents(school_id, {});

        const data = await Promise.all(

            students.flatMap(async (student) => {
                const { id, fullname, username, role } = student;
    
                const activities = await this.list({user: id});
                const studentActivities = await Promise.all(
                    activities.flatMap(async (activity) => {
                        return {
                            user:{id, role, fullname, username},
                            activity,
                        };
                    })
                );

                return studentActivities;
            })
        );

        return data.flatMap((student) => {
            return student;
        });
    }
};