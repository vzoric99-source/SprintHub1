// ============================================================================
// SPRINTHUB - Tag Controller
// CRUD operations for tags/ticket categories
// ============================================================================

import prisma from '../config/database.js';

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
// LIST TAGS (for workspace)
// ============================================================================
export async function listTags(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const workspaceId = Number(req.query.workspaceId);

    if (!workspaceId) {
      return res.status(400).json({ message: 'workspaceId is required' });
    }

    const access = await checkWorkspaceAccess(workspaceId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const tags = await prisma.tag.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json(tags);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// CREATE TAG
// ============================================================================
export async function createTag(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, color, workspaceId } = req.body;

    if (!name || !workspaceId) {
      return res.status(400).json({ message: 'Name and workspaceId are required' });
    }

    const access = await checkWorkspaceAccess(Number(workspaceId), userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || '#6b7280',
        workspaceId: Number(workspaceId),
      },
    });

    return res.status(201).json(tag);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ message: 'Tag with this name already exists in this workspace' });
    }
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// UPDATE TAG
// ============================================================================
export async function updateTag(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { name, color } = req.body;

    const tag = await prisma.tag.findUnique({ where: { id } });

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    const access = await checkWorkspaceAccess(tag.workspaceId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(color !== undefined ? { color } : {}),
      },
    });

    return res.json(updated);
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ message: 'Tag with this name already exists in this workspace' });
    }
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// DELETE TAG
// ============================================================================
export async function deleteTag(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const force = req.query.force === 'true';

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    const access = await checkWorkspaceAccess(tag.workspaceId, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const ticketCount = tag._count.tickets;
    if (ticketCount > 0 && !force) {
      return res.status(409).json({
        message: `Tag is used on ${ticketCount} ticket${ticketCount === 1 ? '' : 's'}. Are you sure?`,
        ticketCount,
        requiresConfirmation: true,
      });
    }

    await prisma.ticket.updateMany({
      where: { tagId: id },
      data: { tagId: null },
    });

    await prisma.tag.delete({ where: { id } });

    return res.json({ message: 'Tag deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}
