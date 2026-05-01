import Ticket from '../models/TicketModel.js';
import Conversation from '../models/ConversationModel.js';
import Message from '../models/MessageModel.js';

/**
 * Aggregates analytics data for a specific tenant.
 * @param {string} tenantId - The ObjectId of the tenant
 * @returns {Promise<Object>}
 */
export const getTenantAnalytics = async (tenantId) => {
  // 1. Channel Distribution (Calls vs Chats)
  const channelStats = await Ticket.aggregate([
    { $match: { tenantId } },
    { $group: { _id: '$channel', count: { $sum: 1 } } }
  ]);

  const channels = {
    phone: channelStats.find(c => c._id === 'phone' || c._id === 'voice')?.count || 0,
    chat: channelStats.find(c => c._id === 'chat')?.count || 0
  };

  // 2. Resolution Rate (Conversations that didn't become tickets)
  const totalConversations = await Conversation.countDocuments({ tenantId });
  const totalTickets = await Ticket.countDocuments({ tenantId });
  
  // If we have 100 chats and only 20 tickets, resolution rate is 80%
  const resolutionRate = totalConversations > 0 
    ? Math.round(((totalConversations - totalTickets) / totalConversations) * 100) 
    : 100;

  // 3. Activity over time (Last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailyActivity = await Conversation.aggregate([
    { $match: { tenantId, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        chats: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 4. Ticket Status distribution
  const ticketStatus = await Ticket.aggregate([
    { $match: { tenantId } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // 5. Mock "Top Questions" (In a real app, we would use NLP or track KB hits)
  const topQuestions = [
    { name: 'Pricing Plans', value: 45 },
    { name: 'API Documentation', value: 32 },
    { name: 'Refund Policy', value: 18 },
    { name: 'Account Setup', value: 12 },
    { name: 'Voice Setup', value: 9 }
  ];

  return {
    overview: {
      totalConversations,
      totalTickets,
      resolutionRate,
      activeUsers: Math.round(totalConversations * 0.8) // Mocked active users
    },
    distribution: [
      { name: 'Phone', value: channels.phone },
      { name: 'Chat', value: channels.chat }
    ],
    trends: dailyActivity.map(d => ({ date: d._id, chats: d.chats })),
    tickets: ticketStatus.map(s => ({ status: s._id, count: s.count })),
    topQuestions
  };
};
