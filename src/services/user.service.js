import UserModel from '../models/UserModel.js';
import { createRecord, findOneRecord, findRecords } from './repository.service.js';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export const createUserAccount = async (payload) =>
  createRecord(UserModel, 'User', {
    ...payload,
    email: normalizeEmail(payload.email),
  });

export const findUserByTenantAndEmail = async (tenantId, email) =>
  findOneRecord(UserModel, 'User', {
    tenant: tenantId,
    email: normalizeEmail(email),
  });

export const findUsersByTenant = async (tenantId) => findRecords(UserModel, 'User', { tenant: tenantId }, { sort: { createdAt: -1 } });
