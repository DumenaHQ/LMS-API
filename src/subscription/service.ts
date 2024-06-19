import { handleError } from '../helpers/handleError';
import { IOrder } from '../order/model';
import { Learner, School } from '../user/models';
import Subscription, { SchoolSubscription } from './model';
import { classService } from '../class/service';
import { ORDER_ITEMS } from '../config/constants';

export const subscriptionService = {
    async create(data: {
        title: string;
        slug: string;
        amount: number;
    }) {
        return Subscription.create(data);
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

    async migrateSchoolToSubscription(school_id: string, subscription_id: string) {
        const school = await School.findById(school_id);
        if (!school) {
            throw new handleError(400, 'School not found');
        }

        const subscription = await Subscription.findById(subscription_id);
        if (!subscription) {
            throw new handleError(400, 'Subscription not found');
        }

        const schoolSubscription = await SchoolSubscription.create({
            school: school.id,
            subscription: subscription.id
        });
        return schoolSubscription;
    }
};