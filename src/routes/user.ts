import { Router } from "express";
import { createUser, login } from '../controllers/userController';

export const router = Router();

router.post('/', createUser);

router.post('/login', login);