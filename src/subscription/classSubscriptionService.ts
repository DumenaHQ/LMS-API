import { handleError } from '../helpers/handleError';
import Subscription, { ClassSubscription } from './model';
import { classService } from '../class/service';
import { orderService } from '../order/service';
import { couponService } from '../coupon/service';
import { IOrder } from '../order/model';
import { userService } from '../user/service';


export const classSubscriptionService = {
    async createClassSubscriptions(classes: [], userId: string, couponCode: string): Promise<IOrder | null> {
        const [order, subscription, { coupon, isValidCoupon }] = await Promise.all([
            orderService.createClassOrder(userId),
            Subscription.findOne({ slug: 'class-sub' }),
            couponService.isValidCoupon(couponCode)
        ]);

        if (!subscription)
            throw new handleError(400, 'Invalid subscription');

        let total_amount = 0, orderData: Record<string, unknown> = {};
        for await (const klass of classes) {
            let numOfLearners, selectedLearners: any;
            try {
                const { class_id: classId, learners } = klass;
                selectedLearners = learners;
                const _class = await classService.findOne({ _id: classId });
                if (!_class) {
                    continue;
                }

                // if learners were not selected, sub all learners in the class
                if (!selectedLearners) {
                    const learners = await userService.list({
                        'user._id': { $in: _class.learners.map(learner => learner.user_id) },
                        'user.deleted': false
                    }, 'learner');

                    selectedLearners = learners.map(learner => learner.id);
                }

                if (!selectedLearners.length) continue;
                numOfLearners = selectedLearners.length;
                    
                const activeTerm = classService.getClassActiveTerm(_class.terms);
                if (activeTerm == null) {
                    // log this
                    continue;
                }
                const subAmount = this.calculateClassSubAmount(numOfLearners);
                const classTotalAmount = subAmount * numOfLearners;
                
                // TODO: add session
                await ClassSubscription.create({
                    class: classId,
                    term: activeTerm.title,
                    user: userId,
                    subscription: subscription.id,
                    orderId: order._id,
                    learners: selectedLearners,
                    total_amount: classTotalAmount,
                    expiry_date: activeTerm.end_date
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

    async findOne(criteria: object) {
        return ClassSubscription.findOne(criteria);
    },


    calculateClassSubAmount(numOfLearners: number) {
        // 1-50 = N10,000
        // 51-100 = N8,000
        // 101-200 = N7,500
        // 201-500 = N7,000
        // >500 = N6,000
        let subAmount = 0;
        // if (numOfLearners < 101)
        //     subAmount = 10000;
        // else if (numOfLearners > 100 && numOfLearners < 201)
        //     subAmount = 9500;
        // else if (numOfLearners > 200 && numOfLearners < 301)
        //     subAmount = 9000;
        // else if (numOfLearners > 300 && numOfLearners < 401)
        //     subAmount = 8500;
        // else if (numOfLearners > 400 && numOfLearners < 501)
        //     subAmount = 8000
        // else 
        //     subAmount = 7500;
        if (numOfLearners < 50)
            subAmount = 10000;
        else if (numOfLearners > 50 && numOfLearners < 101)
            subAmount = 8000;
        else if (numOfLearners > 100 && numOfLearners < 201)
            subAmount = 7500;
        else if (numOfLearners > 200 && numOfLearners < 501)
            subAmount = 7000;
        else if (numOfLearners > 500)
            subAmount = 6000
        else 
            subAmount = 7500;

        return subAmount;
    },

    async listSubs(criteria: object) {
        return ClassSubscription.find(criteria).sort({ createdAt: 'desc' });
    },

    async activateSubs(orderId: string) {
        return ClassSubscription.updateMany({ orderId }, { status: 'active' });
    },

    /** 
     * Merge learners from different sub entries with same class id
     */
    getSubedLearnersForClass(activeClassSubs: any) {
        return activeClassSubs.reduce((learners: any, sub: any) => {
            return [...learners, ...sub.learners];
        }, []);
    }
}