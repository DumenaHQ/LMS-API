import mongoose, { Schema } from 'mongoose';

export const lesson = {
    id: Schema.Types.ObjectId,
    title: {
        type: String,
        required: true
    },
    duration: Number,
    lesson_video: String,
}


export const module = {
    title: {
        type: String,
        required: true
    },
    objectives: String,
    further_reading: String,
    duration: Number,
    class_activities: String,
    code_example: String,
    instructor: { type: Schema.Types.ObjectId, ref: 'Instructor' },
    lessons: [lesson],
    date_added: {
        type: Date,
        default: Date.now
    }
}


const courseSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    tags: [],
    difficulty_level: String,
    course_quadrant: String,
    thumb_url: String,
    access_scopes: [],
    modules: [module],
    deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);



