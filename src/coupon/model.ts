import mongoose, { Schema } from 'mongoose';
import { ORDER_TYPES } from '../config/constants';

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
    status: {
        type: String,
        default: 'active'
    }
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);