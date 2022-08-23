import Payment, { IPayment } from './model';
import { APIRequest } from '../helpers/APIRequest';
import { PAYSTACK_API_URL } from '../config/constants';
import { paystackConfig } from '../config/config';
import { handleError } from '../helpers/handleError';
import { orderService } from '../order/service';
import { IOrder } from '../order/model';


export const paymentService = {
    async save(reference: String): Promise<{ payment: IPayment, order: IOrder }> {
        // first verify payment status
        const { amount, channel, currency, status } = await this.verifyPayment(reference);
        // verify order reference
        const order = await orderService.view({ reference });
        if (!order) {   // wahala!
            // log this, alert engineer
            throw new handleError(400, 'Invalid order reference');
        }

        // verify amount paid
        if (order.total_amount > amount) {
            // log this, alert admin
            throw new handleError(400, 'Amount paid is less than order amount');
        }

        const payment = await Payment.create({ order: order.id, user: order.user, amount, reference, channel, currency, status });
        return { payment, order };
    },


    async verifyPayment(reference: String): Promise<{ amount: Number, channel: String, currency: String, status: String }> {
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


    async list(criteria: object): Promise<IPayment[]> {
        return Payment.find(criteria);
    }
}