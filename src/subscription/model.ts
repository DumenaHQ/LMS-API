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



const userSubscriptionSchema = new Schema({
    subscription: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
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
export const UserSubscription = mongoose.model('UserSubscription', userSubscriptionSchema);


const userSubscriptionTransactionSchema = new Schema({
    user_subscription: {
        type: Schema.Types.ObjectId,
        ref: 'UserSubscription'
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
export const UserSubscriptionTransaction = mongoose.model('UserSubscriptionTransaction', userSubscriptionTransactionSchema);


const classSubscriptionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    class: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        index: true
    },
    subscription: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    orderId: {
        type: Schema.Types.ObjectId,
    },
    learners: [String],
    total_amount: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'failed'],
        default: 'pending'
    },
    end_date: {
        type: Date,
        default: null
    }
}, { timestamps: true });
export const ClassSubscription = mongoose.model('ClassSubscription', classSubscriptionSchema);

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
