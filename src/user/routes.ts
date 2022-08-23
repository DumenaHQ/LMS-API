import { Router } from "express";
import { createUser, login, activateUser, updateUser, getUser, getUsers, getParentChildren, getUserPayments } from './controller';
import validate, { userCreationRules, loginRules } from '../middleware/validators/userValidators';
import { isAuthenticated, isAdmin, isParent } from "../middleware/verifyToken";

export const router = Router();

router.post('/', userCreationRules(), validate, createUser);

router.post('/login', loginRules(), validate, login);

router.put('/activate', activateUser);

// parents routes
router.get('/:id/learners', isAuthenticated, isParent, getParentChildren);

router.put('/:id', isAuthenticated, updateUser);

router.get('/:id', isAuthenticated, getUser);

router.get('/', isAuthenticated, getUsers);

router.get('/:id/payments', isAuthenticated, getUserPayments);