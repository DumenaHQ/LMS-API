import mongoose, { Schema } from 'mongoose';

const quizQuestion = {
    question: String,
    optA: String,
    optB: String,
    optC: String,
    optD: String,
    optE: String,
    answer: String
}

const quizSchema = new Schema({
    course_id: Schema.Types.ObjectId,
    title: String,
    tags: [],
    difficulty_level: String,
    course_quadrant: String,
    level: String,
    level_id: Schema.Types.ObjectId,
    settings: {},
    questions: [quizQuestion]
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);


const quizResultSchema = new Schema({
    learner: { type: Schema.Types.ObjectId, ref: 'Learner' },
    answers: [],
    course_id: Schema.Types.ObjectId,
    num_of_questions: Number
}, { timestamps: true });

export const QuizResult = mongoose.model('AssessmentResult', quizResultSchema);