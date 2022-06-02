import mongoose, { Schema } from 'mongoose';
import { quiz } from './quizModel';

export const lesson = {
    id: Schema.Types.ObjectId,
    title: {
        type: String,
        required: true
    },
    further_reading: String,
    video_url: String,
    class_activity: String,
    code_example: String,
    instructor: { type: Schema.Types.ObjectId, ref: 'Instructor' }
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
    lessons: [lesson],
    quizzes: [quiz]
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);



