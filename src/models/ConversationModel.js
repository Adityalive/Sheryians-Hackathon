import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Customer',
    },
    customerEmail: {
      type: String,
      trim: true,
      default: '',
    },
    channel: {
      type: String,
      enum: ['web', 'chat', 'voice'],
      default: 'chat',
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ tenantId: 1, sessionId: 1 }, { unique: true });

export default mongoose.model('Conversation', conversationSchema);
