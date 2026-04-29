import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    chunkText: {
      type: String,
      trim: true,
      default: '',
    },
    chunkOrder: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
  },
  { _id: false }
);

const knowledgeBaseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['faq', 'document'],
      required: true,
      default: 'faq',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: String,
      trim: true,
      default: '',
    },
    answer: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    chunks: {
      type: [knowledgeChunkSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

knowledgeBaseSchema.index({ tenantId: 1, type: 1, status: 1 });

export default mongoose.model('KnowledgeBaseItem', knowledgeBaseSchema);
