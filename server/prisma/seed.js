// ============================================================================
// SPRINTHUB - Database Seed (Comprehensive)
// 5 korisnika, 5 workspace-ova, 12 sprintova, 50+ tiketa, 20+ notifikacija
// Pokriva svu funkcionalnost: životni ciklus, tipove, prioritete, rokove, tagove
// ============================================================================

import { PrismaClient } from '../generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

function d(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

let counters = {};
function code(wsId) {
  counters[wsId] = (counters[wsId] || 0) + 1;
  return `WS${wsId}-${String(counters[wsId]).padStart(3, '0')}`;
}

// ============================================================================
// CLEAN
// ============================================================================
async function clean() {
  console.log('Cleaning existing data...');
  await prisma.notification.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✓ Database cleaned');
}

// ============================================================================
// USERS
// ============================================================================
async function seedUsers() {
  console.log('Seeding users...');

  const data = [
    { name: 'Dimitrije Djordjevic', email: 'djordjevicdimitrije147@gmail.com', password: hash('Profesija1'), role: 'ADMIN' },
    { name: 'Jelena Todorovic',     email: 'jelena@sprinthub.test',            password: hash('Moderator1'), role: 'MODERATOR' },
    { name: 'Marko Petrovic',       email: 'marko@sprinthub.test',             password: hash('Password1'),  role: 'USER' },
    { name: 'Ana Jovanovic',        email: 'ana@sprinthub.test',               password: hash('Password1'),  role: 'USER' },
    { name: 'Stefan Nikolic',       email: 'stefan@sprinthub.test',            password: hash('Password1'),  role: 'USER' },
  ];

  const users = [];
  for (const u of data) {
    const created = await prisma.user.create({ data: u });
    users.push(created);
    console.log(`  ✓ ${created.role.padEnd(9)} ${created.name} (${created.email})`);
  }
  return users;
}

// ============================================================================
// WORKSPACES
// ============================================================================
async function seedWorkspaces(users) {
  console.log('Seeding workspaces...');
  const [admin, mod, marko, ana, stefan] = users;

  const data = [
    { name: 'SprintHub Development',  description: 'SprintHub app development — fullstack Angular + Express + SQL Server project for sprint management',  icon: '#6366f1', createdById: marko.id },
    { name: 'E-Commerce Platform',    description: 'Online store with shopping cart, checkout, Stripe payment integration and admin panel',                icon: '#22c55e', createdById: ana.id },
    { name: 'Mobile Banking App',     description: 'React Native mobile banking app — authentication, transfers, notifications',                           icon: '#3b82f6', createdById: stefan.id },
    { name: 'DevOps Pipeline',        description: 'CI/CD infrastructure — Jenkins, Docker, Kubernetes, monitoring and alerting',                          icon: '#f97316', createdById: marko.id },
    { name: 'Marketing Website',      description: 'Corporate website with blog section, CMS and analytics',                                              icon: '#ec4899', createdById: ana.id },
  ];

  const workspaces = [];
  for (const ws of data) {
    const created = await prisma.workspace.create({ data: ws });
    workspaces.push(created);
    console.log(`  ✓ ${created.name}`);
  }
  return workspaces;
}

// ============================================================================
// TAGS
// ============================================================================
async function seedTags(workspaces) {
  console.log('Seeding tags...');

  const tagSets = {
    0: [ // SprintHub
      { name: 'Frontend', color: '#3b82f6' },
      { name: 'Backend',  color: '#22c55e' },
      { name: 'Bug',      color: '#ef4444' },
      { name: 'UI/UX',    color: '#8b5cf6' },
      { name: 'DevOps',   color: '#f97316' },
      { name: 'Urgent',   color: '#dc2626' },
      { name: 'Docs',     color: '#6b7280' },
    ],
    1: [ // E-Commerce
      { name: 'Payment',   color: '#22c55e' },
      { name: 'Cart',      color: '#3b82f6' },
      { name: 'Bug',       color: '#ef4444' },
      { name: 'UX',        color: '#8b5cf6' },
      { name: 'Security',  color: '#f97316' },
      { name: 'Analytics', color: '#06b6d4' },
    ],
    2: [ // Mobile Banking
      { name: 'Auth',          color: '#ef4444' },
      { name: 'Transactions',  color: '#22c55e' },
      { name: 'UI',            color: '#8b5cf6' },
      { name: 'Performance',   color: '#f59e0b' },
      { name: 'Security',      color: '#dc2626' },
    ],
    3: [ // DevOps
      { name: 'CI/CD',       color: '#3b82f6' },
      { name: 'Docker',      color: '#06b6d4' },
      { name: 'Kubernetes',  color: '#8b5cf6' },
      { name: 'Monitoring',  color: '#f59e0b' },
      { name: 'Incident',    color: '#ef4444' },
    ],
    4: [ // Marketing
      { name: 'Design',  color: '#ec4899' },
      { name: 'Content', color: '#8b5cf6' },
      { name: 'SEO',     color: '#22c55e' },
      { name: 'Bug',     color: '#ef4444' },
    ],
  };

  const allTags = {};
  for (let i = 0; i < workspaces.length; i++) {
    const ws = workspaces[i];
    allTags[ws.id] = [];
    for (const tag of tagSets[i]) {
      const created = await prisma.tag.create({ data: { ...tag, workspaceId: ws.id } });
      allTags[ws.id].push(created);
    }
    console.log(`  ✓ ${ws.name}: ${allTags[ws.id].length} tags`);
  }
  return allTags;
}

// ============================================================================
// SPRINTS & STAGES
// ============================================================================
async function seedSprints(workspaces) {
  console.log('Seeding sprints and stages...');

  const defaultStages = [
    { name: 'Backlog',     color: '#6b7280', position: 0 },
    { name: 'In Progress', color: '#3b82f6', position: 1 },
    { name: 'Review',      color: '#f59e0b', position: 2 },
    { name: 'Done',        color: '#22c55e', position: 3 },
  ];

  const sprintDefs = {
    0: [ // SprintHub — 3 sprinta (completed, active, planning)
      { name: 'Sprint 1 — Foundations',      goal: 'Auth system, Prisma setup, basic API endpoints',                         startDate: d(-28), endDate: d(-14), status: 'COMPLETED' },
      { name: 'Sprint 2 — Kanban & CRUD',    goal: 'Kanban board, drag & drop, ticket and stage CRUD, tag system',           startDate: d(-7),  endDate: d(7),   status: 'ACTIVE' },
      { name: 'Sprint 3 — Polish & Deploy',  goal: 'Responsiveness, email notifications, Docker deploy, documentation',     startDate: d(8),   endDate: d(22),  status: 'PLANNING' },
    ],
    1: [ // E-Commerce — 2 sprinta (active, planning)
      { name: 'Sprint 1 — Catalog & Cart',   goal: 'Product display, search, shopping cart, wishlist',                       startDate: d(-5),  endDate: d(9),   status: 'ACTIVE' },
      { name: 'Sprint 2 — Checkout & Pay',   goal: 'Checkout flow, Stripe integration, invoice generation',                 startDate: d(10),  endDate: d(24),  status: 'PLANNING' },
    ],
    2: [ // Mobile Banking — 3 sprinta
      { name: 'Sprint 1 — Auth & Onboard',   goal: 'Biometrics, PIN, onboarding flow, KYC verification',                    startDate: d(-30), endDate: d(-16), status: 'COMPLETED' },
      { name: 'Sprint 2 — Core Banking',     goal: 'Account overview, transfers, transaction history',                      startDate: d(-3),  endDate: d(11),  status: 'ACTIVE' },
      { name: 'Sprint 3 — Notifications',    goal: 'Push notifications, transaction alerts, budget warnings',               startDate: d(12),  endDate: d(26),  status: 'PLANNING' },
    ],
    3: [ // DevOps — 2 sprinta
      { name: 'Sprint 1 — CI/CD Setup',      goal: 'Jenkins pipeline, Docker images, automated testing, staging deploy',    startDate: d(-10), endDate: d(4),   status: 'ACTIVE' },
      { name: 'Sprint 2 — Monitoring',       goal: 'Prometheus + Grafana, log aggregation, alerting rules',                 startDate: d(5),   endDate: d(19),  status: 'PLANNING' },
    ],
    4: [ // Marketing — 2 sprinta
      { name: 'Sprint 1 — Design & Build',   goal: 'Landing page, about, contact form, responsive layout',                  startDate: d(-14), endDate: d(0),   status: 'COMPLETED' },
      { name: 'Sprint 2 — Blog & SEO',       goal: 'Blog post CMS, SEO optimization, Google Analytics integration',         startDate: d(1),   endDate: d(15),  status: 'ACTIVE' },
    ],
  };

  const allSprints = {};
  for (let i = 0; i < workspaces.length; i++) {
    const ws = workspaces[i];
    allSprints[ws.id] = [];

    for (const sprintDef of sprintDefs[i]) {
      const sprint = await prisma.sprint.create({
        data: {
          name: sprintDef.name,
          goal: sprintDef.goal,
          startDate: sprintDef.startDate,
          endDate: sprintDef.endDate,
          status: sprintDef.status,
          workspaceId: ws.id,
        },
      });

      const stages = [];
      for (const stg of defaultStages) {
        const stage = await prisma.stage.create({ data: { ...stg, sprintId: sprint.id } });
        stages.push(stage);
      }

      allSprints[ws.id].push({ sprint, stages });
      console.log(`  ✓ ${ws.name} → ${sprint.name} (${sprint.status})`);
    }
  }
  return allSprints;
}

// ============================================================================
// TICKETS
// ============================================================================
async function seedTickets(workspaces, sprints, users, tags) {
  console.log('Seeding tickets...');
  const [admin, mod, marko, ana, stefan] = users;
  let totalTickets = 0;

  function tag(wsId, name) {
    return tags[wsId]?.find(t => t.name === name)?.id || null;
  }

  // ---------- WS 0: SprintHub Development (marko) ----------
  const ws0 = workspaces[0];
  const ws0s = sprints[ws0.id];

  // Sprint 1 — COMPLETED (svi tiketi u Done)
  const s0_completed = ws0s[0].stages;
  const completedTickets = [
    { title: 'Setup Prisma ORM with SQL Server',          description: 'Configure Prisma with SQL Server Express, Windows Auth, schema for 7 models',            type: 'TASK',        priority: 'HIGH',   estimatedHours: 8,  createdById: marko.id,  tagId: tag(ws0.id, 'Backend') },
    { title: 'Implement JWT authentication',               description: 'Login/register with JWT, HTTP-only cookie, Bearer token, CSRF double-submit pattern',   type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 16, createdById: marko.id,  tagId: tag(ws0.id, 'Backend') },
    { title: 'Create Angular project scaffold',            description: 'Angular 21, standalone components, TailwindCSS, ng-icons, routing, guards',             type: 'TASK',        priority: 'HIGH',   estimatedHours: 4,  createdById: marko.id,  tagId: tag(ws0.id, 'Frontend') },
    { title: 'Login and Register pages',                   description: 'Login and registration forms with validation and error display',                        type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 6,  createdById: ana.id,    tagId: tag(ws0.id, 'Frontend') },
    { title: 'Navbar with user menu',                      description: 'Responsive navbar, user dropdown, mobile menu, logout functionality',                  type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 5,  createdById: ana.id,    tagId: tag(ws0.id, 'UI/UX') },
    { title: 'CRUD API for workspaces',                    description: 'REST endpoints for creating, reading, updating and deleting workspaces',               type: 'TASK',        priority: 'HIGH',   estimatedHours: 8,  createdById: stefan.id, tagId: tag(ws0.id, 'Backend') },
    { title: 'Role middleware (ADMIN, MODERATOR, USER)',    description: 'Middleware for role checking with requireAuth and requireRole functions',               type: 'TASK',        priority: 'MEDIUM', estimatedHours: 3,  createdById: marko.id,  tagId: tag(ws0.id, 'Backend') },
    { title: 'Fix CORS configuration for dev',             description: 'CORS not working with credentials:true — needed explicit origin instead of wildcard',  type: 'BUG',         priority: 'URGENT', estimatedHours: 1,  createdById: stefan.id, tagId: tag(ws0.id, 'Bug') },
  ];
  for (let i = 0; i < completedTickets.length; i++) {
    await prisma.ticket.create({ data: { ...completedTickets[i], code: code(ws0.id), stageId: s0_completed[3].id, position: i } });
  }

  // Sprint 2 — ACTIVE (tiketi raspoređeni po svim stage-ovima)
  const s0_active = ws0s[1].stages;
  const activeTickets = [
    // Backlog
    { title: 'Implement email notifications',              description: 'Nodemailer with SMTP for sending emails when tickets are assigned to users',            type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 6,  dueDate: d(6),  stageId: s0_active[0].id, position: 0, createdById: marko.id,  assigneeId: null,       tagId: tag(ws0.id, 'Backend') },
    { title: 'Swagger API documentation',                  description: 'Add swagger-jsdoc and swagger-ui-express for all API endpoints',                       type: 'TASK',        priority: 'LOW',    estimatedHours: 4,  dueDate: d(7),  stageId: s0_active[0].id, position: 1, createdById: marko.id,  assigneeId: null,       tagId: tag(ws0.id, 'Docs') },
    { title: 'Docker Compose for 3 services',              description: 'Dockerfile for frontend and backend, docker-compose with SQL Server, volume persistence', type: 'TASK',     priority: 'LOW',    estimatedHours: 8,  dueDate: null,  stageId: s0_active[0].id, position: 2, createdById: stefan.id, assigneeId: null,       tagId: tag(ws0.id, 'DevOps') },
    { title: 'Responsive design for mobile devices',       description: 'Kanban board should work on mobile devices with horizontal scroll',                    type: 'IMPROVEMENT', priority: 'MEDIUM', estimatedHours: 5,  dueDate: d(5),  stageId: s0_active[0].id, position: 3, createdById: ana.id,    assigneeId: null,       tagId: tag(ws0.id, 'UI/UX') },

    // In Progress
    { title: 'Kanban Drag & Drop with Angular CDK',        description: 'CdkDragDrop for moving tickets between stages, update positions on server',            type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 16, dueDate: d(2),  stageId: s0_active[1].id, position: 0, createdById: marko.id,  assigneeId: ana.id,     tagId: tag(ws0.id, 'Frontend') },
    { title: 'CRUD API for tickets with validation',       description: 'Create, Read, Update, Delete, Move — with express-validator and auto-code generation', type: 'TASK',        priority: 'HIGH',   estimatedHours: 12, dueDate: d(1),  stageId: s0_active[1].id, position: 1, createdById: marko.id,  assigneeId: marko.id,   tagId: tag(ws0.id, 'Backend') },
    { title: 'Fix: Safari login not working',              description: 'HTTP-only cookie not sent on Safari — SameSite=None needed for cross-site',            type: 'BUG',         priority: 'URGENT', estimatedHours: 3,  dueDate: d(-1), stageId: s0_active[1].id, position: 2, createdById: ana.id,    assigneeId: stefan.id,  tagId: tag(ws0.id, 'Bug') },
    { title: 'Tag manager in sprint board',                description: 'Modal for creating, editing and deleting tags for workspace from Kanban view',         type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 6,  dueDate: d(3),  stageId: s0_active[1].id, position: 3, createdById: ana.id,    assigneeId: ana.id,     tagId: tag(ws0.id, 'Frontend') },

    // Review
    { title: 'Dashboard page with statistics',             description: 'Overview: workspace count, active sprints, my tickets, overdue deadlines',             type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 8,  dueDate: d(0),  stageId: s0_active[2].id, position: 0, createdById: marko.id,  assigneeId: stefan.id,  tagId: tag(ws0.id, 'Frontend') },
    { title: 'Sprint status transitions',                  description: 'PLANNING→ACTIVE→COMPLETED validation with notification on start',                      type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 4,  dueDate: d(-2), stageId: s0_active[2].id, position: 1, createdById: marko.id,  assigneeId: marko.id,   tagId: tag(ws0.id, 'Backend') },
    { title: 'Refactor auth middleware for Express 5',     description: 'req.query is read-only getter in Express 5 — fix sanitizeInput middleware',            type: 'IMPROVEMENT', priority: 'HIGH',   estimatedHours: 2,  dueDate: d(-3), stageId: s0_active[2].id, position: 2, createdById: stefan.id, assigneeId: stefan.id,  tagId: tag(ws0.id, 'Backend') },

    // Done
    { title: 'Workspace list with inline sprints',         description: 'Expandable workspace cards with sprint list, create sprint inline',                    type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 10, stageId: s0_active[3].id, position: 0, createdById: marko.id,  assigneeId: ana.id,     tagId: tag(ws0.id, 'Frontend') },
    { title: 'Notifications with bell icon',               description: 'In-app notifications in navbar with badge count, mark as read',                       type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 6,  stageId: s0_active[3].id, position: 1, createdById: marko.id,  assigneeId: stefan.id,  tagId: tag(ws0.id, 'Frontend') },
    { title: 'CRUD API for stages with reorder',           description: 'Create, update, delete and reorder stages',                                           type: 'TASK',        priority: 'MEDIUM', estimatedHours: 5,  stageId: s0_active[3].id, position: 2, createdById: marko.id,  assigneeId: marko.id,   tagId: tag(ws0.id, 'Backend') },
    { title: 'Timeline (calendar)',                        description: 'Monthly calendar with tickets by date, navigation, detail panel',                      type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 10, stageId: s0_active[3].id, position: 3, createdById: ana.id,    assigneeId: ana.id,     tagId: tag(ws0.id, 'Frontend') },
  ];
  for (const t of activeTickets) {
    await prisma.ticket.create({ data: { ...t, code: code(ws0.id) } });
  }

  // Sprint 3 — PLANNING (svi u Backlog)
  const s0_planning = ws0s[2].stages;
  const planTickets = [
    { title: 'Optimize SQL queries for ticket list',       type: 'IMPROVEMENT', priority: 'MEDIUM', estimatedHours: 6,  createdById: marko.id,  tagId: tag(ws0.id, 'Backend') },
    { title: 'Dark mode support',                          type: 'FEATURE',     priority: 'LOW',    estimatedHours: 12, createdById: ana.id,    tagId: tag(ws0.id, 'UI/UX') },
    { title: 'Export tickets to CSV',                      type: 'FEATURE',     priority: 'LOW',    estimatedHours: 4,  createdById: stefan.id, tagId: tag(ws0.id, 'Frontend') },
    { title: 'Per-user rate limiting',                     type: 'IMPROVEMENT', priority: 'MEDIUM', estimatedHours: 3,  createdById: marko.id,  tagId: tag(ws0.id, 'Backend') },
    { title: 'E2E tests with Cypress',                     type: 'TASK',        priority: 'HIGH',   estimatedHours: 20, createdById: stefan.id, tagId: tag(ws0.id, 'DevOps') },
    { title: 'README and API documentation',               type: 'TASK',        priority: 'MEDIUM', estimatedHours: 4,  createdById: marko.id,  tagId: tag(ws0.id, 'Docs') },
  ];
  for (let i = 0; i < planTickets.length; i++) {
    await prisma.ticket.create({ data: { ...planTickets[i], code: code(ws0.id), stageId: s0_planning[0].id, position: i } });
  }
  totalTickets += completedTickets.length + activeTickets.length + planTickets.length;

  // ---------- WS 1: E-Commerce (ana) ----------
  const ws1 = workspaces[1];
  const ws1s = sprints[ws1.id];

  // Sprint 1 — ACTIVE
  const s1_active = ws1s[0].stages;
  const ecomTickets = [
    // Backlog
    { title: 'Wishlist functionality',                     type: 'FEATURE',     priority: 'LOW',    estimatedHours: 8,  dueDate: d(8),   stageId: s1_active[0].id, position: 0, createdById: ana.id,    assigneeId: null,       tagId: tag(ws1.id, 'UX') },
    { title: 'Product review and rating system',           type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 12, dueDate: d(9),   stageId: s1_active[0].id, position: 1, createdById: ana.id,    assigneeId: null,       tagId: tag(ws1.id, 'Cart') },
    { title: 'Admin panel for order management',           type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 16, dueDate: d(7),   stageId: s1_active[0].id, position: 2, createdById: ana.id,    assigneeId: null,       tagId: tag(ws1.id, 'Analytics') },

    // In Progress
    { title: 'Cart with LocalStorage persistence',        type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 10, dueDate: d(3),   stageId: s1_active[1].id, position: 0, createdById: ana.id,    assigneeId: stefan.id,  tagId: tag(ws1.id, 'Cart') },
    { title: 'Product catalog with search and filters',   type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 14, dueDate: d(2),   stageId: s1_active[1].id, position: 1, createdById: ana.id,    assigneeId: ana.id,     tagId: tag(ws1.id, 'UX') },
    { title: 'Fix: Price not updating in cart',            type: 'BUG',         priority: 'URGENT', estimatedHours: 2,  dueDate: d(-1),  stageId: s1_active[1].id, position: 2, createdById: stefan.id, assigneeId: stefan.id,  tagId: tag(ws1.id, 'Bug') },

    // Review
    { title: 'Responsive product grid layout',             type: 'IMPROVEMENT', priority: 'MEDIUM', estimatedHours: 4,  dueDate: d(1),   stageId: s1_active[2].id, position: 0, createdById: ana.id,    assigneeId: ana.id,     tagId: tag(ws1.id, 'UX') },

    // Done
    { title: 'Setup Next.js project',                      type: 'TASK',        priority: 'HIGH',   estimatedHours: 3,  stageId: s1_active[3].id, position: 0, createdById: ana.id,    tagId: tag(ws1.id, 'Cart') },
    { title: 'Database schema for products and categories', type: 'TASK',       priority: 'HIGH',   estimatedHours: 4,  stageId: s1_active[3].id, position: 1, createdById: ana.id,    tagId: tag(ws1.id, 'Cart') },
    { title: 'REST API for products',                      type: 'TASK',        priority: 'HIGH',   estimatedHours: 8,  stageId: s1_active[3].id, position: 2, createdById: stefan.id, tagId: tag(ws1.id, 'Cart') },
  ];
  for (const t of ecomTickets) {
    await prisma.ticket.create({ data: { ...t, code: code(ws1.id) } });
  }

  // Sprint 2 — PLANNING
  const s1_planning = ws1s[1].stages;
  const ecomPlanTickets = [
    { title: 'Stripe Payment integration',                 type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 20, createdById: ana.id,    tagId: tag(ws1.id, 'Payment') },
    { title: 'Checkout multi-step wizard',                 type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 16, createdById: ana.id,    tagId: tag(ws1.id, 'Payment') },
    { title: 'Invoice PDF generation',                     type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 8,  createdById: stefan.id, tagId: tag(ws1.id, 'Payment') },
    { title: 'Order confirmation email',                   type: 'TASK',        priority: 'MEDIUM', estimatedHours: 4,  createdById: ana.id,    tagId: tag(ws1.id, 'Payment') },
    { title: 'SSL and PCI DSS compliance check',           type: 'TASK',        priority: 'HIGH',   estimatedHours: 6,  createdById: stefan.id, tagId: tag(ws1.id, 'Security') },
  ];
  for (let i = 0; i < ecomPlanTickets.length; i++) {
    await prisma.ticket.create({ data: { ...ecomPlanTickets[i], code: code(ws1.id), stageId: s1_planning[0].id, position: i } });
  }
  totalTickets += ecomTickets.length + ecomPlanTickets.length;

  // ---------- WS 2: Mobile Banking (stefan) ----------
  const ws2 = workspaces[2];
  const ws2s = sprints[ws2.id];

  // Sprint 1 — COMPLETED
  const s2_completed = ws2s[0].stages;
  const bankCompleted = [
    { title: 'Biometric authentication (FaceID/TouchID)',  type: 'FEATURE', priority: 'HIGH',   estimatedHours: 12, createdById: stefan.id, tagId: tag(ws2.id, 'Auth') },
    { title: 'PIN code setup and verification',            type: 'FEATURE', priority: 'HIGH',   estimatedHours: 6,  createdById: stefan.id, tagId: tag(ws2.id, 'Auth') },
    { title: 'Onboarding flow (4 steps)',                  type: 'FEATURE', priority: 'MEDIUM', estimatedHours: 8,  createdById: marko.id,  tagId: tag(ws2.id, 'UI') },
    { title: 'KYC document upload',                        type: 'FEATURE', priority: 'HIGH',   estimatedHours: 10, createdById: stefan.id, tagId: tag(ws2.id, 'Security') },
    { title: 'Splash screen and app branding',             type: 'TASK',    priority: 'LOW',    estimatedHours: 2,  createdById: marko.id,  tagId: tag(ws2.id, 'UI') },
  ];
  for (let i = 0; i < bankCompleted.length; i++) {
    await prisma.ticket.create({ data: { ...bankCompleted[i], code: code(ws2.id), stageId: s2_completed[3].id, position: i } });
  }

  // Sprint 2 — ACTIVE
  const s2_active = ws2s[1].stages;
  const bankActive = [
    // Backlog
    { title: 'Monthly statement view',                     type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 8,  dueDate: d(10),  stageId: s2_active[0].id, position: 0, createdById: stefan.id, assigneeId: null,       tagId: tag(ws2.id, 'Transactions') },
    { title: 'QR code payment',                            type: 'FEATURE',     priority: 'LOW',    estimatedHours: 12, dueDate: d(11),  stageId: s2_active[0].id, position: 1, createdById: stefan.id, assigneeId: null,       tagId: tag(ws2.id, 'Transactions') },

    // In Progress
    { title: 'Account balance overview (real-time)',        type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 10, dueDate: d(3),   stageId: s2_active[1].id, position: 0, createdById: stefan.id, assigneeId: stefan.id,  tagId: tag(ws2.id, 'Transactions') },
    { title: 'Transfer between own accounts',              type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 8,  dueDate: d(4),   stageId: s2_active[1].id, position: 1, createdById: stefan.id, assigneeId: marko.id,   tagId: tag(ws2.id, 'Transactions') },
    { title: 'Fix: Session timeout not working',           type: 'BUG',         priority: 'URGENT', estimatedHours: 3,  dueDate: d(0),   stageId: s2_active[1].id, position: 2, createdById: marko.id,  assigneeId: stefan.id,  tagId: tag(ws2.id, 'Security') },

    // Review
    { title: 'Transaction history with filters',           type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 10, dueDate: d(2),   stageId: s2_active[2].id, position: 0, createdById: stefan.id, assigneeId: marko.id,   tagId: tag(ws2.id, 'Transactions') },
    { title: 'Optimize app launch time',                   type: 'IMPROVEMENT', priority: 'MEDIUM', estimatedHours: 4,  dueDate: d(-2),  stageId: s2_active[2].id, position: 1, createdById: marko.id,  assigneeId: marko.id,   tagId: tag(ws2.id, 'Performance') },

    // Done
    { title: 'Navigation structure with tab bar',          type: 'TASK',        priority: 'HIGH',   estimatedHours: 4,  stageId: s2_active[3].id, position: 0, createdById: stefan.id, tagId: tag(ws2.id, 'UI') },
    { title: 'API client with retry and error handling',   type: 'TASK',        priority: 'HIGH',   estimatedHours: 6,  stageId: s2_active[3].id, position: 1, createdById: marko.id,  tagId: tag(ws2.id, 'Transactions') },
  ];
  for (const t of bankActive) {
    await prisma.ticket.create({ data: { ...t, code: code(ws2.id) } });
  }

  // Sprint 3 — PLANNING
  const s2_planning = ws2s[2].stages;
  const bankPlan = [
    { title: 'Push notifications for transactions',        type: 'FEATURE', priority: 'HIGH',   estimatedHours: 10, createdById: stefan.id, tagId: tag(ws2.id, 'Transactions') },
    { title: 'Budget alert warnings',                      type: 'FEATURE', priority: 'MEDIUM', estimatedHours: 8,  createdById: stefan.id, tagId: tag(ws2.id, 'Transactions') },
    { title: 'In-app messaging with bank',                 type: 'FEATURE', priority: 'LOW',    estimatedHours: 14, createdById: marko.id,  tagId: tag(ws2.id, 'UI') },
  ];
  for (let i = 0; i < bankPlan.length; i++) {
    await prisma.ticket.create({ data: { ...bankPlan[i], code: code(ws2.id), stageId: s2_planning[0].id, position: i } });
  }
  totalTickets += bankCompleted.length + bankActive.length + bankPlan.length;

  // ---------- WS 3: DevOps Pipeline (marko) ----------
  const ws3 = workspaces[3];
  const ws3s = sprints[ws3.id];

  const s3_active = ws3s[0].stages;
  const devopsTickets = [
    // Backlog
    { title: 'Staging environment auto-deploy',            type: 'TASK',        priority: 'MEDIUM', estimatedHours: 6,  dueDate: d(4),   stageId: s3_active[0].id, position: 0, createdById: marko.id,  assigneeId: null,       tagId: tag(ws3.id, 'CI/CD') },
    { title: 'Deployment rollback strategy',               type: 'TASK',        priority: 'HIGH',   estimatedHours: 8,  dueDate: d(3),   stageId: s3_active[0].id, position: 1, createdById: marko.id,  assigneeId: null,       tagId: tag(ws3.id, 'Kubernetes') },

    // In Progress
    { title: 'Jenkins pipeline for backend',               type: 'TASK',        priority: 'HIGH',   estimatedHours: 12, dueDate: d(2),   stageId: s3_active[1].id, position: 0, createdById: marko.id,  assigneeId: marko.id,   tagId: tag(ws3.id, 'CI/CD') },
    { title: 'Docker multi-stage build for Angular',       type: 'TASK',        priority: 'HIGH',   estimatedHours: 6,  dueDate: d(1),   stageId: s3_active[1].id, position: 1, createdById: marko.id,  assigneeId: stefan.id,  tagId: tag(ws3.id, 'Docker') },
    { title: 'Fix: Container memory leak in production',   type: 'BUG',         priority: 'URGENT', estimatedHours: 4,  dueDate: d(-1),  stageId: s3_active[1].id, position: 2, createdById: stefan.id, assigneeId: marko.id,   tagId: tag(ws3.id, 'Incident') },

    // Review
    { title: 'Automated test suite in pipeline',           type: 'TASK',        priority: 'HIGH',   estimatedHours: 8,  dueDate: d(0),   stageId: s3_active[2].id, position: 0, createdById: marko.id,  assigneeId: stefan.id,  tagId: tag(ws3.id, 'CI/CD') },

    // Done
    { title: 'Docker Compose for local development',       type: 'TASK',        priority: 'HIGH',   estimatedHours: 4,  stageId: s3_active[3].id, position: 0, createdById: marko.id,  tagId: tag(ws3.id, 'Docker') },
    { title: 'Dockerize SQL Server Express',               type: 'TASK',        priority: 'MEDIUM', estimatedHours: 3,  stageId: s3_active[3].id, position: 1, createdById: stefan.id, tagId: tag(ws3.id, 'Docker') },
  ];
  for (const t of devopsTickets) {
    await prisma.ticket.create({ data: { ...t, code: code(ws3.id) } });
  }

  // Sprint 2 — PLANNING
  const s3_planning = ws3s[1].stages;
  const devopsPlan = [
    { title: 'Prometheus metrics endpoints',               type: 'TASK',    priority: 'HIGH',   estimatedHours: 8,  createdById: marko.id,  tagId: tag(ws3.id, 'Monitoring') },
    { title: 'Grafana dashboards',                         type: 'TASK',    priority: 'HIGH',   estimatedHours: 10, createdById: marko.id,  tagId: tag(ws3.id, 'Monitoring') },
    { title: 'ELK stack for log aggregation',              type: 'TASK',    priority: 'MEDIUM', estimatedHours: 12, createdById: stefan.id, tagId: tag(ws3.id, 'Monitoring') },
    { title: 'PagerDuty alerting integration',             type: 'FEATURE', priority: 'MEDIUM', estimatedHours: 6,  createdById: marko.id,  tagId: tag(ws3.id, 'Monitoring') },
  ];
  for (let i = 0; i < devopsPlan.length; i++) {
    await prisma.ticket.create({ data: { ...devopsPlan[i], code: code(ws3.id), stageId: s3_planning[0].id, position: i } });
  }
  totalTickets += devopsTickets.length + devopsPlan.length;

  // ---------- WS 4: Marketing Website (ana) ----------
  const ws4 = workspaces[4];
  const ws4s = sprints[ws4.id];

  // Sprint 1 — COMPLETED
  const s4_completed = ws4s[0].stages;
  const mktCompleted = [
    { title: 'Hero section with CTA',                      type: 'TASK',    priority: 'HIGH',   estimatedHours: 4,  createdById: ana.id, tagId: tag(ws4.id, 'Design') },
    { title: 'About page with team',                       type: 'TASK',    priority: 'MEDIUM', estimatedHours: 3,  createdById: ana.id, tagId: tag(ws4.id, 'Content') },
    { title: 'Contact form with validation',               type: 'FEATURE', priority: 'MEDIUM', estimatedHours: 4,  createdById: ana.id, tagId: tag(ws4.id, 'Design') },
    { title: 'Responsive footer with links',               type: 'TASK',    priority: 'LOW',    estimatedHours: 2,  createdById: ana.id, tagId: tag(ws4.id, 'Design') },
    { title: 'Fix: Image not responsive on iOS',           type: 'BUG',     priority: 'HIGH',   estimatedHours: 1,  createdById: ana.id, tagId: tag(ws4.id, 'Bug') },
  ];
  for (let i = 0; i < mktCompleted.length; i++) {
    await prisma.ticket.create({ data: { ...mktCompleted[i], code: code(ws4.id), stageId: s4_completed[3].id, position: i } });
  }

  // Sprint 2 — ACTIVE
  const s4_active = ws4s[1].stages;
  const mktActive = [
    // Backlog
    { title: 'Google Analytics 4 integration',             type: 'TASK',        priority: 'MEDIUM', estimatedHours: 3,  dueDate: d(10),  stageId: s4_active[0].id, position: 0, createdById: ana.id,    assigneeId: null,       tagId: tag(ws4.id, 'SEO') },
    { title: 'Sitemap.xml generation',                     type: 'TASK',        priority: 'LOW',    estimatedHours: 2,  dueDate: d(12),  stageId: s4_active[0].id, position: 1, createdById: ana.id,    assigneeId: null,       tagId: tag(ws4.id, 'SEO') },

    // In Progress
    { title: 'Blog CMS with Markdown editor',              type: 'FEATURE',     priority: 'HIGH',   estimatedHours: 14, dueDate: d(5),   stageId: s4_active[1].id, position: 0, createdById: ana.id,    assigneeId: ana.id,     tagId: tag(ws4.id, 'Content') },
    { title: 'SEO meta tags for all pages',                type: 'TASK',        priority: 'HIGH',   estimatedHours: 4,  dueDate: d(3),   stageId: s4_active[1].id, position: 1, createdById: ana.id,    assigneeId: stefan.id,  tagId: tag(ws4.id, 'SEO') },

    // Review
    { title: 'Blog post listing with pagination',          type: 'FEATURE',     priority: 'MEDIUM', estimatedHours: 6,  dueDate: d(2),   stageId: s4_active[2].id, position: 0, createdById: ana.id,    assigneeId: ana.id,     tagId: tag(ws4.id, 'Content') },

    // Done
    { title: 'CMS admin authentication',                   type: 'TASK',        priority: 'HIGH',   estimatedHours: 4,  stageId: s4_active[3].id, position: 0, createdById: ana.id,    tagId: tag(ws4.id, 'Content') },
  ];
  for (const t of mktActive) {
    await prisma.ticket.create({ data: { ...t, code: code(ws4.id) } });
  }
  totalTickets += mktCompleted.length + mktActive.length;

  console.log(`  ✓ Created ${totalTickets} tickets total`);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
async function seedNotifications(users, workspaces, sprints) {
  console.log('Seeding notifications...');
  const [admin, mod, marko, ana, stefan] = users;

  const ws0sprints = sprints[workspaces[0].id];
  const ws1sprints = sprints[workspaces[1].id];
  const ws2sprints = sprints[workspaces[2].id];

  const notifications = [
    // Marko prima
    { userId: marko.id, type: 'TICKET_ASSIGNED',  title: 'New ticket assigned',    message: 'Stefan has assigned you ticket "WS3-005 — Container memory leak in production"',             link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: marko.id, type: 'DEADLINE_WARNING',          title: 'Ticket due soon',    message: 'Ticket "WS1-014 — CRUD API for tickets with validation" is due tomorrow',                       link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: marko.id, type: 'DEADLINE_WARNING',          title: 'Ticket due soon',    message: 'Ticket "WS1-018 — Sprint status transitions" is overdue by 2 days',                       link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: marko.id, type: 'SPRINT_STARTED',    title: 'Sprint started',        message: 'Sprint "Sprint 2 — Kanban & CRUD" has been started in workspace SprintHub Development',      link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: true },
    { userId: marko.id, type: 'TICKET_ASSIGNED',   title: 'New ticket assigned',    message: 'Stefan has assigned you ticket "WS3-004 — Transfer between own accounts"',              link: `/sprints/${ws2sprints[1].sprint.id}`, isRead: true },

    // Ana prima
    { userId: ana.id,   type: 'TICKET_ASSIGNED',   title: 'New ticket assigned',    message: 'Marko has assigned you ticket "WS1-013 — Kanban Drag & Drop with Angular CDK"',              link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: ana.id,   type: 'TICKET_ASSIGNED',   title: 'New ticket assigned',    message: 'Marko has assigned you ticket "WS1-016 — Tag manager in sprint board"',                    link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: ana.id,   type: 'TICKET_ASSIGNED',   title: 'New ticket assigned',    message: 'Marko has assigned you ticket "WS1-020 — Workspace list with inline sprints"',          link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: true },
    { userId: ana.id,   type: 'DEADLINE_WARNING',           title: 'Ticket due soon',    message: 'Ticket "WS2-007 — Responsive product grid layout" is due tomorrow',                         link: `/sprints/${ws1sprints[0].sprint.id}`, isRead: false },
    { userId: ana.id,   type: 'SPRINT_STARTED',     title: 'Sprint started',        message: 'Sprint "Sprint 1 — Catalog & Cart" has been started in workspace E-Commerce Platform',     link: `/sprints/${ws1sprints[0].sprint.id}`, isRead: true },

    // Stefan prima
    { userId: stefan.id, type: 'TICKET_ASSIGNED',  title: 'New ticket assigned',    message: 'Ana has assigned you ticket "WS1-015 — Fix: Safari login not working"',                        link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: stefan.id, type: 'TICKET_ASSIGNED',  title: 'New ticket assigned',    message: 'Marko has assigned you ticket "WS1-017 — Dashboard page with statistics"',               link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: stefan.id, type: 'TICKET_ASSIGNED',  title: 'New ticket assigned',    message: 'Ana has assigned you ticket "WS2-004 — Cart with LocalStorage persistence"',          link: `/sprints/${ws1sprints[0].sprint.id}`, isRead: true },
    { userId: stefan.id, type: 'DEADLINE_WARNING',          title: 'Ticket overdue',          message: 'Ticket "WS1-015 — Fix: Safari login not working" was overdue yesterday!',                           link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: stefan.id, type: 'SPRINT_STARTED',    title: 'Sprint started',        message: 'Sprint "Sprint 2 — Core Banking" has been started in workspace Mobile Banking App',          link: `/sprints/${ws2sprints[1].sprint.id}`, isRead: false },
    { userId: stefan.id, type: 'TICKET_ASSIGNED',  title: 'New ticket assigned',    message: 'Marko has assigned you ticket "WS4-004 — Docker multi-stage build for Angular"',             link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: true },

    // Moderator prima
    { userId: mod.id,    type: 'SPRINT_STARTED',    title: 'Sprint started',        message: 'Sprint "Sprint 2 — Kanban & CRUD" has been started in workspace SprintHub Development',      link: `/sprints/${ws0sprints[1].sprint.id}`, isRead: false },
    { userId: mod.id,    type: 'SPRINT_STARTED',    title: 'Sprint started',        message: 'Sprint "Sprint 1 — Catalog & Cart" has been started in workspace E-Commerce Platform',      link: `/sprints/${ws1sprints[0].sprint.id}`, isRead: false },

    // Admin prima
    { userId: admin.id,  type: 'SPRINT_STARTED',    title: 'Sprint completed',         message: 'Sprint "Sprint 1 — Foundations" has been completed in workspace SprintHub Development',              link: `/sprints/${ws0sprints[0].sprint.id}`, isRead: true },
    { userId: admin.id,  type: 'SPRINT_STARTED',    title: 'Sprint started',        message: 'Sprint "Sprint 1 — CI/CD Setup" has been started in workspace DevOps Pipeline',              link: `/sprints/${sprints[workspaces[3].id][0].sprint.id}`, isRead: false },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  console.log(`  ✓ Created ${notifications.length} notifications`);
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('\n🌱 Starting SprintHub database seed...\n');

  await clean();

  const users = await seedUsers();
  const workspaces = await seedWorkspaces(users);
  const tags = await seedTags(workspaces);
  const sprints = await seedSprints(workspaces);
  await seedTickets(workspaces, sprints, users, tags);
  await seedNotifications(users, workspaces, sprints);

  // Stats
  const counts = {
    users:         await prisma.user.count(),
    workspaces:    await prisma.workspace.count(),
    sprints:       await prisma.sprint.count(),
    stages:        await prisma.stage.count(),
    tickets:       await prisma.ticket.count(),
    tags:          await prisma.tag.count(),
    notifications: await prisma.notification.count(),
  };

  console.log('\n✅ Seed completed successfully!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Database stats:');
  console.log('───────────────────────────────────────────────────────');
  console.log(`  Users:         ${counts.users}`);
  console.log(`  Workspaces:    ${counts.workspaces}`);
  console.log(`  Sprints:       ${counts.sprints} (PLANNING / ACTIVE / COMPLETED)`);
  console.log(`  Stages:        ${counts.stages}`);
  console.log(`  Tickets:       ${counts.tickets}`);
  console.log(`  Tags:          ${counts.tags}`);
  console.log(`  Notifications: ${counts.notifications}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('Test credentials:');
  console.log('───────────────────────────────────────────────────────');
  console.log('  ADMIN:     djordjevicdimitrije147@gmail.com / Profesija1');
  console.log('  MODERATOR: jelena@sprinthub.test / mod123');
  console.log('  USER:      marko@sprinthub.test / password');
  console.log('  USER:      ana@sprinthub.test / password');
  console.log('  USER:      stefan@sprinthub.test / password');
  console.log('═══════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
