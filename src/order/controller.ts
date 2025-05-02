import { Request, Response, NextFunction } from 'express';
import { orderService } from './service';
import { EOrderStatus } from './model';
import { send as sendResponse } from '../helpers/httpResponse';
import { USER_TYPES } from '../config/constants';
// import { classSubscriptionService } from '../subscription/classSubscriptionService';
// import { paymentService } from '../payment/service';

// export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
// try {
//     const order = await orderService.create({ ...req.body, user: req.user.id }, req.user.role);
//     sendResponse(res, 201, 'Order created', { order });
// } catch (err) {
//     next(err);
// }
// };

// export const createClassOrder = async (req: Request, res: Response, next: NextFunction) => {
// try {
//     const { email, id } = req.user;
//     const { classes } = req.body;
//     const { access_code } = await paymentService.initializePayment(email, Number(total_amount), reference);
//     const order = await orderService.create({ ...req.body, user: req.user.id }, req.user.role);
//     sendResponse(res, 201, 'Class Order created', { access_code });
// } catch (err) {
//     next(err);
// }
// };


export const listOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, role } = req.user;
        const criteria = role == USER_TYPES.admin ? {} : { user: id };
        const orders = await orderService.list(criteria);
        sendResponse(res, 200, 'Orders fetched', { orders });
    } catch (err) {
        next(err);
    }
};


export const viewOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: orderId } = req.params;
        const order = await orderService.view({ _id: orderId });
        sendResponse(res, 200, 'Order fetched', { order });
    } catch (err) {
        next(err);
    }
};

export const viewActiveOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: user } = req.user;
        const order = await orderService.view({ user, status: EOrderStatus.Active });
        sendResponse(res, 200, 'Active Order fetched', { order });
    } catch (err) {
        next(err);
    }
};


export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: orderId } = req.params;
        const order = await orderService.update({ _id: orderId }, req.body);
        sendResponse(res, 200, 'Order updated', { order });
    } catch (err) {
        next(err);
    }
};