import mongoose, { Schema } from 'mongoose';
import { EActivityType } from './enum';


const ActivitySchema = new Schema(
    {
        user: {
            required: true,
            type: Schema.Types.ObjectId,
            ref: 'User',
        },

        activityType: {
            required: true,
            type: typeof EActivityType,
        },

        activityData: {
            required: true,
            type: Object
        }


    }, { timestamps: true }
);

export const Activity = mongoose.model('Activity', ActivitySchema);