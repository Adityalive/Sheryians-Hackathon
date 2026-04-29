import { createTenant, getOrCreateTenant, listTenants } from '../services/tenant.service.js';

export const createTenantHandler = async (req, res) => {
  try {
    const { name, slug, settings } = req.body || {};
    if (!String(name || '').trim()) {
      return res.status(400).json({ message: 'name is required' });
    }

    const tenant = await createTenant({ name, slug, settings });
    return res.status(201).json({ tenant });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listTenantsHandler = async (req, res) => {
  try {
    const tenants = await listTenants();
    return res.json({ tenants });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const resolveTenantHandler = async (req, res) => {
  try {
    const tenant = await getOrCreateTenant({
      tenantId: req.params.tenantId,
      tenantSlug: req.query.tenantSlug,
      tenantName: req.query.tenantName,
    });
    return res.json({ tenant });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
