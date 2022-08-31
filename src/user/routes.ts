import { Router } from "express";
import { createUser, login, activateUser, updateUser, getUser, getUsers, getParentChildren, getUserPayments, enrollLearner, sendPasswordResetEmail, resetPassword, resendVerificationEmail, downloadUserData } from './controller';
import validate, { userCreationRules, loginRules } from '../middleware/validators/userValidators';
import { enrollLearnerRules } from '../middleware/validators/enrollLearnerValidators';
import { isAuthenticated, isAdmin, isParent } from "../middleware/verifyToken";

export const router = Router();

router.post('/', userCreationRules(), validate, createUser);

router.post('/login', loginRules(), validate, login);

router.put('/activate', activateUser);

router.post('/resend-verification-email', resendVerificationEmail);

router.post('/send-password-reset-email', sendPasswordResetEmail);

router.post('/reset-password', resetPassword);

router.get('/exportdata', downloadUserData);

router.put('/', isAuthenticated, updateUser);

router.get('/:id', isAuthenticated, getUser);

router.get('/', isAuthenticated, getUsers);

router.get('/:id/payments', isAuthenticated, getUserPayments);


// parents routes
router.get('/:id/learners', isAuthenticated, isParent, getParentChildren);


// learner routes
router.post('/enroll', isAuthenticated, enrollLearnerRules(), validate, enrollLearner);