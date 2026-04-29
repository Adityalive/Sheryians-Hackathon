import { runChatGraph } from '../services/chatGraph.service.js';
import { getConversationById, listConversationsForTenant } from '../services/conversation.service.js';
import { getOrCreateTenant, resolveTenantIdentity } from '../services/tenant.service.js';
import { listMessagesForConversation } from '../services/message.service.js';
import {
  createKnowledgeBaseItem,
  getKnowledgeBaseItem,
  listKnowledgeBaseItems,
  seedKnowledgeBase,
} from '../services/knowledgeBase.service.js';

const DEFAULT_KB = [
  {
    type: 'faq',
    title: 'Business Hours',
    question: 'What are your business hours?',
    answer: 'We are open Monday to Friday, 9 AM to 6 PM.',
    tags: ['hours', 'support'],
  },
  {
    type: 'faq',
    title: 'Refund Policy',
    question: 'How do refunds work?',
    answer: 'Refund requests are reviewed by support and usually answered within 1 to 2 business days.',
    tags: ['refund', 'billing'],
  },
  {
    type: 'faq',
    title: 'Order Tracking',
    question: 'How can I track my order?',
    answer: 'Share your order number and we will check the latest shipping status for you.',
    tags: ['order', 'shipping'],
  },
];

export const sendMessage = async (req, res) => {
  try {
    const { message, customerName, customerEmail, sessionId, tenantId, tenantSlug, tenantName, channel, metadata } = req.body || {};
    const normalizedTenantSlug = tenantSlug || tenantId;

    if (!String(message || '').trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    const result = await runChatGraph({
      tenantInput: {
        tenantId,
        tenantSlug: normalizedTenantSlug,
        tenantName,
      },
      message: String(message).trim(),
      sessionId,
      customerName,
      customerEmail,
      channel: channel || 'chat',
      metadata: metadata || {},
    });

    return res.json({
      tenant: result.tenant,
      conversation: result.conversation,
      assistantMessage: result.assistantMessage,
      knowledgeMatches: result.knowledgeMatches,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const tenantInput = resolveTenantIdentity(req);
    const tenant = await getOrCreateTenant(tenantInput);
    const conversation = await getConversationById(tenant._id, conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found for this tenant' });
    }

    const messages = await listMessagesForConversation(tenant._id, conversation._id);

    return res.json({
      tenant,
      conversation,
      messages,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createTenantKnowledgeBaseItem = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await getOrCreateTenant({ tenantId });
    const item = await createKnowledgeBaseItem(tenant._id, req.body || {});
    return res.status(201).json({ tenant, item });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listTenantKnowledgeBase = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await getOrCreateTenant({ tenantId });
    const items = await listKnowledgeBaseItems(tenant._id);
    return res.json({ tenant, items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const seedTenantKnowledgeBase = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await getOrCreateTenant({ tenantId });
    const items = await seedKnowledgeBase(tenant._id, req.body?.items || DEFAULT_KB);
    return res.status(201).json({ tenant, items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTenantConversations = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await getOrCreateTenant({ tenantId });
    const conversations = await listConversationsForTenant(tenant._id);
    return res.json({ tenant, conversations });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getKnowledgeItem = async (req, res) => {
  try {
    const { tenantId, itemId } = req.params;
    const tenant = await getOrCreateTenant({ tenantId });
    const item = await getKnowledgeBaseItem(tenant._id, itemId);

    if (!item) {
      return res.status(404).json({ message: 'Knowledge base item not found for this tenant' });
    }

    return res.json({ tenant, item });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
