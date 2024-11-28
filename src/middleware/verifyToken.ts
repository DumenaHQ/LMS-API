import { JwtPayload, verify } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { userService } from '../user/service';

const JwtSecret = process.env.JWT_SECRET;
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.sendStatus(401); // Unauthorized
        
        try{
            const payload = verify(token, String(JwtSecret)) as JwtPayload;
            req.user = await userService.view({ _id: payload.id });
            next();
        } catch (err){
            next(err);
        }


    } catch (err) {
        next(err);
        // return res.sendStatus(401);

    }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.sendStatus(403);
    }
};

export const isSchool = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'school') {
        next();
    } else {
        return res.sendStatus(403);
    }
};

export const isSchoolOrAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && (req.user.role === 'school' || req.user.role === 'admin')) {
        next();
    } else {
        return res.sendStatus(403);
    }
};

export const isParent = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'parent') {
        next();
    } else {
        return res.sendStatus(403);
    }
};

export const isLearner = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'learner') {
        next();
    } else {
        return res.sendStatus(403);
    }
};

export const authorizeAdminRoles = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const admin = await userService.view({ _id: req.user.id });
        if (admin && roles.includes(admin.admin_role)) {
            next();
        } else {
            return res.sendStatus(403); // Forbidden
        }
    };
};