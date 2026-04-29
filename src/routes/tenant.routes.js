import { Router } from 'express';
import { createTenantHandler, listTenantsHandler, resolveTenantHandler } from '../controllers/tenant.controller.js';

const router = Router();

router.get('/', listTenantsHandler);
router.post('/', createTenantHandler);
router.get('/:tenantId', resolveTenantHandler);

export default router;
