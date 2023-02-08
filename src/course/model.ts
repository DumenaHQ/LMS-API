import mongoose, { Schema } from 'mongoose';

export const lesson = {
    id: Schema.Types.ObjectId,
    title: {
        type: String,
        required: true
    },
    further_reading: String,
    lesson_video: String,
    duration: Number,
    class_activity: String,
    code_example: String,
    instructor: { type: Schema.Types.ObjectId, ref: 'Instructor' }
}


export const module = {
    title: {
        type: String,
        required: true
    },
    lessons: [lesson]
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



