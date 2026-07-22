import { Router } from 'express';
import {
  listWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspace.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCreateWorkspace, validateUpdateWorkspace, validateParamId, validatePagination } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspaces
 *     description: USER sees only their own workspaces, ADMIN/MODERATOR see all.
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
 *           default: 12
 *           maximum: 50
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by name
 *     responses:
 *       200:
 *         description: Paginated list of workspaces
 */
router.get('/', validatePagination, listWorkspaces);

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     tags: [Workspaces]
 *     summary: Create workspace
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created
 */
router.post('/', validateCreateWorkspace, createWorkspace);

/**
 * @swagger
 * /api/workspaces/{id}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Workspace details
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
 *         description: Workspace details with sprints and tags
 */
router.get('/:id', validateParamId, getWorkspace);

/**
 * @swagger
 * /api/workspaces/{id}:
 *   put:
 *     tags: [Workspaces]
 *     summary: Update workspace
 *     description: Owner, ADMIN, or MODERATOR can update
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
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workspace updated
 */
router.put('/:id', validateUpdateWorkspace, updateWorkspace);

/**
 * @swagger
 * /api/workspaces/{id}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Delete workspace
 *     description: Only owner or ADMIN can delete
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
 *         description: Workspace deleted
 */
router.delete('/:id', validateParamId, deleteWorkspace);

export default router;
