import { getOrCreateTenant } from './tenant.service.js';
import { getOrCreateConversation } from './conversation.service.js';
import { createMessage, listMessagesForConversation } from './message.service.js';
import { buildKnowledgeSummary, retrieveKnowledgeBaseContext } from './knowledgeBase.service.js';
import { generateAssistantReply } from './openai.service.js';

const createSessionId = (input = {}) =>
  String(input.sessionId || input.conversationId || input.customerEmail || input.customerName || `session-${Date.now()}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const runChatGraph = async ({
  tenantInput,
  message,
  sessionId,
  customerName,
  customerEmail,
  channel = 'chat',
  metadata = {},
}) => {
  const tenant = await getOrCreateTenant(tenantInput);
  const normalizedSessionId = createSessionId({ sessionId, conversationId: metadata.conversationId, customerEmail, customerName });

  const conversation = await getOrCreateConversation({
    tenantId: tenant._id,
    sessionId: normalizedSessionId,
    customerName,
    customerEmail,
    channel,
    metadata,
  });

  await createMessage({
    tenantId: tenant._id,
    conversationId: conversation._id,
    role: 'user',
    content: message,
    metadata,
  });

  const history = await listMessagesForConversation(tenant._id, conversation._id);
  const knowledgeMatches = await retrieveKnowledgeBaseContext(tenant._id, message, 3);
  const knowledgeSummary = buildKnowledgeSummary(knowledgeMatches);

  const assistantReply = await generateAssistantReply({
    tenant,
    message,
    history,
    knowledge: knowledgeMatches,
    knowledgeSummary,
  });

  const assistantMessage = await createMessage({
    tenantId: tenant._id,
    conversationId: conversation._id,
    role: 'assistant',
    content: assistantReply,
    metadata: {
      knowledgeMatches: knowledgeMatches.map((item) => item.id),
    },
  });

  return {
    tenant,
    conversation,
    assistantMessage,
    knowledgeMatches,
  };
};
