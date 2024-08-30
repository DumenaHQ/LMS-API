import { handleError } from '../helpers/handleError';
import { generateId } from '../helpers/utility';
import Subscription, { ClassSubscription } from './model';
import { classService } from '../class/service';


export const classSubscriptionService = {
    async create(classId: string, schoolId: string, learners: string[]) {
        const [klass, subscription] = await Promise.all([
            classService.findOne(classId),
            Subscription.findOne({ slug: 'class-sub' })
        ]);
        if (!klass) {
            throw new handleError(400, 'Invalid class ID provided');
        }
        if (!subscription) {
            throw new handleError(400, 'Invalid subscription plan');
        }
        const total_amount = subscription.amount * learners.length;
        
        return ClassSubscription.create({
            class: classId,
            school: schoolId,
            subscription: subscription.id,
            reference: generateId('SUB_'),
            learners,
            total_amount
        });
    }
}