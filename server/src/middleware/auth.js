//   Import JWT token library for authentication.
import jwt from 'jsonwebtoken';
//   Import environment variables from .env file.
import { env } from '../config/env.js';
//   Import Prisma database client (singleton instance).
import prisma from '../config/database.js';

//   signToken(payload): create a signed JWT token from user data.
//    - payload: usually { id, role } - minimum info to identify the user later.
//    - env.JWT_SECRET: secret key used to sign the token (MUST exist).
//    - expiresIn: how long the token is valid (e.g. '7d' = 7 days).
export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

//   setAuthCookie(res, token): store JWT token in an HTTP-only cookie.
//    - httpOnly: true - JavaScript in the browser CANNOT read it (more secure).
//    - secure: HTTPS only in production.
//    - sameSite: 'none' in production (for cross-origin), otherwise 'lax'.
//    - maxAge: cookie lifetime (~7 days).
export function setAuthCookie(res, token) {
  const isProd = env.NODE_ENV === 'production';
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

//   clearAuthCookie(res): delete the auth cookie - user is logged out.
//    - Uses the same security options as when setting.
export function clearAuthCookie(res) {
  const isProd = env.NODE_ENV === 'production';
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
}

//   requireAuth: middleware that checks if the user is authenticated.
//    STEPS:
//    1) Try to find the token in the cookie.
//    2) If not found, check the Authorization header (format: "Bearer TOKEN").
//    3) If not there either, return 401 (Unauthorized).
//    4) If token found, verify it is valid and signed with our secret (verify).
//    5) If valid, fetch the user from the database and attach to req.user.
//    6) Call next() - pass to the next route handler. Otherwise return 401.
export async function requireAuth(req, res, next) {
  try {
    //   1) Get token from auth cookie (if it exists).
    let token = req.cookies?.[env.COOKIE_NAME];

    //   2) If not in cookie, check Authorization header (Bearer TOKEN).
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    //   If we still have no token - user is not authenticated.
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    //   Verify the token: check if it is valid and signed with our JWT_SECRET.
    const decoded = jwt.verify(token, env.JWT_SECRET);

    //   Using decoded.id (which we put in the token), find the user.
    //    Return only the fields needed for the application.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    //   If no such user exists in the database - treat as unauthorized.
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    //   Attach user to req.user so downstream routes know who the user is.
    req.user = user;

    //   All OK - pass to the next handler/route.
    next();
  } catch (e) {
    //   If verification fails or something goes wrong - return 401 Unauthorized.
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
