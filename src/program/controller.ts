import { Request, Response, NextFunction } from "express";
import { programService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";

export const createProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const program = await programService.create(req.body);
        sendResponse(res, 201, 'Program created', { program });
    } catch (err) {
        next(err);
    }
}


export const addSchools = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const { schools } = req.body;
        await programService.addSponsors(programId, schools.map((schl: object) => ({ ...schl, type: 'school' })));
        sendResponse(res, 200, 'School(s) added to program');
    } catch (err) {
        next(err);
    }
}


export const listSchools = async (req: Request, res: Response, next: NextFunction) => {
    try {

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

    } catch (err) {
        next(err)
    }
}


export const listPrograms = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const programs = await programService.list({});
        sendResponse(res, 200, 'Programs fetched', { programs });
    } catch (err) {
        next(err);
    }
}


export const viewProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const program = await programService.view(programId);
        sendResponse(res, 200, 'Program fetched', { program });
    } catch (err) {
        next(err);
    }
}


export const updateProgram = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: programId } = req.params;
        const program = await programService.update(programId, req.body);
        sendResponse(res, 200, 'Program updated', { program });
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