// Import bcrypt - used to hash passwords before storing in the database.
// Never store the actual (readable) password in the database, that is unsafe.
import bcrypt from 'bcryptjs';

// Import Prisma database client (singleton instance).
import prisma from '../config/database.js';

// Import authentication helper functions (token creation and login cookies).
// signToken - creates a JWT token (access pass)
// setAuthCookie - stores that token in a browser cookie (to keep you logged in)
// clearAuthCookie - deletes the cookie (logs you out)
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from '../middleware/auth.js';

// REGISTER NEW USER
// Route: POST /api/auth/register
// What it does: receives name, email and password; checks if email already exists; if not, creates the user,
// hashes the password, sets the role (USER or ADMIN), and immediately logs the user in (returns token + cookie).
export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body; // Extract data sent by the client (frontend).

    // Validation: if required fields are missing, return 400 error (bad request).
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }

    // Email format validation - must contain @
    if (!email.includes('@')) {
      return res
        .status(400)
        .json({ message: 'Invalid email format - must contain @' });
    }

    // Password complexity validation
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 8 characters' });
    }

    if (!/[A-Z]/.test(password)) {
      return res
        .status(400)
        .json({ message: 'Password must contain at least one uppercase letter' });
    }

    if (!/[0-9]/.test(password)) {
      return res
        .status(400)
        .json({ message: 'Password must contain at least one number' });
    }

    // To avoid duplicate accounts: check if a user with this email already exists.
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists)
      return res.status(409).json({ message: 'Email already in use' }); // 409 = conflict (already exists)

    // Create password HASH - this is what we store in the database instead of the actual password.
    const hash = await bcrypt.hash(password, 10); // “10” is the hashing strength (sufficient for dev)

    // Create user in the database. Role is “ADMIN” only if role is exactly 'ADMIN', otherwise “USER”.
    // select: choose which fields to return to the client (never return the password!).
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Auto-login after registration:
    // Create a JWT token with the user's ID and role,
    // and store it in a cookie (setAuthCookie) - the user is immediately logged in.
    const token = signToken({ id: user.id, role: user.role });
    setAuthCookie(res, token);

    // Return 201 (created) + user data and token.
    return res.status(201).json({ user, token });
  } catch (e) {
    console.error(e); // If something breaks, log to console for diagnostics.
    return res.status(500).json({ message: 'Server error' }); // 500 = server error
  }
}

// LOGIN EXISTING USER
// Route: POST /api/auth/login
// What it does: checks if a user exists by email, compares password with the hash,
// if correct - creates a token, sets a cookie, returns the data.
export async function login(req, res) {
  try {
    const { email, password } = req.body; // Extract credentials entered by the user.
    if (!email || !password)
      return res
        .status(400)
        .json({ message: 'Email and password are required' }); // Both fields are required to log in.

    // Look up user by email.
    const userFound = await prisma.user.findUnique({ where: { email } });
    if (!userFound)
      return res.status(401).json({ message: 'Invalid credentials' }); // 401 = wrong email/password

    // Compare the entered password (plain) with the hashed password from the database.
    const ok = await bcrypt.compare(password, userFound.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' }); // If it doesn't match - no access.

    // Prepare clean user data for the response (without password).
    const user = {
      id: userFound.id,
      name: userFound.name,
      email: userFound.email,
      role: userFound.role,
      createdAt: userFound.createdAt,
    };

    // Create a JWT token (containing id and role),
    // and set it in a cookie (to stay logged in).
    const token = signToken({ id: user.id, role: user.role });
    setAuthCookie(res, token);

    // Return user and token as JSON.
    return res.json({ user, token });
  } catch (e) {
    console.error(e); // Log the error on the server.
    return res.status(500).json({ message: 'Server error' }); // Return error message to the client.
  }
}

// USER LOGOUT
// Route: POST /api/auth/logout
// What it does: deletes the auth cookie (token) - effectively “forgets” you as a logged-in user.
export async function logout(_req, res) {
  try {
    clearAuthCookie(res); // Delete the cookie containing the token.
    return res.json({ message: 'Logged out' }); // Confirmation that logout was successful.
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// RETURN DATA ABOUT THE CURRENTLY LOGGED-IN USER
// Route: GET /api/auth/me
// Note: req.user is populated by the requireAuth middleware (it reads the token from the cookie,
// verifies it, and injects user data into req.user).
export async function me(req, res) {
  // req.user is set by the requireAuth middleware
  return res.json(req.user); // Simply forward it back to the client.
}
