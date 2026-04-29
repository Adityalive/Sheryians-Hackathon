import Conversation from '../models/ConversationModel.js';
import mongoose from 'mongoose';
import { createRecord, findOneRecord, findRecords, updateRecord } from './repository.service.js';

export const createConversation = async (payload) =>
  createRecord(Conversation, 'Conversation', {
    tenantId: payload.tenantId,
    sessionId: payload.sessionId,
    customerName: payload.customerName || 'Customer',
    customerEmail: payload.customerEmail || '',
    channel: payload.channel || 'chat',
    status: payload.status || 'open',
    metadata: payload.metadata || {},
  });

export const getConversationById = async (tenantId, conversationId) =>
  mongoose.isValidObjectId(conversationId)
    ? findOneRecord(Conversation, 'Conversation', { tenantId, _id: conversationId })
    : null;

export const getConversationBySessionId = async (tenantId, sessionId) =>
  findOneRecord(Conversation, 'Conversation', { tenantId, sessionId });

export const getOrCreateConversation = async ({ tenantId, sessionId, customerName, customerEmail, channel, metadata }) => {
  const existing = await getConversationBySessionId(tenantId, sessionId);
  if (existing) {
    return existing;
  }

  return createConversation({
    tenantId,
    sessionId,
    customerName,
    customerEmail,
    channel,
    metadata,
  });
};

export const listConversationsForTenant = async (tenantId) =>
  findRecords(Conversation, 'Conversation', { tenantId }, { sort: { createdAt: -1 } });

export const closeConversation = async (tenantId, conversationId) =>
  updateRecord(Conversation, 'Conversation', conversationId, { tenantId, status: 'closed' });
