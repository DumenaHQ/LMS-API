import { handleError } from '../helpers/handleError';
import { IOrder } from '../order/model';
import Subscription, { ContentAccess } from './model'

export const subscriptionService = {
    async list() {
        return Subscription.find();
    },


    async grantAccess(order: IOrder) {
        const access = await Promise.all(order.items.map(async item => {
            const { user_id: user, order_type, order_type_id, slug } = item;
            const subscription = await Subscription.findById(order_type_id);

            if (!subscription) {
                throw new handleError(500, 'Attempt to grant unknown access');
            }
            const durationByDays = subscription.months * 30;
            let end_date = new Date(Date.now());
            end_date.setDate(end_date.getDate() + durationByDays + 2);

            return {
                order: order.id,
                user,
                access_type: order_type,
                access_type_id: order_type_id,
                slug,
                end_date: new Date(end_date)
            };
        }));
        await ContentAccess.insertMany(access);
    }
}