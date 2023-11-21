import { Request, Response, NextFunction } from "express";
import { send as sendResponse } from "../helpers/httpResponse";
import { miscService } from "./miscService";
import { Role, Instructor } from '../user/models';
import Subscription from '../subscription/model';

export const downloadTemplateFile = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name = '' } = req.query;
        const templateFile = miscService.fetchTemplate(name);

        res.download(templateFile);
    } catch (err) {
        next(err);
    }
}

export const seedDatabase = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = [
            {
                role: 'parent',
                permissions: []
            },
            {
                role: 'school',
                permissions: []
            },
            {
                role: 'learner',
                permissions: []
            },
            {
                role: 'instructor',
                permissions: []
            },
            {
                role: 'admin',
                permissions: []
            }
        ];

        const subs = [
            {
                title: 'Standard Plan',
                slug: 'standard-plan',
                amount: 15000,
                months: 1
            },
            {
                title: 'Pro Plan',
                slug: 'pro-plan',
                amount: 9000,
                months: 1
            }
        ];

        const instructor = {
            fullname: 'Dumena Educators',
            email: 'connect@dumena.com'
        };

        await Promise.all([
            Role.insertMany(roles),
            Subscription.insertMany(subs),
            Instructor.create(instructor)
        ]);

        sendResponse(res, 200, 'Database Seeded!');
    } catch (err) {
        next(err);
    }
}