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
    async list(criteria: object): Promise<IPayment[]> {
        return Payment.find(criteria);
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
            return { payment, order: updatedOrder };
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
                const { payment, order } = await this.save(data);
                subscriptionService.grantAccess(order);
        }
        // {
        //     "event": "charge.success",
        //     "data": {
        //       "id": 302961,
        //       "domain": "live",
        //       "status": "success",
        //       "reference": "qTPrJoy9Bx",
        //       "amount": 10000,
        //       "message": null,
        //       "gateway_response": "Approved by Financial Institution",
        //       "paid_at": "2016-09-30T21:10:19.000Z",
        //       "created_at": "2016-09-30T21:09:56.000Z",
        //       "channel": "card",
        //       "currency": "NGN",
        //       "ip_address": "41.242.49.37",
        //       "metadata": 0,
        //       "log": {
        //         "time_spent": 16,
        //         "attempts": 1,
        //         "authentication": "pin",
        //         "errors": 0,
        //         "success": false,
        //         "mobile": false,
        //         "input": [],
        //         "channel": null,
        //         "history": [
        //           {
        //             "type": "input",
        //             "message": "Filled these fields: card number, card expiry, card cvv",
        //             "time": 15
        //           },
        //           {
        //             "type": "action",
        //             "message": "Attempted to pay",
        //             "time": 15
        //           },
        //           {
        //             "type": "auth",
        //             "message": "Authentication Required: pin",
        //             "time": 16
        //           }
        //         ]
        //       },
        //       "fees": null,
        //       "customer": {
        //         "id": 68324,
        //         "first_name": "BoJack",
        //         "last_name": "Horseman",
        //         "email": "bojack@horseman.com",
        //         "customer_code": "CUS_qo38as2hpsgk2r0",
        //         "phone": null,
        //         "metadata": null,
        //         "risk_action": "default"
        //       },
        //       "authorization": {
        //         "authorization_code": "AUTH_f5rnfq9p",
        //         "bin": "539999",
        //         "last4": "8877",
        //         "exp_month": "08",
        //         "exp_year": "2020",
        //         "card_type": "mastercard DEBIT",
        //         "bank": "Guaranty Trust Bank",
        //         "country_code": "NG",
        //         "brand": "mastercard",
        //         "account_name": "BoJack Horseman"
        //       },
        //       "plan": {}
        //     }
        //   }
    }
};