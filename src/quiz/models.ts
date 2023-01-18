import mongoose, { Schema } from 'mongoose';

enum EQuiztype {
    Multichoice = 'multichoice',
    Essay = 'essay'
}

const quizQuestion = {
    question: String,
    optA: String,
    optB: String,
    optC: String,
    optD: String,
    optE: String,
    answer: String
}

const quizResult = {
    learner: Schema.Types.ObjectId,
    answers: [],
    num_of_questions: Number,
    school_id: Schema.Types.ObjectId,
    date_created: Date
}

const quizSchema = new Schema({
    course_id: Schema.Types.ObjectId,
    title: String,
    tags: [],
    difficulty_level: String,
    course_quadrant: String,
    level: String,
    level_id: Schema.Types.ObjectId,
    quiz_type: {
        type: String,
        default: EQuiztype.Multichoice,
        enum: EQuiztype
    },
    settings: {},
    questions: [quizQuestion],
    answers: [quizResult]
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);