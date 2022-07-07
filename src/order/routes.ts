import { Router } from 'express';
import { isAdmin, isAuthenticated } from "../middleware/verifyToken";
import { createOrder, viewOrder, listOrder, updateOrder } from './controller';

export const router = Router();

router.post('/', isAuthenticated, createOrder);

router.get('/', isAuthenticated, listOrder);

router.get('/:id', isAuthenticated, viewOrder);

router.put('/:id', isAuthenticated, isAdmin, updateOrder);