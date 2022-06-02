import mongoose, { Schema } from 'mongoose';

const quizQuestions = {
    question: String,
    optA: String,
    optB: String,
    optC: String,
    optD: String,
    optE: String,
    answer: String
}

export const quiz = {
    id: Schema.Types.ObjectId,
    title: String,
    tags: [],
    difficulty_level: String,
    course_quadrant: String,
    settings: {},
    questions: [quizQuestions]
}


const quizResultSchema = new Schema({
    learner: { type: Schema.Types.ObjectId, ref: 'Learner' },
    answers: [],
    courseId: Schema.Types.ObjectId,
    num_of_questions: Number
}, { timestamps: true });

export const QuizResult = mongoose.model('AssessmentResult', quizResultSchema);