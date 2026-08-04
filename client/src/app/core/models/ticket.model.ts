// ============================================================================
// SPRINTHUB - Ticket & Tag Models
// ============================================================================

import { User } from './user.model';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketType = 'TASK' | 'BUG' | 'FEATURE' | 'IMPROVEMENT';

export interface Tag {
  id: number;
  name: string;
  color: string;
  workspaceId: number;
  createdAt: string;
  _count?: {
    tickets: number;
  };
}

export interface TicketStage {
  id: number;
  name: string;
  color: string;
  sprintId?: number;
}

export interface Ticket {
  id: number;
  code?: string;
  title: string;
  description?: string;
  type: TicketType;
  stageId: number;
  position: number;
  priority: Priority;
  dueDate?: string;
  estimatedHours?: number;
  createdById: number;
  assigneeId?: number;
  tagId?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  assignee?: User;
  tag?: Tag;
  stage?: TicketStage;
}

// DTOs
export interface CreateTicketDto {
  title: string;
  description?: string;
  stageId: number;
  type?: TicketType;
  priority?: Priority;
  dueDate?: string;
  estimatedHours?: number | null;
  assigneeId?: number | null;
  tagId?: number | null;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  type?: TicketType;
  priority?: Priority;
  dueDate?: string;
  estimatedHours?: number | null;
  assigneeId?: number | null;
  tagId?: number | null;
}

export interface MoveTicketDto {
  stageId: number;
  position: number;
}

export interface TicketFilters {
  stageId?: number;
  priority?: Priority;
  type?: TicketType;
  hasDueDate?: boolean;
  isOverdue?: boolean;
  q?: string;
}

export interface CreateTagDto {
  name: string;
  color: string;
  workspaceId: number;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}
