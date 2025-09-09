import { Request, Response, NextFunction } from 'express';
import { courseService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';

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

export const createCourseModule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: courseId } = req.params;
        const module = await courseService.createModule(courseId, req.body);
        sendResponse(res, 201, 'Course Module Created', { module });
    } catch (err) {
        next(err);
    }
};

export const addLesson = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: courseId, moduleId } = req.params;
        const lesson_video = req.files && req.files.lesson_video || req.body.lesson_video || undefined;
        const lesson = await courseService.addLesson(courseId, moduleId, { ...req.body, lesson_video });
        sendResponse(res, 200, 'Lesson added', { lesson });
    } catch (err) {
        next(err);
    }
};

export const listCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role: userType, id: userId } = req.user;
        const courses = await courseService.listByUserType(userType, String(userId));
        sendResponse(res, 200, 'Courses fetched', { courses });
    } catch (err) {
        next(err);
    }
};

export const viewCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: courseId } = req.params;
        const { with_quiz: withQuiz } = req.query;
        const course = await courseService.view({ _id: courseId }, withQuiz == '1' ? true : false);
        sendResponse(res, 200, 'Course fetched', { course });
    } catch (err) {
        next(err);
    }
};

export const listModuleLessons = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: courseId, moduleId } = req.params;
        const module = await courseService.listModuleLessons(courseId, moduleId);
        sendResponse(res, 200, 'Module Lessons fetched', { module });
    } catch (err) {
        next(err);
    }
};

export const isLessonCompleted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: learnerId } = req.user;
        const { id: courseId, moduleId, lessonId } = req.params;
        const lessonStatus = await courseService.isLessonCompleted(courseId, moduleId, lessonId, String(learnerId));
        sendResponse(res, 200, 'Lesson Completion Status Fetched', lessonStatus);
    } catch (err) {
        next(err);
    }
};