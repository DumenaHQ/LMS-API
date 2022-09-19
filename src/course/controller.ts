import { Request, Response, NextFunction } from "express";
import { courseService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const course = await courseService.save(req.body);
        sendResponse(res, 201, 'Course created', { course });
    } catch (err) {
        next(err);
    }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: courseId } = req.params;
        const course = await courseService.save(req.body, courseId);
        sendResponse(res, 200, 'Course Updated', { course });
    } catch (err) {
        next(err);
    }
};

export const addLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: courseId } = req.params;
        const lesson_video = req.files && req.files.lesson_video || undefined;
        const lesson = await courseService.addLesson(courseId, { ...req.body, lesson_video });
        sendResponse(res, 200, 'Lesson added', { lesson });
    } catch (err) {
        console.log(err)
        next(err);
    }
};

export const addQuiz = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: courseId } = req.params;
        const quiz = await courseService.addQuizToCourse(courseId, req.body);
        sendResponse(res, 200, 'Quiz added', { quiz });
    } catch (err) {
        next(err);
    }
};

export const listCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role: userType, id: userId } = req.user;
        const courses = await courseService.listByUserType(userType, userId);
        sendResponse(res, 200, 'Courses fetched', { courses });
    } catch (err) {
        next(err);
    }
};

export const viewCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: courseId } = req.params;
        const course = await courseService.view({ _id: courseId });
        sendResponse(res, 200, 'Course fetched', { course });
    } catch (err) {
        next(err);
    }
};