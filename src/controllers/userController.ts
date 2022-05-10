import { Request, Response, NextFunction } from "express";
import { create, authenticate } from '../services/userService';
import { send as sendResponse } from "../helpers/httpResponse";


export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await create(req.body);
        sendResponse(res, 201, 'User Created', { user });
    } catch (err) {
        next(err);
    }
}


export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const user = await authenticate(email, password);
        sendResponse(res, 200, 'User Logged in', { user });
    } catch (err) {
        next(err);
    }
}