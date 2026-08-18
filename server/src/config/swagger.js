// ============================================================================
// SPRINTHUB - Swagger/OpenAPI Configuration
// Automatic API documentation
// ============================================================================

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SprintHub API',
      version: '1.0.0',
      description:
        'REST API for SprintHub - an application for managing workspaces and tickets with Kanban sprint functionality.',
    },
    servers: [
      {
        url: 'http://localhost:8081',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'sprinthub_token',
          description: 'JWT token in HTTP-only cookie',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token in Authorization header',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Marko Petrovic' },
            email: { type: 'string', format: 'email', example: 'marko@sprinthub.test' },
            role: { type: 'string', enum: ['USER', 'MODERATOR', 'ADMIN'], example: 'USER' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'SprintHub Development' },
            description: { type: 'string', nullable: true },
            icon: { type: 'string', example: '#6366f1' },
            createdById: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Sprint: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Sprint 1' },
            goal: { type: 'string', nullable: true, example: 'Implement core features' },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED'], example: 'ACTIVE' },
            workspaceId: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Stage: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Backlog' },
            sprintId: { type: 'integer', example: 1 },
            position: { type: 'integer', example: 0 },
            color: { type: 'string', example: '#6b7280' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            code: { type: 'string', example: 'WS1-001' },
            title: { type: 'string', example: 'Implement login' },
            description: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['TASK', 'BUG', 'FEATURE', 'IMPROVEMENT'], example: 'TASK' },
            stageId: { type: 'integer', example: 1 },
            position: { type: 'integer', example: 0 },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], example: 'MEDIUM' },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            estimatedHours: { type: 'number', nullable: true, example: 8 },
            createdById: { type: 'integer', example: 1 },
            assigneeId: { type: 'integer', nullable: true, example: 2 },
            tagId: { type: 'integer', nullable: true, example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },

        Tag: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Bug' },
            color: { type: 'string', example: '#ef4444' },
            workspaceId: { type: 'integer', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        Notification: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            type: { type: 'string', example: 'TICKET_ASSIGNED' },
            title: { type: 'string', example: 'New ticket assigned' },
            message: { type: 'string' },
            isRead: { type: 'boolean', example: false },
            link: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error description' },
          },
        },

        PaginatedResponse: {
          type: 'object',
          properties: {
            items: { type: 'array', items: {} },
            page: { type: 'integer', example: 1 },
            pageSize: { type: 'integer', example: 12 },
            total: { type: 'integer', example: 45 },
            totalPages: { type: 'integer', example: 4 },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication (register, login, logout)' },
      { name: 'Users', description: 'User management (admin)' },
      { name: 'Workspaces', description: 'CRUD operations for workspaces' },
      { name: 'Sprints', description: 'Sprints within workspaces with lifecycle management' },
      { name: 'Stages', description: 'Sprint board phases (Backlog, In Progress, Review, Done)' },
      { name: 'Tickets', description: 'Tickets / cards on the sprint board' },
      { name: 'Tags', description: 'Tags / categories for tickets' },
      { name: 'Notifications', description: 'Notifications for users' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
