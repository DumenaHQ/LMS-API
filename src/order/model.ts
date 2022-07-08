import mongoose, { Schema } from 'mongoose';
import { ORDER_TYPES } from '../config/constants';

enum OrderStatus {
    Pending = 'pending',
    Confirmed = 'confirmed',
    InProgress = 'in progess',
    Fulfilled = 'Fulfilled'
}

export interface IOrder {
    user: Schema.Types.ObjectId;
    order_type: String;
    order_type_id: Schema.Types.ObjectId;
    ordered_item?: String;
    slug?: String;
    amount: Number;
    reference: String;
    status?: String
}

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
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
    reference: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Pending
    }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);