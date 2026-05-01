import { getTenantAnalytics } from '../services/analytics.service.js';
import { getOrCreateTenant } from '../services/tenant.service.js';

export const getAnalytics = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await getOrCreateTenant({ tenantId });
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const stats = await getTenantAnalytics(tenant._id);
    return res.json({ stats });
  } catch (error) {
    console.error('Analytics error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};
