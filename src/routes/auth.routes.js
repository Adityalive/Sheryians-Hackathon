import { Router } from 'express';
import { businessSignup, customerSignup, login, logout } from '../controllers/User.controller.js';

const router = Router();

router.post('/business-signup', businessSignup);
router.post('/customer-signup', customerSignup);
router.post('/login', login);
router.post('/logout', logout);

export default router;
