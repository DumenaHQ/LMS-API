import Order, { IOrder } from './model';
import Subscription from '../subscription/model';
import { generateId } from '../helpers/utility';
import { handleError } from '../helpers/handleError';

export const orderService = {
    async save(orderData: IOrder): Promise<IOrder> {
        // get order details
        const orderDetails = await Subscription.findOne({ $or: [{ _id: orderData.order_type_id }, { slug: orderData.slug }] });
        if (!orderDetails) throw new handleError(400, 'Item ordered is not valid');

        orderData.amount = orderDetails.amount;
        orderData.order_type_id = orderDetails.id;
        return Order.create({ ...orderData, reference: generateId('ORD_') });
    },

    async view(criteria: object): Promise<IOrder | null> {
        return Order.findOne(criteria);
    },

    async list(criteria: object): Promise<IOrder[]> {
        return Order.find(criteria);
    },

    async update() {

    }
}