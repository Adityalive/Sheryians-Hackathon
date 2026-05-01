import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller.js';

const router = Router();

// GET /api/analytics/tenants/:tenantId
router.get('/tenants/:tenantId', getAnalytics);

export default router;
