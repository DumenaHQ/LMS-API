import mongoose, { Schema } from 'mongoose';

enum PaymentStatus {
    Pending = 'pending',
    Success = 'success',
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