import { Router } from 'express';
import { createUser, login, activateUser, updateUser, getUser, getUsers, getParentChildren, getUserPayments, enrollLearner, sendPasswordResetEmail, resetPassword, resendVerificationEmail, downloadUserData, removeChild, deleteUser, removeTeacherFromSchool, changeUserStatus, logout } from './controller';
import validate, { userCreationRules, loginRules } from '../middleware/validators/userValidators';
import { enrollLearnerRules } from '../middleware/validators/enrollLearnerValidators';
import { isAdmin, isAuthenticated, isParent, isSchool } from '../middleware/verifyToken';

export const router = Router();

router.post('/', userCreationRules(), validate, createUser);

router.post('/login', loginRules(), validate, login);
router.post('/logout', isAuthenticated, logout);

router.put('/activate', activateUser);

router.post('/resend-verification-email', resendVerificationEmail);

router.post('/send-password-reset-email', sendPasswordResetEmail);

router.post('/reset-password', resetPassword);

router.get('/exportdata/:role', downloadUserData);

router.put('/', isAuthenticated, updateUser);

router.post('/teacher', isAuthenticated, isSchool, userCreationRules(), validate, createUser);

router.delete('/teacher/:teacherUserId', isAuthenticated, isSchool, removeTeacherFromSchool);

router.get('/:id', isAuthenticated, getUser);

router.get('/', isAuthenticated, isAdmin, getUsers);

router.get('/:id/payments', isAuthenticated, getUserPayments);

router.put('/:id/activate', isAuthenticated, isAdmin, changeUserStatus);

router.put('/:id/deactivate', isAuthenticated, isAdmin, changeUserStatus);


// parents routes
router.get('/:id/learners', isAuthenticated, isParent, getParentChildren);

router.delete('/:id/learners/:learnerid', isAuthenticated, isParent, removeChild);


// learner routes
router.post('/enroll', isAuthenticated, enrollLearnerRules(), validate, enrollLearner);

// wahala
router.delete('/delete/:email', deleteUser);