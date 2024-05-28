import { handleError } from '../helpers/handleError';
import { isInEnum } from '../helpers/utility';
import { EActivityType } from './enums';
import { Activity } from './models';
import { AuthenticationActivity, ClassroomActivity, ClickActivity, LessonActivity, QuizActivity } from './types';

export const activityService = {

    async createActivity(userId: string, activityName: EActivityType, data: typeof AuthenticationActivity | typeof ClassroomActivity | typeof LessonActivity | typeof QuizActivity | typeof ClickActivity){

        if (isInEnum(EActivityType, activityName) && typeof data === typeof AuthenticationActivity || typeof ClassroomActivity || typeof LessonActivity || typeof QuizActivity || typeof ClickActivity){
            const activity = await Activity.create({
                user: userId,
                type: activityName,
                click: data
            });
            return activity;  
        } else {throw new handleError(400,'Invalid request');}
    },

    async listActivities(match = {}){
        const activities = await Activity.find(match);
        return activities;
    },

};