import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    conversationId: { type: String, required: true },
    channel: { type: String, enum: ['chat', 'voice', 'phone'], default: 'chat' },
    customerName: { type: String, default: 'Unknown' },
    customerPhone: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    subject: { type: String, default: 'Support Request' },
    transcript: { type: String, default: '' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    assignedTo: { type: String, default: null },
    escalationReason: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
