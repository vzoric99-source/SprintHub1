import { Router } from 'express';
import {
  listTags,
  createTag,
  updateTag,
  deleteTag,
} from '../controllers/tag.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCreateTag, validateParamId } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

/**
 * @swagger
 * /api/tags:
 *   get:
 *     tags: [Tags]
 *     summary: List tags for workspace
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of tags
 */
router.get('/', listTags);

/**
 * @swagger
 * /api/tags:
 *   post:
 *     tags: [Tags]
 *     summary: Create tag
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, workspaceId]
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *                 default: "#6b7280"
 *               workspaceId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Tag successfully created
 */
router.post('/', validateCreateTag, createTag);

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     tags: [Tags]
 *     summary: Update tag
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
 *         description: Tag successfully updated
 */
router.put('/:id', validateParamId, updateTag);

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     tags: [Tags]
 *     summary: Delete tag
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
 *         description: Tag successfully deleted
 */
router.delete('/:id', validateParamId, deleteTag);

export default router;
