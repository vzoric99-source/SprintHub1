import { Router } from 'express';
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  cleanupOldNotifications,
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validateParamId, validatePagination } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications
 *     description: Returns a paginated list of notifications for the current user, sorted by creation date (newest first). Includes unread count.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 unreadCount:
 *                   type: integer
 *                   description: Total number of unread notifications
 *       401:
 *         description: Not authenticated
 */
router.get('/', validatePagination, listNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     description: Marks all unread notifications for the current user as read.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *       401:
 *         description: Not authenticated
 */
router.patch('/read-all', markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     description: Marks a single notification as read. Users can only mark their own notifications.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       403:
 *         description: No access to notification
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Not authenticated
 */
router.patch('/:id/read', validateParamId, markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 *     description: Deletes a notification by ID. Users can only delete their own notifications.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification deleted
 *       403:
 *         description: No access to notification
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Not authenticated
 */
router.delete('/:id', validateParamId, deleteNotification);

/**
 * @swagger
 * /api/notifications/cleanup:
 *   delete:
 *     tags: [Notifications]
 *     summary: Cleanup old notifications
 *     description: Deletes read notifications older than 90 days. Admin only.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Old notifications cleaned up
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin access required
 */
router.delete('/cleanup/old', requireRole('ADMIN'), cleanupOldNotifications);

export default router;
