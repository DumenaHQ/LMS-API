import Order, { IOrder, EOrderStatus } from './model';
import { generateId } from '../helpers/utility';
import { ORDER_TYPES } from '../config/constants';

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
        return Order.find(criteria).sort({ createdAt: 'desc' });
    },

    async update(criteria: object, data: object): Promise<IOrder | null> {
        return Order.findOneAndUpdate(criteria, data, { new: true });
    }
};