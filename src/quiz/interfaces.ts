import { ObjectId, Document } from 'mongoose';

export interface IQuiz extends Document {
    id?: ObjectId;
    course_id: ObjectId;
    module_id: ObjectId;
    lesson_id: ObjectId;
    title: string,
    tags: [],
    difficulty_level: string,
    course_quadrant: string,
    quiz_level?: string,
    quiz_level_id?: ObjectId,
    settings: object,
    questions?: [],
    answers?: []
}

export interface IQuizQuestion {
    answer: any;
    _id?: ObjectId;
    question: string;
    optA: string;
    optB: string;
    optC?: string;
    optD?: string;
    optE?: string;
}

export interface IQuizQuestions {
    [key: number]: IQuizQuestion;
}

export interface IQuizAnswer {
    learner: ObjectId;
    answers: [];
    school_id: ObjectId;
}