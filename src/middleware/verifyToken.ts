import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.sendStatus(401); // Unauthorized

        verify(token, process.env.JWT_SECRET, (err: any, payload: any) => {
            if (err) {
                return res.sendStatus(403); // forbidden
            }
            req.user = payload;
            next();
        });
    } catch (err) {
        next(err);
    }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.sendStatus(403);
    }
}

export const isSchool = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'school') {
        next();
    } else {
        return res.sendStatus(403);
    }
}

export const isParent = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'parent') {
        next();
    } else {
        return res.sendStatus(403);
    }
}

export const isLearner = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'learner') {
        next();
    } else {
        return res.sendStatus(403);
    }
}