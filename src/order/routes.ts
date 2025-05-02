import { Router } from 'express';
import { isAdmin, isAuthenticated } from '../middleware/verifyToken';
import { viewOrder, listOrders, updateOrder, viewActiveOrder } from './controller';
// import validate, { orderValidationRules } from '../middleware/validators/orderValidators';

export const router = Router();

// router.post('/', isAuthenticated, orderValidationRules(), validate, createOrder);

// router.post('/class-sub', isAuthenticated, createClassOrder);

router.get('/', isAuthenticated, listOrders);

router.get('/active-order', isAuthenticated, viewActiveOrder);

router.get('/:id', isAuthenticated, viewOrder);

router.put('/:id', isAuthenticated, isAdmin, updateOrder);