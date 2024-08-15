import { ObjectId, Document } from 'mongoose';
import { lesson } from './model';
import Quiz from '../quiz/models';

export interface ICourseCreate {
    id?: ObjectId;
    title: string;
    description: string;
    tags: [];
    difficult_level: string;
    course_quadant: string;
    access_scopes: string[];
    thumb_photo: any;
    thumb_url: string
}

export interface ICourseEdit {
    id: ObjectId;
    access_scopes: [];
    thumb_photo?: string;
    thumb_url: string;
}

export interface ICourseView extends Document {
    title: string;
    description: string;
    tags?: [];
    difficult_level: string;
    course_quadant: string;
    thumb_url: string;
    lesson_count: number;
    duration?: string;
    modules?: IModule[];
    quiz?: typeof Quiz;
    createdAt: Date;
    updatedAt: Date;
}

export interface IModule {
    _id?: ObjectId;
    title: string;
    objectives: string;
    further_reading: string;
    further_reading_links: string;
    duration: number;
    class_activities: string;
    code_example: string;
    instructor?: ObjectId;
    lessons?: [typeof lesson];
    quiz_id?: ObjectId;
    quiz?: typeof Quiz;
}

export interface ILesson {
    _id?: ObjectId;
    title: string;
    note: string;
    has_video: boolean;
    duration?: number;
    lesson_video: any;
    quiz_id?: ObjectId;
    quiz?: typeof Quiz;
}