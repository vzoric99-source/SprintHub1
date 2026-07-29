// ============================================================================
// SPRINTHUB - User Controller
// User management and role administration
// ============================================================================

import prisma from '../config/database.js';

// ============================================================================
// LIST USERS (for dropdown - available to all logged-in users)
// ============================================================================
export async function listUsersForDropdown(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    });

    return res.json(users);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// LIST ALL USERS (full list - ADMIN only)
// ============================================================================
export async function listUsers(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const q = req.query.q || '';

    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              workspaces: true,
              createdTickets: true,
              assignedTickets: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      items: users,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// GET USER BY ID (ADMIN only)
// ============================================================================
export async function getUserById(req, res) {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            workspaces: true,
            createdTickets: true,
            assignedTickets: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// UPDATE USER ROLE (ADMIN only)
// ============================================================================
export async function updateUserRole(req, res) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;
    const currentUserId = req.user.id;

    // Role validation
    const validRoles = ['USER', 'MODERATOR', 'ADMIN'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent user from changing own role
    if (id === currentUserId) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    // Update role
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// DELETE USER (ADMIN only)
// ============================================================================
export async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    const currentUserId = req.user.id;

    // Prevent self-deletion
    if (id === currentUserId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const workspaceCount = await prisma.workspace.count({ where: { createdById: id } });
    if (workspaceCount > 0) {
      return res.status(400).json({
        message: `Cannot delete user. User owns ${workspaceCount} workspace(s). Transfer ownership first.`
      });
    }

    await prisma.user.delete({ where: { id } });

    return res.json({ message: 'User deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}
