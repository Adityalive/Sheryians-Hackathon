import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import voiceRoutes from './routes/voice.routes.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsMiddleware = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Id, X-Session-Id, X-Customer-Name');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
};

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Support backend is running',
    endpoints: {
      chat: '/api/chat/message',
      auth: '/api/auth/login',
      conversations: '/api/chat/conversations/:conversationId',
      tenants: '/api/tenants',
      widget: '/public/chat-widget.html',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/voice', voiceRoutes);

connectDB();

export default app;
