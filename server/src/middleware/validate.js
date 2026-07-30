import { body, param, query, validationResult } from 'express-validator';

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// Auth
export const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('role').optional().isIn(['USER', 'ADMIN', 'MODERATOR']).withMessage('Invalid role'),
  handleValidation,
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

// Workspaces
export const validateCreateWorkspace = [
  body('name').trim().notEmpty().withMessage('Workspace name is required')
    .isLength({ max: 200 }).withMessage('Name must be under 200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  body('icon').optional().trim().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Icon must be hex color (#rrggbb)'),
  handleValidation,
];

export const validateUpdateWorkspace = [
  param('id').isInt({ min: 1 }).withMessage('Invalid workspace ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 200 }).withMessage('Name must be under 200 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
  body('icon').optional().trim().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Icon must be hex color (#rrggbb)'),
  handleValidation,
];

// Tickets
export const validateCreateTicket = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 300 }).withMessage('Title must be under 300 characters'),
  body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long'),
  body('stageId').isInt({ min: 1 }).withMessage('Valid stageId is required'),
  body('type').optional().isIn(['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT']).withMessage('Invalid type'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid date format'),
  body('estimatedHours').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('estimatedHours must be a positive number'),
  body('assigneeId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid assigneeId'),
  body('tagId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid tagId'),
  handleValidation,
];

export const validateUpdateTicket = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ticket ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 300 }).withMessage('Title must be under 300 characters'),
  body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description too long'),
  body('type').optional().isIn(['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT']).withMessage('Invalid type'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid date format'),
  body('estimatedHours').optional({ values: 'null' }).isFloat({ min: 0 }).withMessage('estimatedHours must be a positive number'),
  handleValidation,
];

export const validateMoveTicket = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ticket ID'),
  body('stageId').isInt({ min: 1 }).withMessage('Valid stageId is required'),
  body('position').isInt({ min: 0 }).withMessage('Valid position is required'),
  handleValidation,
];

// Sprints
export const validateCreateSprint = [
  param('workspaceId').isInt({ min: 1 }).withMessage('Invalid workspace ID'),
  body('name').trim().notEmpty().withMessage('Sprint name is required')
    .isLength({ max: 200 }).withMessage('Name must be under 200 characters'),
  body('goal').optional().trim().isLength({ max: 2000 }).withMessage('Goal too long'),
  body('startDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid startDate format'),
  body('endDate').optional({ values: 'null' }).isISO8601().withMessage('Invalid endDate format'),
  handleValidation,
];

// Stages
export const validateCreateStage = [
  param('sprintId').isInt({ min: 1 }).withMessage('Invalid sprint ID'),
  body('name').trim().notEmpty().withMessage('Stage name is required')
    .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
  body('color').optional().trim().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be hex (#rrggbb)'),
  handleValidation,
];

// Tags
export const validateCreateTag = [
  body('name').trim().notEmpty().withMessage('Tag name is required')
    .isLength({ max: 50 }).withMessage('Name must be under 50 characters'),
  body('workspaceId').isInt({ min: 1 }).withMessage('Valid workspaceId is required'),
  body('color').optional().trim().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be hex (#rrggbb)'),
  handleValidation,
];

// Generic param ID validator
export const validateParamId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  handleValidation,
];

// Pagination query validator
export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('pageSize').optional().isInt({ min: 1, max: 50 }).withMessage('PageSize must be 1-50'),
  handleValidation,
];
