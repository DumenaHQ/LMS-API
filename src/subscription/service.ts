import mongoose from 'mongoose';
import { handleError } from '../helpers/handleError';
import { IOrder } from '../order/model';
import { Learner } from '../user/models';
import Subscription from './model'

export const subscriptionService = {
    async list() {
        return Subscription.find();
    },


    async grantAccess(order: IOrder) {
        await Promise.all(order.items.map(async item => {
            const { title, user_id, order_type, order_type_id, slug } = item;
            const subscription = await Subscription.findById(order_type_id);

            if (!subscription) {
                // shouldn't throw inside .map
                throw new handleError(500, 'Attempt to grant unknown access');
            }
            const durationByDays = subscription.months * 30;
            let end_date = new Date(Date.now());
            end_date.setDate(end_date.getDate() + durationByDays + 2);

            const contentAccess = {
                title,
                order: order.id,
                access_type: order_type,
                access_type_id: order_type_id,
                slug,
                end_date
            };
            const learner = await Learner.findOne({ user: user_id });
            learner.content_access ? learner.content_access.push(contentAccess) : learner.content_access = [contentAccess];
            await learner.save();
        }));
    }
}