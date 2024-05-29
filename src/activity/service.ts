import { EActivityType } from './enum';
import { Activity } from './model';

export const activityService = {
    async create(userId: string, activityType:EActivityType, activityData: object){
        const activity = await Activity.create({ user: userId, activityType, activityData });
        return activity;
    },

    async list(match = {}){
        const activities = await Activity.find(match);
        return activities;
    },
};