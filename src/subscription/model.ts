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
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);



const schoolSubscriptionSchema = new Schema({
    subscription: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    school: {
        type: Schema.Types.ObjectId,
        ref: 'School'
    },
    coupon: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    status: {
        type: String,
        enum: ['active', 'expired'],
        default: 'active'
    }
}, { timestamps: true });
export const SchoolSubscription = mongoose.model('SchoolSubscription', schoolSubscriptionSchema);


const schoolSubscriptionTransactionSchema = new Schema({
    school_subscription: {
        type: Schema.Types.ObjectId,
        ref: 'SchoolSubscription'
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    reference: {
        type: String,
        unique: true,
        required: true
    },
}, { timestamps: true });
export const SchoolSubscriptionTransaction = mongoose.model('SchoolSubscriptionTransaction', schoolSubscriptionTransactionSchema);



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
