import Order, { IOrder } from './model';
import { generateId } from '../helpers/utility';

export const orderService = {
    async save(orderData: IOrder): Promise<IOrder> {
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