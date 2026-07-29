// ============================================================================
// SPRINTHUB - Ticket Controller
// CRUD operations for tickets with Kanban move logic
// Auto-generation of ticket codes (WS1-001, WS1-002...)
// ============================================================================

import prisma from '../config/database.js';
import { createNotification } from './notification.controller.js';
import { sendTicketAssignedEmail } from '../config/email.js';

// ============================================================================
// HELPER - Generate ticket code (atomic, inside transaction to avoid race conditions)
// ============================================================================
async function generateTicketCode(workspaceId, tx) {
  const db = tx || prisma;
  const lastTicket = await db.ticket.findFirst({
    where: {
      stage: {
        sprint: {
          workspaceId,
        },
      },
    },
    orderBy: { id: 'desc' },
    select: { code: true },
  });

  let nextNum = 1;
  if (lastTicket?.code) {
    const match = lastTicket.code.match(/-(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `WS${workspaceId}-${String(nextNum).padStart(3, '0')}`;
}

// ============================================================================
// HELPER - Check ticket access through stage/sprint
// ============================================================================
async function checkTicketAccess(ticketId, userId, userRole) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      stage: {
        include: {
          sprint: {
            include: {
              workspace: true,
            },
          },
        },
      },
    },
  });

  if (!ticket) {
    return { error: 'Ticket not found', status: 404 };
  }

  const workspace = ticket.stage.sprint.workspace;

  if (
    userRole === 'ADMIN' ||
    userRole === 'MODERATOR' ||
    workspace.createdById === userId ||
    ticket.createdById === userId ||
    ticket.assigneeId === userId
  ) {
    return { ticket };
  }

  return { error: 'Access denied', status: 403 };
}

