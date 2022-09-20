import { ObjectId, Document } from 'mongoose';
import { lesson } from './model';
import Quiz from '../quiz/models';

export interface ICourseCreate {
    id?: ObjectId;
    title: String;
    description: String;
    tags: [];
    difficult_level: String;
    course_quadant: String;
    access_scopes: [];
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
    duration?: String;
    lessons?: [typeof lesson];
    quizzes: [typeof Quiz];
    createdAt: Date;
    updatedAt: Date;
}

export interface ILesson {
    id?: ObjectId;
    title: String;
    further_reading: String;
    lesson_video: any;
    duration: Number;
    class_activity: String;
    code_example: String;
    instructor: ObjectId
}