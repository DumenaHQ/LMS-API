import mongoose, { Schema } from 'mongoose';
import { EActivityType } from './enums';
import { AuthenticationActivity, ClassroomActivity, ClickActivity, LessonActivity, QuizActivity } from './types';

const ActivitySchema = new Schema(
    {
        user: {
            required: true,
            type: Schema.Types.ObjectId,
            ref: 'User',
        },

        type: {
            required: true,
            type: typeof EActivityType
        },

        // Activities

        // Track authentication activities
        authentication:{
            required: false,
            type: typeof AuthenticationActivity
        },

        // Track classroom activities
        classroom: {
            required: false,
            type: typeof ClassroomActivity
        },

        // Track lesson activites
        lesson: {
            required: false,
            type: typeof LessonActivity
        },

        quiz: {
            required: false,
            type: typeof QuizActivity
        },

        click: {
            required: false,
            type: typeof ClickActivity
        }
    }, { timestamps: true }
);

export const Activity = mongoose.model('Activity', ActivitySchema);
