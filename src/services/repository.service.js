import mongoose from 'mongoose';
import { isDbReady } from '../config/db.js';

const memoryStore = {
  Tenant: [],
  Conversation: [],
  Message: [],
  KnowledgeBaseItem: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureCollection = (name) => {
  if (!memoryStore[name]) {
    memoryStore[name] = [];
  }
  return memoryStore[name];
};

const matches = (doc, filter = {}) =>
  Object.entries(filter).every(([key, value]) => {
    const current = key.includes('.') ? key.split('.').reduce((acc, part) => acc?.[part], doc) : doc[key];
    if (value && typeof value === 'object' && !(value instanceof mongoose.Types.ObjectId) && !Array.isArray(value)) {
      if (value.$in) return value.$in.map(String).includes(String(current));
    }
    return String(current) === String(value);
  });

export const createRecord = async (Model, collectionName, payload) => {
  if (isDbReady()) {
    return Model.create(payload);
  }

  const collection = ensureCollection(collectionName);
  const record = {
    _id: new mongoose.Types.ObjectId().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...clone(payload),
  };

  collection.push(record);
  return clone(record);
};

export const findOneRecord = async (Model, collectionName, filter) => {
  if (isDbReady()) {
    return Model.findOne(filter);
  }

  const collection = ensureCollection(collectionName);
  const record = collection.find((doc) => matches(doc, filter));
  return record ? clone(record) : null;
};

export const findByIdRecord = async (Model, collectionName, id) => {
  if (isDbReady()) {
    return Model.findById(id);
  }

  return findOneRecord(Model, collectionName, { _id: id });
};

export const findRecords = async (Model, collectionName, filter = {}, options = {}) => {
  if (isDbReady()) {
    const query = Model.find(filter);
    if (options.sort) query.sort(options.sort);
    if (options.limit) query.limit(options.limit);
    return query;
  }

  const collection = ensureCollection(collectionName);
  let records = collection.filter((doc) => matches(doc, filter));

  if (options.sort) {
    const [[field, direction]] = Object.entries(options.sort);
    records = records.sort((a, b) => {
      const left = new Date(a[field] || a.createdAt).getTime();
      const right = new Date(b[field] || b.createdAt).getTime();
      return direction < 0 ? right - left : left - right;
    });
  }

  if (options.limit) {
    records = records.slice(0, options.limit);
  }

  return records.map(clone);
};

export const updateRecord = async (Model, collectionName, id, updates) => {
  if (isDbReady()) {
    return Model.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }

  const collection = ensureCollection(collectionName);
  const index = collection.findIndex((doc) => String(doc._id) === String(id));
  if (index === -1) {
    return null;
  }

  const current = collection[index];
  const updated = {
    ...current,
    ...clone(updates),
    updatedAt: new Date().toISOString(),
  };

  collection[index] = updated;
  return clone(updated);
};

export const dumpMemoryStore = () => clone(memoryStore);
