import Payment, { IPayment } from './model';
import { APIRequest } from '../helpers/APIRequest';
import { PAYSTACK_API_URL } from '../config/constants';
import { paystackConfig } from '../config/config';
import { handleError } from '../helpers/handleError';
import { orderService } from '../order/service';
import { EOrderStatus, IOrder } from '../order/model';
import mongoose from 'mongoose';
import { subscriptionService } from '../subscription/service';


export const paymentService = {
    async list(criteria: object) {
        return Payment.find(criteria).sort({ createdAt: 'desc' });
    },

    async initializePayment(email: string, amount: number, reference: string){
        const option = {
            headers: { Authorization: `Bearer ${paystackConfig.SECRET_KEY}` },
            baseURL: PAYSTACK_API_URL
        };
        const apiRequest = new APIRequest(option);
        const url: string = '/transaction/initialize';
        return apiRequest.post(url, {
            email: email,
            amount: amount * 100,
            reference: reference,
            currency: 'NGN',
            callback_url: process.env.BASE_URL + 'school/payment/confirm-payment',
            channels: ['card', 'ussd', 'mobile_money', 'bank_transfer'],
        });
    },

    async verifyPayment(reference: string): Promise<{ amount: number, channel: string, currency: string, status: string }> {
        const option = {
            headers: { Authorization: `Bearer ${paystackConfig.SECRET_KEY}` },
            baseURL: PAYSTACK_API_URL
        };
        const apiRequest = new APIRequest(option);
        const url: string = `/transaction/verify/${reference}`;
        const { status: responseStatus, data } = await apiRequest.get(url);

        if (!responseStatus) throw new handleError(400, 'unable to verify transaction status');

        const { amount, channel, currency, status } = data;
        if (status != 'success') throw new handleError(400, 'Payment attempt didn\'t succeed');
        return { amount, channel, currency, status };
    },

    async save({ amount, channel, currency, status, reference }: Record<string, any>): Promise<{ payment: IPayment, order: IOrder }> {
        // const { amount, channel, currency, status } = await this.verifyPayment(reference);
        // verify order reference
        const order = await orderService.view({ reference });
        if (!order) {   // wahala!
            // log this, alert engineer
            throw new handleError(400, 'Invalid order reference');
        }

        if (order.total_amount > amount) {
            // log this, alert admin
            throw new handleError(400, 'Amount paid is less than order amount');
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const [payment, updatedOrder] = await Promise.all([
                Payment.create({ order: order.id, user: order.user, amount, reference, channel, currency, status }) as unknown as IPayment,
                orderService.update({ _id: order.id }, { status: EOrderStatus.Confirmed })
            ]);
            await session.commitTransaction();
            return { payment, order: updatedOrder as IOrder };
        } catch (err) {
            await session.abortTransaction();
            throw new handleError(400, 'Error completing payment');
        } finally {
            session.endSession();
        }
    },

    async handleWebhook(eventData: Record<string, any>) {
        const { event, data } = eventData;
        switch (event) {
            case 'charge.success':
                const { order } = await this.save(data);
                subscriptionService.grantAccess(order);
        }
    }
};