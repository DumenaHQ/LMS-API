import { Request, Response, NextFunction } from 'express';
import { USER_TYPES } from '../config/constants'; 
import { classSubscriptionService } from '../subscription/classSubscriptionService';
import { ESubscriptionStatus } from '../subscription/model';
import { handleError } from '../helpers/handleError';

export const validateClassSub = async (req: Request, res: Response, next: NextFunction) => {
    const message = 'You currently do not have an active subscription access to this class';
    if (req.user.role === USER_TYPES.learner) {
        const { id: classId } = req.params;
        const { school, id } = req.user;

        const today = new Date();
        const criteria = { user: school, classId, status: ESubscriptionStatus.Active, 'term.end_date': { $gte: today } };
        const classSubs = await classSubscriptionService.listSubs(criteria);
        if (!classSubs || classSubs.length)
            throw new handleError(403, message);

        const subscribedLearnersId = classSubscriptionService.getSubedLearnersForClass(classSubs);

        // check if current learner was paid for
        if (subscribedLearnersId.find((learner: string) => String(learner) === String(id)))
            throw new handleError(403, message);
    }
    next();
};