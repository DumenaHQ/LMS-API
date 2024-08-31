/* eslint-disable @typescript-eslint/no-unused-vars */
import Order, { IOrder, EOrderStatus } from './model';
import Coupon from '../coupon/model';
import Subscription, { UserSubscription }from '../subscription/model';
import { generateId } from '../helpers/utility';
import {School} from '../user/models';
import { USER_TYPES, ORDER_TYPES } from '../config/constants';
import { handleError } from '../helpers/handleError';
import { couponService } from '../coupon/service';
import { subscriptionService } from '../subscription/service';
import { classSubscriptionService } from '../subscription/classSubscriptionService';

export const orderService = {
    async createClassOrder(schoolId: string) {        
        return Order.create({
            item_type: ORDER_TYPES.class_sub,
            reference: generateId('ORD_'),
            user: schoolId,
            status: EOrderStatus.Pending,
        });
    },

    async createProgramOrder(userId: string, orderItems: Record<string, unknown>[], totalAmount: number) {
        return Order.create({
            reference: generateId('ORD_'),
            items: orderItems,
            user: userId,
            total_amount: totalAmount,
            status: EOrderStatus.Pending
        });
    },

    async view(criteria: object): Promise<IOrder | null> {
        return Order.findOne(criteria);
    },

    async list(criteria: object): Promise<IOrder[]> {
        return Order.find(criteria);
    },

    async update(criteria: object, data: object): Promise<IOrder | null> {
        return Order.findOneAndUpdate(criteria, data, { new: true });
    }
};