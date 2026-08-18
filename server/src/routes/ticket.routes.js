import { Router } from 'express';
import {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  moveTicket,
} from '../controllers/ticket.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCreateTicket, validateUpdateTicket, validateMoveTicket, validateParamId, validatePagination } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: List tickets
 *     description: Returns a paginated list of tickets with filters by priority, type, due date, etc.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by title and description
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TASK, BUG, FEATURE, IMPROVEMENT]
 *       - in: query
 *         name: stageId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sprintId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: workspaceId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: string
 *           enum: [overdue, today, week]
 *     responses:
 *       200:
 *         description: Paginated list of tickets
 */
router.get('/', validatePagination, listTickets);

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Create a new ticket
 *     description: Creates a new ticket in the specified stage. Automatically generates a ticket code (WS1-001).
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, stageId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               stageId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [TASK, BUG, FEATURE, IMPROVEMENT]
 *                 default: TASK
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedHours:
 *                 type: number
 *     responses:
 *       201:
 *         description: Ticket successfully created
 */
router.post('/', validateCreateTicket, createTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Ticket details
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ticket details
 */
router.get('/:id', validateParamId, getTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     tags: [Tickets]
 *     summary: Update ticket
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [TASK, BUG, FEATURE, IMPROVEMENT]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               estimatedHours:
 *                 type: number
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Ticket successfully updated
 */
router.put('/:id', validateUpdateTicket, updateTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     tags: [Tickets]
 *     summary: Delete ticket
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ticket successfully deleted
 */
router.delete('/:id', validateParamId, deleteTicket);

/**
 * @swagger
 * /api/tickets/{id}/move:
 *   patch:
 *     tags: [Tickets]
 *     summary: Move ticket (Kanban drag & drop)
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stageId, position]
 *             properties:
 *               stageId:
 *                 type: integer
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ticket successfully moved
 */
router.patch('/:id/move', validateMoveTicket, moveTicket);

export default router;
