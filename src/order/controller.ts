import { Request, Response, NextFunction } from "express";
import { orderService } from './service';
import { send as sendResponse } from "../helpers/httpResponse";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await orderService.create({ ...req.body, user: req.user.id });
        sendResponse(res, 201, 'Order created', { order });
    } catch (err) {
        next(err);
    }
}


export const listOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await orderService.list({});
        sendResponse(res, 200, 'Orders fetched', { orders });
    } catch (err) {
        next(err);
    }
}


export const viewOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: orderId } = req.params;
        const order = await orderService.view({ _id: orderId });
        sendResponse(res, 201, 'Order fetched', { order });
    } catch (err) {
        next(err);
    }
}


export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id: orderId } = req.params;
        const order = await orderService.update(orderId, req.body);
        sendResponse(res, 201, 'Order updated', { order });
    } catch (err) {
        next(err);
    }
}