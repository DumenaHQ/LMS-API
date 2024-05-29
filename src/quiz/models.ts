import mongoose, { Schema } from 'mongoose';

enum EQuiztype {
    Multichoice = 'multichoice',
    Essay = 'essay'
}

enum EQuizLevel {
    Course = 'course',
    Module = 'module',
    Lesson = 'lesson'
}

export type QuizLevelType = Record<EQuizLevel, string>;

const quizQuestion = {
    // id: Schema.Types.ObjectId,
    question: String,
    optA: String,
    optB: String,
    optC: String,
    optD: String,
    optE: String,
    answer: String
};

export const quizAnswers = {
    learner: Schema.Types.ObjectId,
    answers: [],
    school_id: Schema.Types.ObjectId,
    date_created: {
        type: Date,
        default: Date.now
    }
};

const quizSchema = new Schema({
    // course_id: Schema.Types.ObjectId,
    title: String,
    tags: [],
    difficulty_level: String,
    course_quadrant: String,
    quiz_level: {
        type: String,
        default: EQuizLevel.Module,
        enum: EQuizLevel
    },
    // quiz_level_id: Schema.Types.ObjectId,
    quiz_type: {
        type: String,
        default: EQuiztype.Multichoice,
        enum: EQuiztype
    },
    settings: {},
    questions: [quizQuestion],
    answers: [quizAnswers]
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);

