import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validateParamId, validatePagination } from '../middleware/validate.js';
import {
  listUsersForDropdown,
  listUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from '../controllers/user.controller.js';

const router = Router();

router.get('/list', requireAuth, listUsersForDropdown);

router.get('/', requireAuth, requireRole('ADMIN'), validatePagination, listUsers);
router.get('/:id', requireAuth, requireRole('ADMIN'), validateParamId, getUserById);
router.patch('/:id/role', requireAuth, requireRole('ADMIN'), validateParamId, updateUserRole);
router.delete('/:id', requireAuth, requireRole('ADMIN'), validateParamId, deleteUser);

export default router;
