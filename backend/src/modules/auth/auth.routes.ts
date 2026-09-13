import { Router } from 'express';
import { authController } from './auth.controller';
import { authGuard } from '../../common/guards/auth.guard';

const router = Router();

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/google-sso', authController.googleLogin);
router.get('/me', authGuard, authController.getMe);

export default router;
