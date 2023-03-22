import { ObjectId, Document } from "mongoose";

export interface IQuiz extends Document {
    id?: ObjectId;
    course_id: ObjectId;
    title: String,
    tags: [],
    difficulty_level: String,
    course_quadrant: String,
    quiz_level?: String,
    quiz_level_id?: ObjectId,
    settings: {},
    questions?: []
}

export interface IQuizQuestion {
    question: String;
    optA: String;
    optB: String;
    optC?: String;
    optD?: String;
    optE?: String;
    answer: String;
}

export interface IQuizQuestions {
    [key: number]: IQuizQuestion;
}

export interface IQuizResult {
    learner: ObjectId;
    answers: [];
    school_id: ObjectId;
    num_of_questions: Number;
}