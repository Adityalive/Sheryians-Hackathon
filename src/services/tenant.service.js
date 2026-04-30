import Tenant from '../models/TenantModel.js';
import mongoose from 'mongoose';
import { createRecord, findOneRecord, findRecords } from './repository.service.js';

const normalizeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const resolveTenantIdentity = (req = {}) => {
  const body = req.body || {};
  const query = req.query || {};
  const headers = req.headers || {};

  return {
    tenantId: body.tenantId || query.tenantId || headers['x-tenant-id'] || '',
    tenantSlug: body.tenantSlug || query.tenantSlug || headers['x-tenant-slug'] || '',
    tenantName: body.tenantName || query.tenantName || headers['x-tenant-name'] || '',
  };
};

export const createTenant = async ({ name, slug, settings = {} }) => {
  const normalizedSlug = normalizeSlug(slug || name);
  const existingTenant = await getTenantBySlug(normalizedSlug);

  if (existingTenant) {
    throw new Error('Tenant slug already exists');
  }

  const payload = {
    name,
    slug: normalizedSlug,
    settings,
  };

  return createRecord(Tenant, 'Tenant', payload);
};

export const listTenants = async () => findRecords(Tenant, 'Tenant', {}, { sort: { createdAt: -1 } });

export const getTenantById = async (tenantId) => findOneRecord(Tenant, 'Tenant', { _id: tenantId });

export const getTenantBySlug = async (slug) => findOneRecord(Tenant, 'Tenant', { slug: normalizeSlug(slug) });

export const resolveExistingTenant = async ({ tenantId, tenantSlug }) => {
  if (tenantId && mongoose.isValidObjectId(tenantId)) {
    const byId = await getTenantById(tenantId);
    if (byId) return byId;
  }

  const normalizedSlug = tenantSlug || (!mongoose.isValidObjectId(tenantId) ? tenantId : '');

  if (normalizedSlug) {
    const bySlug = await getTenantBySlug(normalizedSlug);
    if (bySlug) return bySlug;
  }

  return null;
};

export const getOrCreateTenant = async ({ tenantId, tenantSlug, tenantName }) => {
  if (tenantId && mongoose.isValidObjectId(tenantId)) {
    const byId = await getTenantById(tenantId);
    if (byId) return byId;
  }

  const normalizedSlug = tenantSlug || (!mongoose.isValidObjectId(tenantId) ? tenantId : '');

  if (normalizedSlug) {
    const bySlug = await getTenantBySlug(normalizedSlug);
    if (bySlug) return bySlug;
  }

  const fallbackName = tenantName || normalizedSlug || 'Demo Tenant';
  return createTenant({
    name: fallbackName,
    slug: normalizedSlug || fallbackName,
  });
};
