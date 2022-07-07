import Subscription from './model'

export const subscriptionService = {
    async list() {
        return Subscription.find();
    }
}