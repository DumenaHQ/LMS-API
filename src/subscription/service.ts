import { handleError } from '../helpers/handleError';
import { IOrder, EOrderStatus } from '../order/model';
import Subscription, { UserSubscription } from './model';
import { classService } from '../class/service';
import { ORDER_TYPES } from '../config/constants';
import { programService } from '../program/service';
import { classSubscriptionService } from './classSubscriptionService';

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

    async view(criteria: object) {
        const subscription = await this.findOne(criteria);
        if (!subscription)
            throw new handleError(404, 'Subscription not found');

        return subscription;
    },

    async list() {
        return Subscription.find();
    },

    async grantAccess(order: IOrder) {
        switch (order.item_type) {
            case ORDER_TYPES.class:
                await this.addLearnersToClass(order);
                break;
            case ORDER_TYPES.program:
                await this.addLearnersToProgram(order);
                break;
            case ORDER_TYPES.class_sub:
                await this.updateClassSubscription(order);
                break;
            default:
        }
    },

    async addLearnersToClass(order: IOrder) {
        const items = order.items;
        const learnerIds: any = [];
        items?.map(async (item: any) => {
            const { meta_data: { classId }, user_id } = item;
            learnerIds.push({ user_id });
            return classService.addLearners(classId, learnerIds);
        });
    },

    async subLearnersToClass(order: IOrder) {
        const items = order.items;
        const learnerIds: any = [];
        items?.map(async (item: any) => {
            const { meta_data: { classId }, user_id } = item;
            learnerIds.push({ user_id });
            return classService.addLearners(classId, learnerIds);
        });
    },


    async addLearnersToProgram(order: IOrder) {
        const { items, user: sponsorId } = order;
        const learnerIds: any = [];
        items?.map(async (item: any) => {
            const { meta_data: { classId }, user_id } = item;
            learnerIds.push({ user_id });
            return programService.addLearners(classId, learnerIds, sponsorId);
        });
    },

    async updateClassSubscription(order: IOrder) {
        if (order.status !== EOrderStatus.Confirmed)
            throw new handleError(400, 'Error processing order');

        return classSubscriptionService.activateSubs(String(order.id));
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