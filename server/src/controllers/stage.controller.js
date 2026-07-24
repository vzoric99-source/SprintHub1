// ============================================================================
// SPRINTHUB - Stage Controller
// CRUD operations for stages (phases) on sprint board
// ============================================================================

import prisma from '../config/database.js';

// ============================================================================
// HELPER - Check sprint access
// ============================================================================
async function checkSprintAccess(sprintId, userId, userRole) {
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: {
      workspace: true,
    },
  });

  if (!sprint) {
    return { error: 'Sprint not found', status: 404 };
  }

  const workspace = sprint.workspace;

  if (userRole === 'ADMIN' || userRole === 'MODERATOR' || workspace.createdById === userId) {
    return { sprint };
  }

  return { error: 'Access denied', status: 403 };
}

// ============================================================================
// LIST STAGES (for sprint)
// ============================================================================
export async function listStages(req, res) {
  try {
    const sprintId = Number(req.params.sprintId);
    const userId = req.user.id;
    const userRole = req.user.role;

    const access = await checkSprintAccess(sprintId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const stages = await prisma.stage.findMany({
      where: { sprintId },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { position: 'asc' },
    });

    return res.json(stages);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// CREATE STAGE
// ============================================================================
export async function createStage(req, res) {
  try {
    const sprintId = Number(req.params.sprintId);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, color = '#6b7280' } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Stage name is required' });
    }

    const access = await checkSprintAccess(sprintId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const lastStage = await prisma.stage.findFirst({
      where: { sprintId },
      orderBy: { position: 'desc' },
    });

    const position = lastStage ? lastStage.position + 1 : 0;

    const stage = await prisma.stage.create({
      data: {
        name,
        color,
        position,
        sprintId,
      },
    });

    return res.status(201).json(stage);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// UPDATE STAGE
// ============================================================================
export async function updateStage(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, color } = req.body;

    const stage = await prisma.stage.findUnique({
      where: { id },
    });

    if (!stage) {
      return res.status(404).json({ message: 'Stage not found' });
    }

    const access = await checkSprintAccess(stage.sprintId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const updated = await prisma.stage.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(color !== undefined ? { color } : {}),
      },
    });

    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// DELETE STAGE
// ============================================================================
export async function deleteStage(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const stage = await prisma.stage.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });

    if (!stage) {
      return res.status(404).json({ message: 'Stage not found' });
    }

    const access = await checkSprintAccess(stage.sprintId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    await prisma.stage.delete({ where: { id } });

    await prisma.stage.updateMany({
      where: { sprintId: stage.sprintId, position: { gt: stage.position } },
      data: { position: { decrement: 1 } },
    });

    return res.json({ message: 'Stage deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// REORDER STAGES
// ============================================================================
export async function reorderStages(req, res) {
  try {
    const sprintId = Number(req.params.sprintId);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { stageIds } = req.body;

    if (!Array.isArray(stageIds)) {
      return res.status(400).json({ message: 'stageIds must be an array' });
    }

    const access = await checkSprintAccess(sprintId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    await prisma.$transaction(
      stageIds.map((stageId, index) =>
        prisma.stage.update({
          where: { id: stageId },
          data: { position: index },
        })
      )
    );

    const stages = await prisma.stage.findMany({
      where: { sprintId },
      orderBy: { position: 'asc' },
    });

    return res.json(stages);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}
