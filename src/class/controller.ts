import { Request, Response, NextFunction } from "express";
import { classService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";


export const createClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: school_id } = req.user;
        const _class = await classService.create({ ...req.body, school_id }, req.files);
        sendResponse(res, 201, 'Class created', { class: _class });
    } catch (err) {
        next(err);
    }
}

export const addCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const { courses: courseIds } = req.body;
        await classService.addCourses(classId, courseIds);
        sendResponse(res, 200, 'Course(s) added to class');
    } catch (err) {
        next(err)
    }
}


export const listCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const courses = await classService.listCourses(classId);
        sendResponse(res, 200, 'Class Courses Fetched', { courses });
    } catch (err) {
        next(err)
    }
}


export const addLearners = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;

        const { learners } = req.body;
        await classService.addLearners(classId, learners);
        sendResponse(res, 200, 'Learners Added');
    } catch (err) {
        next(err)
    }
}


export const listLearners = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const { user: { id: userId, role: userType } } = req;
        const learners = await classService.fetchLearnerDetails(classId, userType, userId);
        sendResponse(res, 200, 'Learners Fetched', { learners });
    } catch (err) {
        next(err)
    }
}


export const listClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId, role } = req.user;
        const classes = await classService.listClassesForRoles(userId, role);
        sendResponse(res, 200, 'Classes Fetched', { classes });
    } catch (err) {
        next(err);
    }
}


export const viewClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const _class = await classService.view(classId,);
        sendResponse(res, 200, 'Class fetched', { class: _class });
    } catch (err) {
        next(err);
    }
}


export const updateClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const _class = await classService.update(classId, req.body);
        sendResponse(res, 200, 'Class updated', { class: _class });
    } catch (err) {
        next(err);
    }
}


export const deleteClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: _classId } = req.params;
        const _class = await classService.delete(_classId);
        sendResponse(res, 200, 'Class Deleted', { _class });
    } catch (err) {
        next(err);
    }
}