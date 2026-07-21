// ============================================================================
// SPRINTHUB - Role Middleware
// 3 sistemske role: ADMIN, MODERATOR, USER
// ============================================================================

/**
 * Middleware that checks if the user has a specific system role
 * - ADMIN: Full access to everything
 * - MODERATOR: Can edit others' workspaces
 * - USER: Only own workspaces
 */
export function requireRole(role) {
  return (req, res, next) => {
    const user = req.user;

    if (!user || user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}

/**
 * Middleware that checks if the user has one of the allowed roles
 */
export function requireOneOfRoles(...roles) {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}
