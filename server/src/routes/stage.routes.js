import { Router } from 'express';
import {
  listStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from '../controllers/stage.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCreateStage, validateParamId } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/sprints/{sprintId}/stages:
 *   get:
 *     tags: [Stages]
 *     summary: List stages for sprint
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of stages
 */
router.get('/sprints/:sprintId/stages', listStages);

/**
 * @swagger
 * /api/sprints/{sprintId}/stages:
 *   post:
 *     tags: [Stages]
 *     summary: Create a new stage
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
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
 *                 example: In Review
 *               color:
 *                 type: string
 *                 default: "#6b7280"
 *     responses:
 *       201:
 *         description: Stage successfully created
 */
router.post('/sprints/:sprintId/stages', validateCreateStage, createStage);

/**
 * @swagger
 * /api/sprints/{sprintId}/stages/reorder:
 *   patch:
 *     tags: [Stages]
 *     summary: Reorder stages
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stageIds]
 *             properties:
 *               stageIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Stages successfully reordered
 */
router.patch('/sprints/:sprintId/stages/reorder', reorderStages);

/**
 * @swagger
 * /api/stages/{id}:
 *   put:
 *     tags: [Stages]
 *     summary: Update stage
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
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stage successfully updated
 */
router.put('/stages/:id', validateParamId, updateStage);

/**
 * @swagger
 * /api/stages/{id}:
 *   delete:
 *     tags: [Stages]
 *     summary: Delete stage
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
 *         description: Stage successfully deleted
 */
router.delete('/stages/:id', validateParamId, deleteStage);

export default router;
