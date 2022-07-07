import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new Schema({
    title: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    slug: {
        type: String,
        unique: true
    }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);