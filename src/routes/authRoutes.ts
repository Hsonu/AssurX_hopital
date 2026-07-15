import { Router } from 'express';
import { googleAuth, logout } from '../controllers/authController.ts';

const router = Router();

router.post('/google', googleAuth);
router.post('/logout', logout);

export default router;
