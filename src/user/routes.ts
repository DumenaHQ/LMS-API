import { Router } from "express";
import { createUser, login, activateUser, updateUser, getUser, getUsers } from './controller';
import validate, { userCreationRules, loginRules } from '../middleware/validators/userValidators';
import { isAuthenticated, isAdmin } from "../middleware/verifyToken";

export const router = Router();

router.post('/', userCreationRules(), validate, createUser);

router.post('/login', loginRules(), validate, login);

router.put('/activate', activateUser);

router.put('/:id', isAuthenticated, updateUser);

router.get('/:id', isAuthenticated, getUser);

router.get('/', isAuthenticated, isAdmin, getUsers);