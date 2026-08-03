// ============================================================================
// SPRINTHUB - Workspace Models
// ============================================================================

import { User } from './user.model';
import { Sprint } from './sprint.model';
import { Tag } from './ticket.model';

export interface Workspace {
  id: number;
  name: string;
  description?: string;
  icon: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  sprints?: Sprint[];
  tags?: Tag[];
  _count?: {
    sprints: number;
  };
}

export interface WorkspaceFilters {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
  icon?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
