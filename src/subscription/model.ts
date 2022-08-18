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
    },
    months: {
        type: Number
    }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);


const contentAcessSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    },
    access_type: String,
    access_type_id: Schema.Types.ObjectId,
    slug: {
        type: String
    },
    end_date: {
        type: Date,
        default: null
    }
}, { timestamps: true });

export const ContentAccess = mongoose.model('ContentAccess', contentAcessSchema);