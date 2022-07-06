import { Request, Response, NextFunction } from "express";
import { userService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";


export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.create(req.body);
        sendResponse(res, 201, 'User Created', { user });
    } catch (err) {
        next(err);
    }
}


export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const user = await userService.authenticate(email, password);
        sendResponse(res, 200, 'User Logged in', { user });
    } catch (err) {
        next(err);
    }
}

export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email_hash, hash_string } = req.body;
        const user = await userService.activateAccount(email_hash, hash_string);
        sendResponse(res, 200, 'Account activated', { user });
    } catch (err) {
        next(err);
    }
}

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = req.params;
        const user = await userService.view({ _id: userId });
        sendResponse(res, 200, 'User fetched', { user });
    } catch (err) {
        next(err);
    }
}

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.list({});
        sendResponse(res, 200, 'User fetched', { users });
    } catch (err) {
        next(err);
    }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = req.params;
        const user = await userService.update({ _id: userId }, req.body);
        sendResponse(res, 200, 'User fetched', { user });
    } catch (err) {
        next(err);
    }
}

export const getParentChildren = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: parentId } = req.params;
        const learners = await userService.getParentChildren(parentId);
        sendResponse(res, 200, 'Learners fetched', { learners });
    } catch (err) {
        next(err);
    }
}