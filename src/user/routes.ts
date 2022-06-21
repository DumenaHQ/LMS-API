import { Router } from "express";
import { createUser, login, activateUser } from './controller';
import validate, { userCreationRules, loginRules } from '../middleware/validators/userValidators';

export const router = Router();

router.post('/', userCreationRules(), validate, createUser);

router.post('/login', loginRules(), validate, login);

router.put('/activate', activateUser);