import { Request } from 'express';
import useragent from 'useragent';

import { EActivityType } from './enum';
import { Activity } from './model';
import { handleError } from '../helpers/handleError';
import { userService } from '../user/service';
import { miscService } from '../misc/miscService';


export const activityService = {
    async create(req: Request, userId: string, activityType: EActivityType, activityData: object) {

        if (!req.headers)
            throw new handleError(400, 'Something is wrong with this request, so we cant process it. Please verify you are sending this request with a header');
        // access device information
        const agent = useragent.lookup(req.headers['user-agent']);
        const device = `DEVICE: ${agent.device.toString()}. OPERATING_SYSTEM: ${agent.os.toString()}. BROWSER: ${agent.toString()}`;

        const activeSession = await miscService.fetchCurrentSession();
        const activeTerm = miscService.findActiveTerm(activeSession);
        activityData = {
            ...activityData,
            user: userId,
            activityType,
            activeSession: activeSession._id,
            term: activeTerm.title,
            meta: {
                device,
            }
        };

        // return Activity.create(activityData);
    },

    async list(match = {}) {
        const activeSession = await miscService.fetchCurrentSession();
        const activeTerm = miscService.findActiveTerm(activeSession);
        const criteria = {
            ...match,
            activeSession: activeSession._id,
            term: activeTerm.title,
        };
        return Activity.find(criteria).select({ activeSession: 0, term: 0 }).sort({ createdAt: -1 }).limit(15);
    },

    async getActivityDetails(activity: Record<string, any>) {
        const { user, activityType, activityData, createdAt } = activity;

        switch (activityType) {
            case EActivityType.COMPLETED_LESSON:

            case EActivityType.COMPLETED_QUIZ:
        }
    },


    async listSchoolLearnersActivities(school_id: string) {
        const { learners: students, grades } = await userService.listSchoolStudents(school_id, {});

        const data = await Promise.all(
            students.flatMap(async (student) => {
                const { id, fullname, username, role } = student;

                const activities = await this.list({ user: id });
                const studentActivities = await Promise.all(
                    activities.flatMap(async (activity) => {
                        return {
                            user: { id, role, fullname, username },
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