// ============================================================================
// LIST TICKETS
// ============================================================================
export async function listTickets(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const { q, priority, type, stageId, sprintId, workspaceId, dueDate, assignedToMe, hasDueDate } = req.query;

    const workspaceAccess =
      userRole === 'ADMIN' || userRole === 'MODERATOR'
        ? {}
        : { stage: { sprint: { workspace: { createdById: userId } } } };

    const where = {
      ...workspaceAccess,
      ...(assignedToMe === 'true' ? { assigneeId: userId } : {}),
      ...(hasDueDate === 'true' ? { dueDate: { not: null } } : {}),
      ...(q
        ? {
            OR: [{ title: { contains: q } }, { description: { contains: q } }],
          }
        : {}),
      ...(priority ? { priority } : {}),
      ...(type ? { type } : {}),
      ...(stageId ? { stageId: Number(stageId) } : {}),
      ...(sprintId ? { stage: { sprintId: Number(sprintId) } } : {}),
      ...(workspaceId ? { stage: { sprint: { workspaceId: Number(workspaceId) } } } : {}),
      ...(dueDate === 'overdue' ? { dueDate: { lt: new Date() } } : {}),
      ...(dueDate === 'today'
        ? {
            dueDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          }
        : {}),
      ...(dueDate === 'week'
        ? {
            dueDate: {
              gte: new Date(),
              lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          stage: {
            select: { id: true, name: true, color: true, sprintId: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          assignee: {
            select: { id: true, name: true },
          },
          tag: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ticket.count({ where }),
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
// GET TICKET BY ID
// ============================================================================
export async function getTicket(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const access = await checkTicketAccess(id, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        stage: {
          include: {
            sprint: {
              include: {
                workspace: {
                  select: { id: true, name: true, icon: true },
                },
              },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        tag: true,
      },
    });

    return res.json(ticket);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// CREATE TICKET
// ============================================================================
export async function createTicket(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const {
      title,
      description,
      stageId,
      type = 'TASK',
      priority = 'MEDIUM',
      dueDate,
      estimatedHours,
      assigneeId,
      tagId,
    } = req.body;

    if (!title || !stageId) {
      return res.status(400).json({ message: 'Title and stageId are required' });
    }

    const stage = await prisma.stage.findUnique({
      where: { id: Number(stageId) },
      include: {
        sprint: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!stage) {
      return res.status(404).json({ message: 'Stage not found' });
    }

    const workspace = stage.sprint.workspace;

    if (userRole !== 'ADMIN' && userRole !== 'MODERATOR' && workspace.createdById !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Atomička transakcija - sprečava race condition pri generisanju koda
    const ticket = await prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({
        where: { stageId: Number(stageId) },
        data: { position: { increment: 1 } },
      });

      const code = await generateTicketCode(workspace.id, tx);

      return tx.ticket.create({
        data: {
          code,
          title,
          description: description || null,
          type,
          stageId: Number(stageId),
          position: 0,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          estimatedHours: estimatedHours ? Number(estimatedHours) : null,
          createdById: userId,
          assigneeId: assigneeId ? Number(assigneeId) : null,
          tagId: tagId ? Number(tagId) : null,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          tag: true,
        },
      });
    });

    if (assigneeId && Number(assigneeId) !== userId) {
      const assigneeUser = await prisma.user.findUnique({
        where: { id: Number(assigneeId) },
        select: { id: true, name: true, email: true },
      });

      if (assigneeUser) {
        const workspaceName = workspace.name;

        await createNotification({
          userId: assigneeUser.id,
          type: 'TICKET_ASSIGNED',
          title: 'New ticket assigned',
          message: `You have been assigned ticket "${ticket.code} - ${ticket.title}" in workspace ${workspaceName}`,
          link: `/sprints/${stage.sprint.id}`,
        });

        await sendTicketAssignedEmail({
          to: assigneeUser.email,
          ticketTitle: `${ticket.code} - ${ticket.title}`,
          workspaceName,
          assignedBy: req.user.name,
          sprintLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/sprints/${stage.sprint.id}`,
        });
      }
    }

    return res.status(201).json(ticket);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// UPDATE TICKET
// ============================================================================
export async function updateTicket(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { title, description, type, priority, dueDate, estimatedHours, assigneeId, tagId } = req.body;

    const access = await checkTicketAccess(id, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const oldAssigneeId = access.ticket?.assigneeId;

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(estimatedHours !== undefined ? { estimatedHours: estimatedHours ? Number(estimatedHours) : null } : {}),
        ...(assigneeId !== undefined ? { assigneeId: assigneeId ? Number(assigneeId) : null } : {}),
        ...(tagId !== undefined ? { tagId: tagId ? Number(tagId) : null } : {}),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        tag: true,
        stage: {
          include: {
            sprint: {
              include: {
                workspace: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    const newAssigneeId = assigneeId !== undefined ? (assigneeId ? Number(assigneeId) : null) : oldAssigneeId;
    if (newAssigneeId && newAssigneeId !== oldAssigneeId && newAssigneeId !== userId) {
      const assigneeUser = await prisma.user.findUnique({
        where: { id: newAssigneeId },
        select: { id: true, name: true, email: true },
      });

      if (assigneeUser) {
        const workspaceName = ticket.stage.sprint.workspace.name;

        await createNotification({
          userId: assigneeUser.id,
          type: 'TICKET_ASSIGNED',
          title: 'New ticket assigned',
          message: `You have been assigned ticket "${ticket.code} - ${ticket.title}" in workspace ${workspaceName}`,
          link: `/sprints/${ticket.stage.sprint.id}`,
        });

        await sendTicketAssignedEmail({
          to: assigneeUser.email,
          ticketTitle: `${ticket.code} - ${ticket.title}`,
          workspaceName,
          assignedBy: req.user.name,
          sprintLink: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/sprints/${ticket.stage.sprint.id}`,
        });
      }
    }

    const { stage: _stage, ...ticketWithoutStage } = ticket;
    return res.json(ticketWithoutStage);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// DELETE TICKET
// ============================================================================
export async function deleteTicket(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const access = await checkTicketAccess(id, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const ticket = access.ticket;

    await prisma.ticket.delete({ where: { id } });

    await prisma.ticket.updateMany({
      where: { stageId: ticket.stageId, position: { gt: ticket.position } },
      data: { position: { decrement: 1 } },
    });

    return res.json({ message: 'Ticket deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// MOVE TICKET (Kanban drag & drop)
// ============================================================================
export async function moveTicket(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { stageId, position } = req.body;

    if (stageId === undefined || position === undefined) {
      return res.status(400).json({ message: 'stageId and position are required' });
    }

    const access = await checkTicketAccess(id, userId, userRole);
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const ticket = access.ticket;
    const oldStageId = ticket.stageId;
    const oldPosition = ticket.position;
    const newStageId = Number(stageId);
    const newPosition = Number(position);

    await prisma.$transaction(async (tx) => {
      if (oldStageId === newStageId) {
        if (oldPosition < newPosition) {
          await tx.ticket.updateMany({
            where: {
              stageId: oldStageId,
              position: { gt: oldPosition, lte: newPosition },
            },
            data: { position: { decrement: 1 } },
          });
        } else if (oldPosition > newPosition) {
          await tx.ticket.updateMany({
            where: {
              stageId: oldStageId,
              position: { gte: newPosition, lt: oldPosition },
            },
            data: { position: { increment: 1 } },
          });
        }
      } else {
        await tx.ticket.updateMany({
          where: {
            stageId: oldStageId,
            position: { gt: oldPosition },
          },
          data: { position: { decrement: 1 } },
        });

        await tx.ticket.updateMany({
          where: {
            stageId: newStageId,
            position: { gte: newPosition },
          },
          data: { position: { increment: 1 } },
        });
      }

      await tx.ticket.update({
        where: { id },
        data: {
          stageId: newStageId,
          position: newPosition,
        },
      });
    });

    const updatedTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        tag: true,
      },
    });

    return res.json(updatedTicket);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}
