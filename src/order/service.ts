import Order, { IOrder, EOrderStatus } from './model';
import Subscription from '../subscription/model';
import { generateId } from '../helpers/utility';

export const orderService = {
    async create({ items, ...orderData }: IOrder): Promise<IOrder> {
        // get order item details
        let total_amount = 0;
        const orderItems = await Promise.all(items.map(async item => {
            const orderDetails = await Subscription.findOne({ $or: [{ item_id: item.order_type_id }, { slug: item.slug }] });
            total_amount += orderDetails.amount;
            return {
                ...item,
                title: orderDetails.title,
                amount: orderDetails.amount,
                order_type_id: orderDetails.item_id,
                slug: orderDetails.slug
            };
        }));

        Order.findOneAndUpdate({ user: orderData.user, status: EOrderStatus.Active }, { status: EOrderStatus.Pending });

        return Order.create({
            ...orderData,
            total_amount,
            reference: generateId('ORD_'),
            items: orderItems
        });
    },

    async view(criteria: object): Promise<IOrder | null> {
        return Order.findOne(criteria);
    },

    async list(criteria: object): Promise<IOrder[]> {
        return Order.find(criteria);
    },

    async update(orderId: string, orderStatus: object) {

    }
}