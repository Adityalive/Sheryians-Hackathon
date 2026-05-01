import { Router } from 'express';
import {
  transcribeAudioController,
  uploadMiddleware,
  handleIncomingCall,
  processPhoneMessage,
  listTickets,
  resolveTicket,
  createTicketController,
} from '../controllers/voice.controller.js';

const router = Router();

// ─── Web Widget Voice ───────────────────
// POST /api/voice/transcribe  — send audio blob, get text back
router.post('/transcribe', uploadMiddleware, transcribeAudioController);

// ─── Twilio Phone Call Webhooks ──────────
// POST /api/voice/twilio/incoming — Twilio calls this when a call arrives
router.post('/twilio/incoming', handleIncomingCall);

// POST /api/voice/twilio/process — Twilio sends each speech result here
router.post('/twilio/process', processPhoneMessage);

// ─── Ticket Management ───────────────────
// GET /api/voice/tenants/:tenantId/tickets
router.get('/tenants/:tenantId/tickets', listTickets);

// POST /api/voice/tickets — manual ticket creation
router.post('/tickets', createTicketController);

// PATCH /api/voice/tickets/:ticketId
router.patch('/tickets/:ticketId', resolveTicket);

export default router;
