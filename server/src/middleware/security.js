import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Helmet — HTTP security headers (XSS, clickjacking, MIME sniffing, etc.)
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// General rate limiter — 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

// Auth rate limiter — stricter: 15 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later' },
});

// HPP — HTTP Parameter Pollution protection
export const hppMiddleware = hpp();

// CSRF protection — double-submit cookie pattern
// Generates a CSRF token, sets it in a readable cookie, and validates
// it on state-changing requests (POST, PUT, PATCH, DELETE)
export function csrfToken(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const isProd = env.NODE_ENV === 'production';
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });
  return res.json({ csrfToken: token });
}

export function csrfProtection(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();

  // Auth routes use JWT, not session cookies - CSRF protection is not needed
  if (req.path.startsWith('/auth/')) return next();

  const cookieToken = req.cookies?.['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Invalid or missing CSRF token' });
  }

  next();
}

// Input sanitizer — strips HTML tags and trims strings recursively
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  return value;
}

function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeValue(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      clean[key] = sanitizeObject(value);
    }
    return clean;
  }
  return obj;
}

export function sanitizeInput(req, _res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeObject(req.query[key]);
    }
  }
  if (req.params) {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeObject(req.params[key]);
    }
  }
  next();
}
