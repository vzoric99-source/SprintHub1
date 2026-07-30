import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import {
  helmetMiddleware,
  generalLimiter,
  hppMiddleware,
  sanitizeInput,
  csrfToken,
  csrfProtection,
} from './middleware/security.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import sprintRoutes from './routes/sprint.routes.js';
import stageRoutes from './routes/stage.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import tagRoutes from './routes/tag.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Helmet — security headers (X-Content-Type-Options, X-Frame-Options, CSP, etc.)
app.use(helmetMiddleware);

// CORS — restrict to configured origin
const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-XSRF-TOKEN'],
}));

// Rate limiting — general (100 req / 15 min per IP)
app.use('/api/', generalLimiter);

// Body parsing with size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Cookie parser
app.use(cookieParser());

// HPP — HTTP Parameter Pollution protection
app.use(hppMiddleware);

// Input sanitization — strip HTML tags and XSS vectors from body/query/params
app.use(sanitizeInput);

// CSRF — double-submit cookie pattern
app.get('/api/csrf-token', csrfToken);
app.use('/api/', csrfProtection);

// Logger
app.use(morgan('dev'));

// ============================================================================
// SWAGGER API DOCS
// ============================================================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// ============================================================================
// ROUTES
// ============================================================================

app.get('/health', (_req, res) => res.json({ ok: true, app: 'SprintHub' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api', sprintRoutes);
app.use('/api', stageRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`SprintHub API running on http://localhost:${PORT}`);
});
