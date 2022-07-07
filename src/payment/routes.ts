import { Router } from 'express';
import { isAdmin, isAuthenticated } from "../middleware/verifyToken";
import { paymentService } from './service';

export const router = Router();

router.post('/', isAuthenticated, paymentService.acceptPayment);

router.get('/', isAuthenticated, isAdmin);