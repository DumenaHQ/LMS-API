import { Router } from "express";
import { createUser, login } from './controller';
import { userCreationRules, loginRules, validate } from '../middleware/validators/userValidators';

export const router = Router();

router.post('/', userCreationRules(), validate, createUser);

router.post('/login', loginRules(), validate, login);