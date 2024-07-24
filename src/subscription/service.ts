import { handleError } from '../helpers/handleError';
import { IOrder } from '../order/model';
import { Learner, School } from '../user/models';
import Subscription, { UserSubscription } from './model';
import { classService } from '../class/service';
import { ORDER_ITEMS } from '../config/constants';

export const subscriptionService = {
    async create(data: {
        title: string;
        slug: string;
        amount: number;
    }) {

        const slug = data.slug; // this ensures the slug is unique and readable
        return Subscription.create({
            ...data,
            slug
        });
    },

    async findOne(criteria: object) {
        return Subscription.findOne(criteria);
    },

    async list() {
        return Subscription.find();
    },

    async grantAccess(order: IOrder) {
        switch (order.item_type) {
        case ORDER_ITEMS.sub:
            await Promise.all(order.items.map(async item => {
                const { title, user_id, order_type, order_type_id, slug } = item;
                const subscription = await Subscription.findById(order_type_id);

                if (!subscription) {
                    // shouldn't throw inside .map
                    throw new handleError(500, 'Attempt to grant unknown access');
                }
                const durationByDays = subscription.months * 30;
                const end_date = new Date(Date.now());
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
            break;
        case ORDER_ITEMS.class:
            await this.addLearnersToClass(order);
            break;
        default:
        }
    },

    async addLearnersToClass(order: IOrder) {
        const items = order.items;
        const learnerIds: any = [];
        items.map(async (item: any) => {
            const { meta_data: { classId }, user_id } = item;
            learnerIds.push({ user_id });
            await classService.addLearners(classId, learnerIds);
        });
    },

    async migrateSchoolToSubscription(user_id: string, subscription_id: string) {
        return UserSubscription.create({
            user: user_id,
            status: 'active',
            subscription: subscription_id
        });
    },
    
    async updateSchoolSubscription(userSubscriptionId: string, data={}) {
        return UserSubscription.findByIdAndUpdate(userSubscriptionId, data);
    }

};