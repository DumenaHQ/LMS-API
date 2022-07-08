import { Router } from 'express';
import { isAdmin, isAuthenticated } from "../middleware/verifyToken";
import { verifyPayment, fetchPayments } from './controller';

export const router = Router();

router.post('/verify', isAuthenticated, verifyPayment);

router.get('/', isAuthenticated, isAdmin, fetchPayments);