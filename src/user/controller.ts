import { Request, Response, NextFunction } from 'express';
import { userService } from './service';
import { send as sendResponse } from '../helpers/httpResponse';
import { handleError } from '../helpers/handleError';
import { emailService } from '../helpers/email';
import mongoose from 'mongoose';
import { USER_TYPES } from '../config/constants';
import { activityService } from '../activity/service';
import { EActivityType } from '../activity/enum';


export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userData = req.body;
        const userType = req.user ? req.user : undefined;
        const user = await userService.create(userData, userType);
        if (user.status == 'error') throw new Error(user.message);
        sendResponse(res, 201, 'User Created', { user });
    } catch (err) {
        next(err);
    }
};  

export const onboardAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { admin_role, firstname, lastname, phone, email } = req.body;
        const adminData = {
            fullname: `${lastname} ${firstname}`,
            user_type: 'admin',
            admin_role,
            phone,
            email,
            password: 'dumena',
        };
        const admin = await userService.onboardAdmin(adminData);
        sendResponse(res, 201, 'Admin Onboarded', { user: admin });
    } catch (err) {
        next(err);
    }
};

export const enrollLearner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { user } = req;
        const learnerData = req.body;
        if (user.role === USER_TYPES.school) {
            learnerData[user.role] = user.school_id;
        }
        if (user.role === USER_TYPES.parent) {
            learnerData[user.role] = user.id;
        }
        learnerData.fullname = `${req.body.lastname} ${req.body.firstname}`;
        const learner = await userService.create({ ...learnerData, user_type: 'learner' });

        sendResponse(res, 201, 'Learner Enrolled', { user: learner });

        if (learner && user.role == 'parent') {
            const emailData = {
                email: req.user.email,
                fullname: learnerData.fullname,
                username: learner.username,
                password: req.body.password,
                parent_name: req.user.fullname.split(' ')[0]
            };
            emailService.sendLearnerLoginDetails(emailData);
        }
    } catch (err) {
        next(err);
    }
};


export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const user = await userService.authenticate(email, password);

        activityService.create(req, user.id, EActivityType.LOGIN, {
            'timestamp': new Date(),
        });
        sendResponse(res, 200, 'User Logged in', { user });
    } catch (err) {
        next(err);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        activityService.create(req, req.user.id, EActivityType.LOGOUT, {
            'timestamp': new Date(),
        });
        sendResponse(res, 200, 'User logged out');
    } catch (err) {
        next(err);
    }
};

export const activateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email_hash, hash_string } = req.body;
        const user = await userService.activateAccount(email_hash, hash_string);
        sendResponse(res, 200, 'Account activated', { user });
    } catch (err) {
        next(err);
    }
};


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
};


export const sendPasswordResetEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const  email  = String(req.body.email).toLowerCase();

        const user = await userService.view({ email, status: 'active' });
        if (!user) throw new handleError(400, 'There is no active account associated with this email');

        emailService.sendPasswordResetLink(user);
        sendResponse(res, 200, 'A password reset link has been sent to your email');
    } catch (err) {
        next(err);
    }
};


export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email_hash, hash_string, password } = req.body;
        const { id: user_id } = await userService.verifyPasswordResetLink(email_hash, hash_string);
        await userService.changePassword(password, user_id);
        sendResponse(res, 200, 'Password successfully changed');
    } catch (err) {
        next(err);
    }
};


export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = req.params;
        const user = await userService.view({ _id: userId });
        sendResponse(res, 200, 'User fetched', { user });
    } catch (err) {
        console.log(err);
        next(err);
    }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {role} = req.query;
        const roleCriteria = role ? { role } : {};
        const users = await userService.getAllUsersAndUserType({ deleted: false, ...roleCriteria });
        sendResponse(res, 200, 'User fetched', { users });
    } catch (err) {
        next(err);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId, role: user_type } = req.user;
        const user = await userService.update(String(userId), { ...req.body, user_type });
        sendResponse(res, 200, 'User Updated', { user });
    } catch (err) {
        next(err);
    }
};

export const addSchoolStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { school_id, school } = req.user;
        const { learners } = req.body;
        await userService.addSchoolStudents(String(school_id), learners, String(school));
        //if (resp.status) throw new Error(resp.message)
        sendResponse(res, 200, 'Students Added');
    } catch (err) {
        next(err);
    }
};


export const listSchoolStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { school_id } = req.user;
        const queryParams = req.query;
        const { learners: students, grades } = await userService.listSchoolStudents(String(school_id), queryParams);
        sendResponse(res, 200, 'Students Fetched', { students, grades: [...grades] });
    } catch (err) {
        next(err);
    }
};

export const listSchoolTeachers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { school_id } = req.user;

        // const queryParams = req.query;
        const teachers = await userService.listSchoolTeachers(String(school_id));
        sendResponse(res, 200, 'Teachers Fetched', { teachers });
    } catch (err) {
        next(err);
    }
};

export const removeTeacherFromSchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { teacherUserId } = req.params;
        const { school_id } = req.user;

        const user = await userService.view({
            _id: new mongoose.Types.ObjectId(teacherUserId),
        });

        if (String(user.school_id) !== String(school_id)) {
            throw new handleError(403, 'Forbidden');
        }
        await userService.deleteUser(user.email);

        sendResponse(res, 200, 'Teacher Removed From School');
    } catch (err) {
        next(err);
    }
};


export const getParentChildren = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: parentId } = req.params;
        const learners = await userService.getParentChildren(parentId);
        sendResponse(res, 200, 'Learners fetched', { learners });
    } catch (err) {
        next(err);
    }
};

export const removeChild = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { learnerid } = req.params;
        await userService.removeLearner(learnerid);
        sendResponse(res, 200, 'Learner Removed');
    } catch (err) {
        next(err);
    }
};

export const getUserPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = req.user;
        const payments = await userService.getUserPayments(String(userId));
        sendResponse(res, 200, 'Payments fetched', { payments });
    } catch (err) {
        next(err);
    }
};

export const downloadUserData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { role = 'school' } = req.params;
        const dataFile = await userService.downloadUserData(role);
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-disposition': 'attachment; filename=parents_mailing_list.xlsx',
        });
        res.end(dataFile);
    } catch (err) {
        next(err);
    }
};

export const downloadSchoolStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: schoolId } = req.params;
        const dataFile = await userService.generateSchoolStudentsData(schoolId);
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-disposition': 'attachment; filename=students_list.xlsx',
        });
        res.end(dataFile);
    } catch (err) {
        next(err);
    }
};

export const changeUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: userId } = req.params;
        const path = req.path.split('/')[2];
        const status: Record<string, string> = {
            activate: 'active',
            deactivate: 'inactive'
        };
        await userService.changeUserStatus(userId, status[path]);
        sendResponse(res, 200, 'User status Updated');
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;
        await userService.deleteUser(email);
        sendResponse(res, 200, 'User Deleted');
    } catch (err) {
        next(err);
    }
};

export const schoolsAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const schoolsAnalytics = await userService.schoolsAnalytics();
        sendResponse(res, 200, 'Schools Analytics Fetched', schoolsAnalytics);
    } catch (err) {
        next(err);
    }
};

export const getSchoolSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { school_id } = req.user;
        const settings = await userService.getSchoolSettings(String(school_id));
        sendResponse(res, 200, 'Schools Settings Fetched', { settings });
    } catch (err) {
        next(err);
    }
};

export const updateSchoolSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { school_id } = req.user;
        await userService.updateSchoolSettings(String(school_id), req.body);
        sendResponse(res, 200, 'Schools Settings Updated');
    } catch (err) {
        next(err);
    }
};