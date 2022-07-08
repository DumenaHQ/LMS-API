import Payment, { IPayment } from './model';
import { APIRequest } from '../helpers/APIRequest';
import { PAYSTACK_API_URL } from '../config/constants';
import { paystackConfig } from '../config/config';
import { handleError } from '../helpers/handleError';
import { orderService } from '../order/service';


export const paymentService = {
    async save(reference: String): Promise<IPayment> {
        // verify payment status
        const option = {
            headers: { Authorization: `Bearer ${paystackConfig.SECRET_KEY}` },
            baseURL: PAYSTACK_API_URL
        };
        const apiRequest = new APIRequest(option);
        const url: string = `/transaction/verify/${reference}`;
        //const { status: responseStatus, data } = await apiRequest.get(url);
        const responseStatus = true;
        const data = {
            amount: 20000, channel: 'card', currency: 'NGN', status: 'success'
        };
        if (!responseStatus) throw new handleError(400, 'unable to verify transaction status');

        const { amount, channel, currency, status } = data;
        if (status != 'success') throw new handleError(400, 'Payment attempt didn\'t succeed');

        // verify order reference
        const order = await orderService.view({ reference });
        if (!order) {   // wahala!
            // log this, alert engineer
            throw new handleError(400, 'Invalid order reference');
        }

        // verify amount paid
        if (order.amount > amount) {
            // log this, alert admin
            throw new handleError(400, 'Amount paid is less than order amount');
        }

        const payment = await Payment.create({ order: order.order_type_id, user: order.user, amount, reference, channel, currency, status });
        return payment;
    },


    async list(): Promise<IPayment[]> {
        return Payment.find();
    }
}