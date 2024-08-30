/* eslint-disable @typescript-eslint/no-unused-vars */
import Order, { IOrder, EOrderStatus } from './model';
import Coupon from '../coupon/model';
import Subscription, { UserSubscription }from '../subscription/model';
import { generateId } from '../helpers/utility';
import {School} from '../user/models';
import { USER_TYPES } from '../config/constants';
import { handleError } from '../helpers/handleError';
import { couponService } from '../coupon/service';

export const orderService = {
    async create({ items, ...orderData }: IOrder, userRole: string) {

        let totalAmountToPay = 0;
        let appliedCoupon = false;
        let coupon: any = null;
        let subscription: any = null;
        if (userRole == USER_TYPES.school) {

            // Check if current user has any subscription attached to thier profile, that is active, only one subscription is allowed to be active per school
            const userSubscription = await UserSubscription.findOne({user: orderData.user, status: 'active'});
            if (!userSubscription) {
                throw new handleError(400,'Please Subscribe to a plan');
            }
            subscription = await Subscription.findById(userSubscription.subscription);
            if (!subscription) {
                throw new handleError(400,'Invalid Subscription In Profile');
            }
            // We check if the user has any coupon attached on their subscription, and apply the coupon if it is valid
            coupon = userSubscription.coupon ? await Coupon.findById(userSubscription.coupon): null;
        }else{
            // Use the default parent plan
            subscription = await Subscription.findOne({slug: 'parent-plan'});
            if (!subscription) {
                throw new handleError(500,'Internal server error, Parent Subscription Not Found');
            }
        }

        // We use the subscription to calculate the amount each learner user will pay
        const orderItems = await Promise.all(items.map(async item => {

            let userAmount = subscription.amount;
            // Apply Coupon if it is valid
            if (couponService.isValidCoupon(coupon)) {
                userAmount = userAmount - (coupon.disount / 100) * userAmount;
                appliedCoupon = true;
            }
            totalAmountToPay += userAmount;
            const {amount,slug, ...itemData} = item;
            return {
                ...itemData,
                slug: subscription.slug,
                amount: userAmount
            };
        }));

        return Order.create({
            reference: generateId('ORD_'),
            items: orderItems,
            user: orderData.user,
            total_amount: totalAmountToPay,
            status: EOrderStatus.Pending,
            coupon: appliedCoupon && coupon ? coupon.id : undefined
        });
    },

    async createClassOrder({ items, couponCode, ...orderData }: IOrder, userRole: string) {
        let amount;
        const subscription = await Subscription.findOne({ slug: 'class-sub' });
        amount = subscription.amount;

        const { coupon, isValidCoupon } = await couponService.isValidCoupon(couponCode);
        if (isValidCoupon && coupon?.discount) {
            amount = amount - (coupon.discount / 100) * amount;
        }
        
        return Order.create({
            reference: generateId('ORD_'),
            items: orderItems,
            user: orderData.user,
            total_amount: amount * items.length,
            status: EOrderStatus.Pending,
            coupon: isValidCoupon ? coupon.id : undefined
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

    async update(criteria: object, data: object) {
        return Order.findOneAndUpdate(criteria, data, { new: true });
    }
};