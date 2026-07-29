import { Router } from 'express';
import {
  listSprints,
  getSprint,
  createSprint,
  updateSprint,
  updateSprintStatus,
  deleteSprint,
} from '../controllers/sprint.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCreateSprint, validateParamId } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/sprints:
 *   get:
 *     tags: [Sprints]
 *     summary: List sprints for workspace
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of sprints
 */
router.get('/workspaces/:workspaceId/sprints', listSprints);

/**
 * @swagger
 * /api/workspaces/{workspaceId}/sprints:
 *   post:
 *     tags: [Sprints]
 *     summary: Create a new sprint
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sprint 1
 *               goal:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               createDefaultStages:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Sprint successfully created
 */
router.post('/workspaces/:workspaceId/sprints', validateCreateSprint, createSprint);

/**
 * @swagger
 * /api/sprints/{id}:
 *   get:
 *     tags: [Sprints]
 *     summary: Sprint details with stages and tickets
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
 *         description: Sprint details
 */
router.get('/sprints/:id', validateParamId, getSprint);

/**
 * @swagger
 * /api/sprints/{id}:
 *   put:
 *     tags: [Sprints]
 *     summary: Update sprint
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
 *               name:
 *                 type: string
 *               goal:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Sprint updated
 */
router.put('/sprints/:id', validateParamId, updateSprint);

/**
 * @swagger
 * /api/sprints/{id}/status:
 *   patch:
 *     tags: [Sprints]
 *     summary: Change sprint status
 *     description: "Valid transitions: PLANNING→ACTIVE, ACTIVE→COMPLETED, COMPLETED→PLANNING"
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PLANNING, ACTIVE, COMPLETED]
 *     responses:
 *       200:
 *         description: Sprint status changed
 */
router.patch('/sprints/:id/status', validateParamId, updateSprintStatus);

/**
 * @swagger
 * /api/sprints/{id}:
 *   delete:
 *     tags: [Sprints]
 *     summary: Delete sprint
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
 *         description: Sprint deleted
 */
router.delete('/sprints/:id', validateParamId, deleteSprint);

export default router;
