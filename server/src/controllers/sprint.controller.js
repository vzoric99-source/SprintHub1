// ============================================================================
// SPRINTHUB - Sprint Controller
// CRUD operations for sprints with lifecycle management
// Status: PLANNING -> ACTIVE -> COMPLETED
// ============================================================================

import prisma from '../config/database.js';
import { createNotification } from './notification.controller.js';

const DEFAULT_STAGES = [
  { name: 'Backlog', position: 0, color: '#6b7280' },
  { name: 'In Progress', position: 1, color: '#3b82f6' },
  { name: 'Review', position: 2, color: '#f59e0b' },
  { name: 'Done', position: 3, color: '#22c55e' },
];

// ============================================================================
// HELPER - Check workspace access
// ============================================================================
async function checkWorkspaceAccess(workspaceId, userId, userRole) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return { error: 'Workspace not found', status: 404 };
  }

  if (userRole === 'ADMIN' || userRole === 'MODERATOR' || workspace.createdById === userId) {
    return { workspace };
  }

  return { error: 'Access denied', status: 403 };
}

// ============================================================================
// LIST SPRINTS (for workspace)
// ============================================================================
export async function listSprints(req, res) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const userId = req.user.id;
    const userRole = req.user.role;

    const access = await checkWorkspaceAccess(workspaceId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const sprints = await prisma.sprint.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { stages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(sprints);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// GET SPRINT BY ID (with stages and tickets)
// ============================================================================
export async function getSprint(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            tags: {
              orderBy: { name: 'asc' },
            },
          },
        },
        stages: {
          orderBy: { position: 'asc' },
          include: {
            tickets: {
              orderBy: { position: 'asc' },
              include: {
                createdBy: {
                  select: { id: true, name: true },
                },
                assignee: {
                  select: { id: true, name: true },
                },
                tag: true,
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const workspace = sprint.workspace;
    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR' && workspace.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(sprint);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// CREATE SPRINT
// ============================================================================
export async function createSprint(req, res) {
  try {
    const workspaceId = Number(req.params.workspaceId);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, goal, startDate, endDate, createDefaultStages = true } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Sprint name is required' });
    }

    const access = await checkWorkspaceAccess(workspaceId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal: goal || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PLANNING',
        workspaceId,
        ...(createDefaultStages
          ? {
              stages: {
                create: DEFAULT_STAGES,
              },
            }
          : {}),
      },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return res.status(201).json(sprint);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// UPDATE SPRINT
// ============================================================================
export async function updateSprint(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, goal, startDate, endDate } = req.body;

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { workspace: true },
    });

    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const workspace = sprint.workspace;
    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR' && workspace.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await prisma.sprint.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(goal !== undefined ? { goal } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// UPDATE SPRINT STATUS (PLANNING -> ACTIVE -> COMPLETED)
// ============================================================================
export async function updateSprintStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status } = req.body;

    const validStatuses = ['PLANNING', 'ACTIVE', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { workspace: true },
    });

    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const workspace = sprint.workspace;
    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR' && workspace.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const validTransitions = {
      PLANNING: ['ACTIVE'],
      ACTIVE: ['COMPLETED'],
      COMPLETED: ['PLANNING'],
    };

    if (!validTransitions[sprint.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${sprint.status} to ${status}`,
      });
    }

    const updated = await prisma.sprint.update({
      where: { id },
      data: { status },
    });

    if (status === 'ACTIVE') {
      await createNotification({
        userId: workspace.createdById,
        type: 'SPRINT_STARTED',
        title: 'Sprint started',
        message: `Sprint "${sprint.name}" has been started in workspace ${workspace.name}`,
        link: `/sprints/${id}`,
      });
    }

    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// DELETE SPRINT
// ============================================================================
export async function deleteSprint(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: { workspace: true },
    });

    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    const workspace = sprint.workspace;
    if (userRole !== 'ADMIN' && workspace.createdById !== userId) {
      return res.status(403).json({ message: 'Only owner can delete sprints' });
    }

    await prisma.sprint.delete({ where: { id } });

    return res.json({ message: 'Sprint deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}
