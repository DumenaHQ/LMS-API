import { Request, Response, NextFunction } from "express";
import { userService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";
import { handleError } from "../helpers/handleError";
import { emailService } from "../helpers/email";


export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.create(req.body);
        sendResponse(res, 201, 'User Created', { user });
    } catch (err) {
        next(err);
    }
}


export const enrollLearner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: parent } = req.user;
        const fullname = `${req.body.lastname} ${req.body.firstname}`;
        const user = await userService.create({ ...req.body, parent, fullname, user_type: 'learner' });

        sendResponse(res, 201, 'Learner Enrolled', { user });

        const emailData = {
            email: req.user.email,
            fullname,
            username: user.username,
            password: req.body.password,
            parent_name: req.user.fullname.split(' ')[0]
        };
        emailService.sendLearnerLoginDetails(emailData);
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


export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const user = await userService.view({ email, status: 'inactive' });
        if (!user) throw new handleError(404, 'Inactive account not found');

        emailService.sendVerificationEmail(user);
        sendResponse(res, 200, 'Verification email sent');
    } catch (err) {
        next(err);
    }
}


export const sendPasswordResetEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const user = await userService.view({ email, status: 'active' });
        if (!user) throw new handleError(400, 'There is no active account associated with this email');

        emailService.sendPasswordResetLink(user);
        sendResponse(res, 200, 'A password reset link has been sent to your email');
    } catch (err) {
        next(err);
    }
}


export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email_hash, hash_string, password } = req.body;
        const { id: user_id } = await userService.verifyPasswordResetLink(email_hash, hash_string);
        await userService.changePassword(password, user_id);
        sendResponse(res, 200, 'Password successfully changed');
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
        const { id: userId, role } = req.user;
        const user = await userService.update(userId, { ...req.body, role });
        sendResponse(res, 200, 'User Updated', { user });
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

export const removeChild = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { learnerid } = req.params;
        await userService.removeLearner(learnerid);
        sendResponse(res, 200, 'Learner Removed');
    } catch (err) {
        next(err);
    }
}

export const getUserPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = req.user;
        const payments = await userService.getUserPayments(userId);
        sendResponse(res, 200, 'Payments fetched', { payments });
    } catch (err) {
        next(err);
    }
}

export const downloadUserData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dataFile = await userService.downloadUserData('parent');
        res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-disposition": "attachment; filename=parents_mailing_list.xlsx",
        })
        res.end(dataFile);
    } catch (err) {
        next(err);
    }
}