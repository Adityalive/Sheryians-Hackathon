import Ticket from '../models/TicketModel.js';

const ESCALATION_PHRASES = [
  'speak to agent',
  'speak to human',
  'human agent',
  'talk to someone',
  'talk to a person',
  'real person',
  'manager',
  'supervisor',
  'representative',
  'escalate',
  'transfer me',
  'not helpful',
  'useless',
];

/**
 * Detect if the message requires escalation to a human agent.
 */
export const detectEscalation = (message = '') => {
  const lower = message.toLowerCase();
  return ESCALATION_PHRASES.some((phrase) => lower.includes(phrase));
};

/**
 * Determine priority based on keywords in the message.
 */
const detectPriority = (message = '') => {
  const lower = message.toLowerCase();
  if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('immediately')) return 'urgent';
  if (lower.includes('angry') || lower.includes('furious') || lower.includes('refund') || lower.includes('scam')) return 'high';
  if (lower.includes('problem') || lower.includes('issue') || lower.includes('broken')) return 'medium';
  return 'low';
};

/**
 * Create a support ticket from a conversation.
 */
export const createTicket = async ({
  tenantId,
  conversationId,
  channel = 'chat',
  customerName = 'Unknown',
  customerPhone = '',
  customerEmail = '',
  transcript = '',
  escalationReason = '',
  metadata = {},
}) => {
  const priority = detectPriority(transcript + ' ' + escalationReason);

  const ticket = await Ticket.create({
    tenantId,
    conversationId,
    channel,
    customerName,
    customerPhone,
    customerEmail,
    subject: `Escalated: ${escalationReason || 'Customer requested human agent'}`,
    transcript,
    priority,
    status: 'open',
    escalationReason,
    metadata,
  });

  return ticket;
};

/**
 * List all tickets for a tenant.
 */
export const listTicketsForTenant = async (tenantId) =>
  Ticket.find({ tenantId }).sort({ createdAt: -1 });

/**
 * Update ticket status.
 */
export const updateTicketStatus = async (ticketId, status) =>
  Ticket.findByIdAndUpdate(ticketId, { status }, { new: true });
