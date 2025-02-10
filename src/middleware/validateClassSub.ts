import { Request, Response, NextFunction } from 'express';
import { USER_TYPES } from '../config/constants';
import { classSubscriptionService } from '../subscription/classSubscriptionService';
import { ESubscriptionStatus } from '../subscription/model';
import { classService } from '../class/service';

export const validateClassSub = async (req: Request, res: Response, next: NextFunction) => {
    // const message = 'You currently do not have an active subscription access to this class';
    if (req.user.role == USER_TYPES.learner) {
        const { id: classId } = req.params;
        const { school, id } = req.user;

        const classroom = await classService.findOne({ _id: classId }, false);
        if (!classroom) {
            next('Invalid class');
            return;
        }
        const activeTerm = classService.findActiveTerm(classroom.terms);

        // check if grace period of 3 weeks is not over
        // const gracePeriod = activeTerm?.start_date ? findGracePeriod(activeTerm.start_date) : null;
        // if (gracePeriod === null) {
        //     next('Invalid term');
        //     return;
        // } else {
        //     const grace_period = new Date(gracePeriod);
        //     const today = new Date();
        //     if (today <= grace_period) {
        //         next();
        //         return;
        //     }
        // }


        // TODO: add session
        const today = new Date();
        const criteria = {
            user: school,
            class: classId,
            term: activeTerm?.title,
            status: ESubscriptionStatus.Active,
            expiry_date: { $gte: today }
        };
        const classSubs = await classSubscriptionService.listSubs(criteria);
        if (!classSubs || !classSubs.length) {
            req.user.subStatus = 'inactive';
            next();
            return;
        }

        const subscribedLearnersId = classSubscriptionService.getSubedLearnersForClass(classSubs);
        // check if current learner was paid for
        if (!subscribedLearnersId.find((learner: string) => String(learner) === String(id))) {
            req.user.subStatus = 'inactive';
            next();
            return;
        }
    }
    next();
};

function findGracePeriod(start_date: Date | string) {
    const startDate = new Date(start_date);
    const gracePeriod = new Date(startDate);
    gracePeriod.setDate(gracePeriod.getDate() + 21);
    //return gracePeriod;
    return new Date('2025-01-31');
}