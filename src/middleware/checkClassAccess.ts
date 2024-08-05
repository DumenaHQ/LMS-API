import { Request, Response, NextFunction } from 'express';
import { classService } from '../class/service';
import { USER_TYPES } from '../config/constants';
import { handleError } from '../helpers/handleError';


export const checkClassAccess = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Please lets leave this comment, its important so that when we look upon it later in the future we will understand why we are doing it this way
    // Because of the code that runs immediately an order is verified, the code ensures learner(s) are/is added to class immediately after payment is verified
    // So therefore all i need to do is check if learner is in class already, which is done by default in viewClass

    try {
    // Get Class Id
        const { id: classId } = req.params;
        // Get User Id And Role
        const { role, id } = req.user;
        const roleUserId = role === USER_TYPES.school ? req.user['school_id'] : id;
        try {
            const _class = await classService.viewClass(classId, { roleUserId, role });
            if (!_class) {
                throw new handleError(400, 'Access Denied');
            }
        } catch (error) {
            throw new handleError(400, 'Access Denied');
        }

        next();
    } catch (err) {
        next(err);
    }
};
