import mongoose, { Schema } from 'mongoose';
import { ORDER_TYPES } from '../config/constants';

enum OrderStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    InProgress = 'in progess',
    Fulfilled = 'Fulfilled'
}

export interface IOrder {
    id: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    total_amount: number;
    coupon: Schema.Types.ObjectId;
    reference: String;
    status?: String;
    items: [
        {
            title: String;
            order_type: String;
            order_type_id?: Schema.Types.ObjectId;
            ordered_item?: String;
            slug?: String;
            amount: number;
            user_id: Schema.Types.ObjectId
        }
    ]
}

const orderItems = {
    title: String,
    order_type: {
        type: String,
        required: true,
        enum: ORDER_TYPES
    },
    order_type_id: String,
    amount: {
        type: Number,
        required: true
    },
    slug: String,
    user_id: Schema.Types.ObjectId
}

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reference: {
        type: String,
        unique: true
    },
    items: [orderItems],
    coupon: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    total_amount: Number,
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Pending
    }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
