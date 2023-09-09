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
        await classService.addCourses('class', classId, courseIds);
        sendResponse(res, 200, 'Course(s) added to class');
    } catch (err) {
        next(err)
    }
}

export const addTemplateCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: templateId } = req.params;
        const { courses: courseIds } = req.body;
        await classService.addCourses('template', templateId, courseIds);
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


// export const listLearners = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { id: classId } = req.params;
//         const { user: { id, role: userType } } = req;
//         const learners = await classService.fetchLearners(classId, { id, userType });
//         sendResponse(res, 200, 'Learners Fetched', { learners });
//     } catch (err) {
//         next(err)
//     }
// }


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
        const { id, role } = req.user;
        const _class = await classService.viewClass(classId, { id, role });
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

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const classTemplate = await classService.createTemplate(req.body);
        sendResponse(res, 201, 'Class Template Created', { classTemplate });
    } catch (err) {
        next(err);
    }
}

export const listClassTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const classTemplates = await classService.listTemplates({});
        sendResponse(res, 200, 'Class Templates Fetched', { classTemplates });
    } catch (err) {
        next(err);
    }
}

export const viewClassTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: templateId } = req.params;
        const classTemplate = await classService.viewTemplate({ _id: templateId });
        sendResponse(res, 200, 'Class Template fetched', { classTemplate });
    } catch (err) {
        next(err);
    }
}

export const updateClassTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: templateId } = req.params;
        const template = await classService.updateTemplate(templateId, req.body);
        sendResponse(res, 200, 'Class updated', { classTemplate: template });
    } catch (err) {
        next(err);
    }
}