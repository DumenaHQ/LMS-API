/* eslint-disable @typescript-eslint/no-unused-vars */
import Order, { IOrder, EOrderStatus } from './model';
import Coupon from '../coupon/model';
import Subscription, {SchoolSubscription }from '../subscription/model';
import { generateId } from '../helpers/utility';
import {School} from '../user/models';

export const orderService = {
    async create({ items, ...orderData }: IOrder) {
        // ge the user school profile
        const school = await School.findOne({user: orderData.user});
        if (!school) {
            throw new Error('User is not a school');
        }

        let totalAmountToPay = 0;
        // Check if current school has any subscription attached to thier profile, that is active, only one subscription is allowed to be active per school
        const schoolSubscription = await SchoolSubscription.findOne({school: school._id, status: 'active'});
        if (!schoolSubscription) {
            throw new Error('Please Subscribe to a plan');
        }
        const subscription = await Subscription.findById(schoolSubscription.subscription);   
        if (!subscription) {
            throw new Error('Invalid Subscription In Profile');
        }

        // We use the subscription to calculate the amount each learner user will pay
        const orderItems = await Promise.all(items.map(async item => {
            totalAmountToPay += subscription.amount;
            const {amount, ...itemData} = item;
            return {
                ...itemData,
                amount: subscription.amount
            };
        }));

        // We check if the school has any coupon attached on their subscription, and apply the coupon if it is valid
        let appliedCoupon = false;
        if (schoolSubscription.coupon){
            const coupon = await Coupon.findById(schoolSubscription.coupon);
            if (coupon && coupon.expiry_date && coupon.expiry_date > new Date() && coupon.status === 'active' && coupon.disount) {
                totalAmountToPay = totalAmountToPay - coupon.disount;
                appliedCoupon = true;
            }
        }

        return Order.create({
            reference: generateId('ORD_'),
            items: orderItems,
            user: orderData.user,
            total_amount: totalAmountToPay,
            status: EOrderStatus.Pending,
            learner: orderData.learner,
            coupon: appliedCoupon ? schoolSubscription.coupon : undefined
        });
    },

    async view(criteria: object): Promise<IOrder | null> {
        return Order.findOne(criteria);
    },

    async list(criteria: object): Promise<IOrder[]> {
        return Order.find(criteria);
    },

    async update(criteria: object, data: object) {
        return Order.findOneAndUpdate(criteria, data, { new: true });
    }

};