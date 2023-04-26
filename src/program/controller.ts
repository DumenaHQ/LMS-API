import { Request, Response, NextFunction } from "express";
import { programService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";
import { USER_TYPES } from "../config/constants";
import { School } from "../user/models";

export const createProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const program = await programService.saveProgram(req.body, req.files);
        sendResponse(res, 201, 'Program created', { program });
    } catch (err) {
        next(err);
    }
}


export const addSchools = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const { schools } = req.body;
        await programService.addSponsors(programId, schools.map((schl: object) => ({ ...schl, sponsor_type: 'school' })));
        sendResponse(res, 200, 'School(s) added to program');
    } catch (err) {
        next(err);
    }
}


export const addParents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const { parents } = req.body;
        await programService.addSponsors(programId, parents.map((_parents: object) => ({ ..._parents, sponsor_type: 'parent' })));
        sendResponse(res, 200, 'Parent(s) added to program');
    } catch (err) {
        next(err);
    }
}


export const listSchools = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const schools = await programService.listEnrolledSchools(programId);
        sendResponse(res, 200, 'Program schools fetched', { schools });
    } catch (err) {
        next(err)
    }
}


export const addCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const { courses: courseIds } = req.body;
        await programService.addCourses(programId, courseIds);
        sendResponse(res, 200, 'Course(s) added to program');
    } catch (err) {
        next(err)
    }
}


export const listCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const courses = await programService.listCourses(programId);
        sendResponse(res, 200, 'Program Courses Fetched', { program_id: programId, courses });
    } catch (err) {
        next(err)
    }
}


export const addLearners = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const { role } = req.user;

        // fix asap!
        let sponsorId = req.user.id;
        if (role == USER_TYPES.school) {
            const school = await School.findOne({ user: req.user.id });
            sponsorId = school._id;
        }
        const { learners } = req.body;
        await programService.addLearners(programId, learners, sponsorId);
        sendResponse(res, 200, 'Learners Added');
    } catch (err) {
        next(err)
    }
}


export const listLearners = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const { user: { id: userId, role: userType } } = req;
        const learners = await programService.fetchLearnerDetails(programId, userType, userId);
        sendResponse(res, 200, 'Learners Fetched', { learners });
    } catch (err) {
        next(err)
    }
}


export const listPrograms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, role } = req.user;
        const programs = await programService.listProgramsForRoles(id, role);
        sendResponse(res, 200, 'Programs fetched', { programs });
    } catch (err) {
        next(err);
    }
}


export const viewProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const { role, id } = req.user;
        let user = { role, id };
        // fix asap!
        if (role == USER_TYPES.school) {
            const school = await School.findOne({ user: req.user.id });
            user.id = school ? school._id : id;
        }
        const program = await programService.view(programId, user);
        sendResponse(res, 200, 'Program fetched', { program });
    } catch (err) {
        next(err);
    }
}


export const updateProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await programService.saveProgram({ ...req.body, id }, req.files);
        sendResponse(res, 200, 'Program updated');
    } catch (err) {
        next(err);
    }
}


export const deleteProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const program = await programService.delete(programId);
        sendResponse(res, 200, 'Program Deleted', { program });
    } catch (err) {
        next(err);
    }
}