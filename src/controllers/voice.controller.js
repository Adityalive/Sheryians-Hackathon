import multer from 'multer';
import { transcribeAudio } from '../services/stt.service.js';
import { runChatGraph } from '../services/chatGraph.service.js';
import { buildSpeakTwiML, buildGreetingTwiML, buildEscalationTwiML } from '../services/tts.service.js';
import { getOrCreateTenant } from '../services/tenant.service.js';
import { detectEscalation, createTicket, listTicketsForTenant, updateTicketStatus } from '../services/ticket.service.js';
import { listMessagesForConversation } from '../services/message.service.js';

// Multer setup for audio file uploads (stores in memory, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export const uploadMiddleware = upload.single('audio');

// ─────────────────────────────────────────
// WEB WIDGET: Transcribe audio → return text
// ─────────────────────────────────────────
export const transcribeAudioController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file provided' });
    }

    const { buffer, mimetype } = req.file;
    const transcript = await transcribeAudio(buffer, mimetype);

    return res.json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// TWILIO PHONE: Incoming call webhook
// ─────────────────────────────────────────
export const handleIncomingCall = async (req, res) => {
  try {
    const { tenantId } = req.query; // e.g., /api/voice/twilio/incoming?tenantId=your-slug
    const tenant = await getOrCreateTenant({ tenantId: tenantId || 'default' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const processUrl = `${baseUrl}/api/voice/twilio/process?tenantId=${tenant.slug || tenant._id}`;

    res.set('Content-Type', 'text/xml');
    res.send(buildGreetingTwiML(tenant.name, processUrl));
  } catch (error) {
    console.error('Incoming call error:', error.message);
    const twiml = '<Response><Say>Sorry, there was an error. Please try again later.</Say></Response>';
    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  }
};

// ─────────────────────────────────────────
// TWILIO PHONE: Process customer speech → AI reply
// ─────────────────────────────────────────
export const processPhoneMessage = async (req, res) => {
  try {
    const { tenantId } = req.query;
    const { SpeechResult, From, CallSid } = req.body;

    if (!SpeechResult) {
      const twiml = `<Response><Say>I'm sorry, I didn't catch that. Could you please repeat?</Say></Response>`;
      res.set('Content-Type', 'text/xml');
      return res.send(twiml);
    }

    const tenant = await getOrCreateTenant({ tenantId: tenantId || 'default' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const processUrl = `${baseUrl}/api/voice/twilio/process?tenantId=${tenant.slug || tenant._id}`;

    // Check for escalation
    if (detectEscalation(SpeechResult)) {
      await createTicket({
        tenantId: tenant._id,
        conversationId: CallSid, // Use CallSid as a reference
        channel: 'phone',
        customerPhone: From || 'Unknown',
        customerName: 'Phone Caller',
        transcript: SpeechResult,
        escalationReason: SpeechResult,
        metadata: { callSid: CallSid, from: From },
      });

      res.set('Content-Type', 'text/xml');
      return res.send(buildEscalationTwiML());
    }

    // Process through AI
    const result = await runChatGraph({
      tenantInput: { tenantId },
      sessionId: CallSid,
      message: SpeechResult,
      customerName: 'Phone Caller',
      channel: 'voice',
      metadata: { callSid: CallSid, customerPhone: From },
    });

    const aiReply = result.assistantMessage?.content || "I'm sorry, I couldn't process that. Could you please try again?";

    res.set('Content-Type', 'text/xml');
    res.send(buildSpeakTwiML(aiReply, processUrl));
  } catch (error) {
    console.error('Phone message processing error:', error.message);
    const twiml = `<Response><Say>I'm sorry, there was an error. Please try again.</Say></Response>`;
    res.set('Content-Type', 'text/xml');
    res.send(twiml);
  }
};

// ─────────────────────────────────────────
// MANUAL TICKETS: Create a ticket from the widget
// ─────────────────────────────────────────
export const createTicketController = async (req, res) => {
  try {
    const { tenantId, conversationId, channel, transcript, escalationReason, customerPhone, customerEmail } = req.body;
    
    const tenant = await getOrCreateTenant({ tenantId });
    
    const ticket = await createTicket({
      tenantId: tenant._id,
      conversationId,
      channel: channel || 'chat',
      transcript,
      escalationReason: escalationReason || 'Manual Escalation',
      customerPhone,
      customerEmail
    });

    return res.status(201).json({ success: true, ticket });
  } catch (error) {
    console.error('Manual ticket error:', error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// TICKET MANAGEMENT: List and update tickets
// ─────────────────────────────────────────
export const listTickets = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await getOrCreateTenant({ tenantId });
    const tickets = await listTicketsForTenant(tenant._id);
    return res.json({ tickets });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const resolveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    const ticket = await updateTicketStatus(ticketId, status || 'resolved');
    return res.json({ ticket });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
