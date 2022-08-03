import { ObjectId, Document } from 'mongoose';
import { lesson } from './model';
import { quiz } from './quizModel';

export interface ICourseCreate {
    id?: ObjectId;
    title: String;
    description: String;
    tags: [];
    difficult_level: String;
    course_quadant: String;
    thumb_photo: any;
    thumb_url: String
}

export interface ICourseEdit {
    id: ObjectId;
    thumb_photo?: String;
    thumb_url: String;
}

export interface ICourseView extends Document {
    title: String;
    description: String;
    tags?: [];
    difficult_level: String;
    course_quadant: String;
    thumb_url: String;
    lesson_count: Number;
    lessons?: [typeof lesson];
    quizzes: [typeof quiz];
    createdAt: Date;
    updatedAt: Date;
}

export interface ILesson {
    id?: ObjectId;
    title: String;
    further_reading: String;
    lesson_video: any;
    class_activity: String;
    code_example: String;
    instructor: ObjectId
}

export interface IQuiz {
    id?: ObjectId;
    title: String,
    tags: [],
    difficulty_level: String,
    course_quadrant: String,
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
    courseId: ObjectId;
    quizId: ObjectId;
}

export interface IQuizResult {
    learner: ObjectId;
    answers: [];
    courseId: ObjectId;
    lessonId: ObjectId
    num_of_questions: Number;
}