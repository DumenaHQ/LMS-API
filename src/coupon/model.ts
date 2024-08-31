import mongoose, { Schema } from 'mongoose';
import { ORDER_TYPES } from '../config/constants';


export interface ICoupon {
    id?: string;
    title?: string;
    code: string;
    discount?: number;
    deleted?: boolean;
    status?: 'active' | 'inactive';
    expiry_date?: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }


const couponSchema = new Schema({
    title: {
        type: String
    },
    order_type: {
        type: String,
        enum: Object.values(ORDER_TYPES)
    },
    code: {
        type: String,
        index: true,
        required: true
    },
    disount: {
        type: Number,
        unique: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    expiry_date: {
        type: Date
    }
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);