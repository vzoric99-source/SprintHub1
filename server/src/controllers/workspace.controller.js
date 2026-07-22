// ============================================================================
// SPRINTHUB - Workspace Controller
// CRUD operations for workspaces
// Access based on createdById and system role (ADMIN, MODERATOR, USER)
// ============================================================================

import prisma from '../config/database.js';

// ============================================================================
// LIST WORKSPACES
// ============================================================================
export async function listWorkspaces(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 12));
    const q = req.query.q || '';

    const where = {
      ...(userRole === 'ADMIN' || userRole === 'MODERATOR' ? {} : { createdById: userId }),
      ...(q ? { name: { contains: q } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { sprints: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.workspace.count({ where }),
    ]);

    return res.json({
      items,
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
// GET WORKSPACE BY ID
// ============================================================================
export async function getWorkspace(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        sprints: {
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR' && workspace.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(workspace);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// CREATE WORKSPACE
// ============================================================================
export async function createWorkspace(req, res) {
  try {
    const { name, description, icon } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description: description || null,
        icon: icon || '#6366f1',
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json(workspace);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// UPDATE WORKSPACE
// ============================================================================
export async function updateWorkspace(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, description, icon } = req.body;

    const existing = await prisma.workspace.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR' && existing.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(icon !== undefined ? { icon } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { sprints: true },
        },
      },
    });

    return res.json(workspace);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// DELETE WORKSPACE
// ============================================================================
export async function deleteWorkspace(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const existing = await prisma.workspace.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    if (userRole !== 'ADMIN' && existing.createdById !== userId) {
      return res.status(403).json({ message: 'Only owner can delete workspace' });
    }

    await prisma.workspace.delete({ where: { id } });

    return res.json({ message: 'Workspace deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}
