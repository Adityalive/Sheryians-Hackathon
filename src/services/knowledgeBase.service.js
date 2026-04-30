import KnowledgeBaseItem from '../models/KnowledgeBaseModel.js';
import mongoose from 'mongoose';
import { createRecord, findOneRecord, findRecords } from './repository.service.js';

const tokenize = (input) =>
  String(input || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'you',
  'your',
  'with',
  'this',
  'that',
  'from',
  'are',
  'was',
  'can',
  'how',
  'what',
  'when',
  'where',
  'why',
  'who',
  'please',
]);

const cleanTokens = (input) => tokenize(input).filter((word) => !STOPWORDS.has(word));

const scoreKnowledgeItem = (item, message) => {
  const messageTokens = new Set(cleanTokens(message));
  const fields = [item.title, item.question, item.answer, item.content, ...(item.tags || [])];
  const tokens = new Set(cleanTokens(fields.join(' ')));
  let score = 0;

  for (const token of messageTokens) {
    if (tokens.has(token)) {
      score += 1;
    }
  }

  const loweredMessage = String(message || '').toLowerCase();
  if (item.question && loweredMessage.includes(item.question.toLowerCase().slice(0, 24))) {
    score += 4;
  }

  if (item.title && loweredMessage.includes(item.title.toLowerCase().slice(0, 24))) {
    score += 2;
  }

  return score;
};

export const createKnowledgeBaseItem = async (tenantId, payload) =>
  createRecord(KnowledgeBaseItem, 'KnowledgeBaseItem', {
    tenantId,
    type: payload.type || 'faq',
    title: payload.title,
    question: payload.question || '',
    answer: payload.answer || '',
    content: payload.content || payload.answer || '',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    chunks: Array.isArray(payload.chunks) ? payload.chunks : [],
    status: payload.status || 'active',
    metadata: payload.metadata || {},
  });

export const listKnowledgeBaseItems = async (tenantId) =>
  findRecords(KnowledgeBaseItem, 'KnowledgeBaseItem', { tenantId }, { sort: { createdAt: -1 } });

export const getKnowledgeBaseItem = async (tenantId, itemId) =>
  mongoose.isValidObjectId(itemId) ? findOneRecord(KnowledgeBaseItem, 'KnowledgeBaseItem', { tenantId, _id: itemId }) : null;

export const deleteKnowledgeBaseItem = async (tenantId, itemId) => {
  if (!mongoose.isValidObjectId(itemId)) return null;
  return KnowledgeBaseItem.findOneAndDelete({ tenantId, _id: itemId });
};

export const seedKnowledgeBase = async (tenantId, items = []) => {
  const created = [];

  for (const item of items) {
    created.push(await createKnowledgeBaseItem(tenantId, item));
  }

  return created;
};

export const retrieveKnowledgeBaseContext = async (tenantId, message, limit = 3) => {
  const items = await listKnowledgeBaseItems(tenantId);
  const ranked = items
    .map((item) => ({
      item,
      score: scoreKnowledgeItem(item, message),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ item, score }) => ({
    id: item._id,
    type: item.type,
    title: item.title,
    question: item.question,
    answer: item.answer,
    content: item.content,
    tags: item.tags || [],
    score,
  }));
};

export const buildKnowledgeSummary = (matches = []) =>
  matches
    .map((match, index) => {
      const lines = [`[${index + 1}] ${match.title}`];
      if (match.question) lines.push(`Q: ${match.question}`);
      if (match.answer) lines.push(`A: ${match.answer}`);
      if (!match.answer && match.content) lines.push(`Content: ${match.content}`);
      return lines.join('\n');
    })
    .join('\n\n');
