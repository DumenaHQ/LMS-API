import mongoose, { Schema } from 'mongoose';
import { ORDER_TYPES } from '../config/constants';

export enum EOrderStatus {
    Active = 'active',
    Pending = 'pending',
    Confirmed = 'confirmed',
    InProgress = 'in progess',
    Fulfilled = 'Fulfilled'
}

export interface IOrder {
    id: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    item_type: string;
    total_amount: number;
    coupon: Schema.Types.ObjectId;
    reference: string;
    status?: string;
    items: [
        {
            title?: string;
            order_type: string;
            order_type_id?: Schema.Types.ObjectId;
            ordered_item?: string;
            slug?: string;
            amount: number;
            user_id: Schema.Types.ObjectId;
            meta_data: Object;
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
    order_type_id: {
        type: String,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    slug: String,
    user_id: Schema.Types.ObjectId,
    meta_data: {}
};

const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    item_type: String,
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
        enum: EOrderStatus,
        default: EOrderStatus.Active
    }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
