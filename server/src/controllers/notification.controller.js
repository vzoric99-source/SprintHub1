// ============================================================================
// SPRINTHUB - Notification Controller
// CRUD operations for user notifications
// ============================================================================

import prisma from '../config/database.js';

// ============================================================================
// HELPER - Create notification (called from other controllers)
// ============================================================================
export async function createNotification({ userId, type, title, message, link }) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
      },
    });
    return notification;
  } catch (e) {
    console.error('[NOTIFICATION] Failed to create notification:', e.message);
    return null;
  }
}

// ============================================================================
// LIST NOTIFICATIONS (for current user, paginated)
// ============================================================================
export async function listNotifications(req, res) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where = { userId };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return res.json({
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      unreadCount,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// MARK AS READ (single notification)
// ============================================================================
export async function markAsRead(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    // Check if notification belongs to user
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// MARK ALL AS READ (all user notifications)
// ============================================================================
export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// CLEANUP OLD NOTIFICATIONS (brisanje notifikacija starijih od 90 dana)
// ============================================================================
export async function cleanupOldNotifications(req, res) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });

    return res.json({ message: `Cleaned up ${result.count} old notifications` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// ============================================================================
// DELETE NOTIFICATION (own only)
// ============================================================================
export async function deleteNotification(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    // Check if notification belongs to user
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.notification.delete({ where: { id } });

    return res.json({ message: 'Notification deleted' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
}
