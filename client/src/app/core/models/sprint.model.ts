// ============================================================================
// SPRINTHUB - Sprint & Stage Models
// ============================================================================

import { Ticket } from './ticket.model';

export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED';

export interface Sprint {
  id: number;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status: SprintStatus;
  workspaceId: number;
  createdAt: string;
  updatedAt: string;
  stages?: Stage[];
  _count?: {
    stages: number;
  };
}

export interface Stage {
  id: number;
  name: string;
  color: string;
  position: number;
  sprintId: number;
  tickets?: Ticket[];
  _count?: {
    tickets: number;
  };
}

export interface CreateSprintDto {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  createDefaultStages?: boolean;
}

export interface UpdateSprintDto {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateStageDto {
  name: string;
  color?: string;
}

export interface UpdateStageDto {
  name?: string;
  color?: string;
}

export interface ReorderStagesDto {
  stageIds: number[];
}
