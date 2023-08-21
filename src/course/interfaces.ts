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
    access_scopes: String[];
    thumb_photo: any;
    thumb_url: String
}

export interface ICourseEdit {
    id: ObjectId;
    access_scopes: [];
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
    modules?: IModule[];
    quizzes: [typeof Quiz];
    createdAt: Date;
    updatedAt: Date;
}

export interface IModule {
    id?: ObjectId;
    title: String;
    objectives: String;
    further_reading: String;
    further_reading_links: String;
    duration: Number;
    class_activities: String;
    code_example: String;
    instructor: ObjectId
    lessons?: [typeof lesson]
}

export interface ILesson {
    id?: ObjectId;
    title: String;
    note: String;
    has_video: Boolean;
    duration?: Number;
    lesson_video: any;
}