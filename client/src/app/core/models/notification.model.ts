// ============================================================================
// SPRINTHUB - Notification Models
// ============================================================================

export type NotificationType = 'TICKET_ASSIGNED' | 'SPRINT_STARTED' | 'MEMBER_ADDED' | 'TICKET_DUE_SOON' | 'TICKET_OVERDUE';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  unreadCount: number;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
