import Message from '../models/MessageModel.js';
import { createRecord, findRecords } from './repository.service.js';

export const createMessage = async (payload) =>
  createRecord(Message, 'Message', {
    tenantId: payload.tenantId,
    conversationId: payload.conversationId,
    role: payload.role,
    content: payload.content,
    metadata: payload.metadata || {},
  });

export const listMessagesForConversation = async (tenantId, conversationId) =>
  findRecords(
    Message,
    'Message',
    { tenantId, conversationId },
    { sort: { createdAt: 1 } }
  );
