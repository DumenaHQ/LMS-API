import { Request, Response, NextFunction } from 'express';
import { classService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';
import { USER_TYPES } from '../config/constants';


export const createClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, role, school_id } = req.user;
        if (role == USER_TYPES.school) req.body.school_id = school_id;
        else if (role == USER_TYPES.parent) req.body.parent_id = id;
        const _class = await classService.create({ ...req.body }, req.files);
        sendResponse(res, 201, 'Class created', { class: _class });
    } catch (err) {
        next(err);
    }
};

export const addCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const { courses: courseIds } = req.body;
        await classService.addCourses('class', classId, courseIds);
        sendResponse(res, 200, 'Course(s) added to class');
    } catch (err) {
        next(err);
    }
};

export const addTemplateCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: templateId } = req.params;
        const { courses: courseIds } = req.body;
        await classService.addCourses('template', templateId, courseIds);
        sendResponse(res, 200, 'Course(s) added to class');
    } catch (err) {
        next(err);
    }
};

export const addCoursesAcrossTemplateTerms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: templateId } = req.params;
        const { term_courses } = req.body;
        await classService.addCoursesAcrossClassTemplateTerms(templateId, term_courses);
        sendResponse(res, 200, 'Courses added to class template terms');
    } catch (err) {
        next(err);
    }
};

export const removeTemplateCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: templateId, courseId } = req.params;
        await classService.removeCourse('template', templateId, courseId);
        sendResponse(res, 200, 'Course removed from class template');
    } catch (err) {
        next(err);
    }
}


export const listCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const courses = await classService.listCourses(classId);
        sendResponse(res, 200, 'Class Courses Fetched', { courses });
    } catch (err) {
        next(err);
    }
};


export const addLearners = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const { learners } = req.body;
        await classService.addLearners(classId, learners);
        sendResponse(res, 200, 'Learners Added');
    } catch (err) {
        next(err);
    }
};


export const listLearners = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { school_id: userId } = req.user;
        const { id: classId } = req.params;
        const { payment_status } = req.query;

        const learners = await classService.listLearners(classId, String(userId), String(payment_status) as 'paid' | 'unpaid');
        sendResponse(res, 200, 'Class Learners Fetched', { learners });
    } catch (err) {
        next(err);
    }
};


export const removeTeacherFromClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        await classService.removeTeacherFromClass(classId);
        sendResponse(res, 200, 'Teacher Removed');
    } catch (err) {
        next(err);
    }
};


export const listClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role, id } = req.user;
        const { filter } = req.query;
        const roleUserId = role === USER_TYPES.school ? req.user[`school_id`] : id;
        const classes = await classService.listClassesForRoles(String(roleUserId), role, String(filter));
        sendResponse(res, 200, 'Classes Fetched', { classes });
    } catch (err) {
        next(err);
    }
};


export const viewClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const { role, id, subStatus = null } = req.user;
        const roleUserId = role === USER_TYPES.school ? String(req.user[`school_id`]) : String(id);
        const _class = await classService.viewClass(classId, { roleUserId, role }, subStatus);
        if (subStatus === 'inactive')
            return sendResponse(res, 206, 'You currently do not have an active subscription access to this class', { class: _class });
        sendResponse(res, 200, 'Class fetched', { class: _class });
    } catch (err) {
        next(err);
    }
};

// export const viewRedactedClass = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const message = 'You currently do not have an active subscription access to this class';
//         console.log({ message })
//         console.log(req.params)
//         const { id: classId } = req.params;
//         const _class = await classService.viewLimitedClass(classId);
//         sendResponse(res, 206, message, { class: _class });
//     } catch (err) {
//         next(err);
//     }
// };

export const viewClassCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId, courseId } = req.params;
        const course = await classService.fetchClassCourse(classId, courseId);
        sendResponse(res, 200, 'Class Course fetched', { course });
    } catch (err) {
        next(err);
    }
};


export const updateClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId } = req.params;
        const _class = await classService.update(classId, req.body, req.files);
        sendResponse(res, 200, 'Class updated', { _class });
    } catch (err) {
        next(err);
    }
};


export const deleteClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: _classId } = req.params;
        const _class = await classService.delete(_classId);
        sendResponse(res, 200, 'Class Deleted', { _class });
    } catch (err) {
        next(err);
    }
};

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const classTemplate = await classService.createTemplate(req.body);
        sendResponse(res, 201, 'Class Template Created', { classTemplate });
    } catch (err) {
        next(err);
    }
};

export const listClassTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const classTemplates = await classService.listTemplates({});
        sendResponse(res, 200, 'Class Templates Fetched', { classTemplates });
    } catch (err) {
        next(err);
    }
};

export const viewClassTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: templateId } = req.params;
        const classTemplate = await classService.viewTemplate({ _id: templateId });
        sendResponse(res, 200, 'Class Template fetched', { classTemplate });
    } catch (err) {
        next(err);
    }
};

export const updateClassTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: templateId } = req.params;
        const template = await classService.updateTemplate(templateId, req.body);
        sendResponse(res, 200, 'Class updated', { classTemplate: template });
    } catch (err) {
        next(err);
    }
};

export const getClassQuizResults = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: classId, quizId } = req.params;
        const quizResult = await classService.getClassQuizResults(classId, quizId);
        sendResponse(res, 200, 'Quiz Result fetched', { quizResult });
    } catch (err) {
        next(err);
    }
};