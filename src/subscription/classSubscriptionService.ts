import { handleError } from '../helpers/handleError';
import Subscription, { ClassSubscription } from './model';
import { classService } from '../class/service';
import { orderService } from '../order/service';
import { couponService } from '../coupon/service';
import { IOrder } from '../order/model';


export const classSubscriptionService = {
    async createClassSubscriptions(classes: [], userId: string, couponCode: string): Promise<IOrder> {
        const [order, subscription, { coupon, isValidCoupon }] = await Promise.all([
            orderService.createClassOrder(userId),
            Subscription.findOne({ slug: 'class-sub' }),
            couponService.isValidCoupon(couponCode)
        ]);

        if (!subscription)
            throw new handleError(400, 'Invalid subscription');

        let total_amount = 0, orderData: Record<string, unknown> = {};
        for await (const klass of classes) {
            try {
                const { class_id: classId, learners } = klass;
                if (!learners.length) {
                    continue;
                }
                    
                const _class = await classService.findOne({ _id: classId });
                if (!_class) {
                    continue;
                }
                    
                //const activeTerm = classService.getClassActiveTerm(_class.terms);
                // if (activeTerm == null) {
                //     console.log('term')
                //     continue;
                // }
                const classTotalAmount = subscription.amount * learners.length;
                console.log({
                    class: classId,
                    user: userId,
                    subscription: subscription.id,
                    orderId: order._id,
                    learners,
                    total_amount: classTotalAmount,
                    // end_date: activeTerm.end_date
                })
                await ClassSubscription.create({
                    class: classId,
                    user: userId,
                    subscription: subscription.id,
                    orderId: order._id,
                    learners,
                    total_amount: classTotalAmount,
                    //end_date: activeTerm.end_date
                });

                total_amount += classTotalAmount;
            } catch (err) {
                console.log(err)
                // DO TO: handle errors and return to frontend
            }
        }
        if (isValidCoupon && coupon?.discount) {
            total_amount = total_amount - (coupon.discount / 100) * total_amount;
            orderData = { coupon: coupon.id };
        }
        orderData.total_amount = total_amount;
        return orderService.update({ _id: order.id }, orderData);
    },

    async listSubs() {
        return ClassSubscription.find();
    }
}