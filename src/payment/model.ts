import mongoose, { Schema } from 'mongoose';

enum PaymentStatus {
    Pending = 'pending',
    Success = 'success',
}

export interface IPayment {
    order: Schema.Types.ObjectId;
    user: Schema.Types.ObjectId;
    amount: number;
    reference: string;
    channel: string;
    currency: string;
    status?: string;
}

const paymentSchema = new Schema({
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'NGN'
    },
    channel: {
        type: String
    },
    reference: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: Object.values(PaymentStatus),
        defaults: PaymentStatus.Pending
    }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);