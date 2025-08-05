export const APP_NAME = 'YAP'
export const APP_DESCRIPTION = 'Proje Yönetimi ve İşbirliği Platformu'

export const PROJECT_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const TASK_STATUSES = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member'
} as const

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUSES.DRAFT]: 'Taslak',
  [PROJECT_STATUSES.ACTIVE]: 'Aktif',
  [PROJECT_STATUSES.ON_HOLD]: 'Beklemede',
  [PROJECT_STATUSES.COMPLETED]: 'Tamamlandı',
  [PROJECT_STATUSES.CANCELLED]: 'İptal',
} as const

export const TASK_STATUS_LABELS = {
  [TASK_STATUSES.TODO]: 'Yapılacak',
  [TASK_STATUSES.IN_PROGRESS]: 'Devam Ediyor',
  [TASK_STATUSES.REVIEW]: 'İncelemede',
  [TASK_STATUSES.COMPLETED]: 'Tamamlandı',
  [TASK_STATUSES.CANCELLED]: 'İptal',
} as const

export const PRIORITY_LABELS = {
  [TASK_PRIORITIES.LOW]: 'Düşük',
  [TASK_PRIORITIES.MEDIUM]: 'Orta',
  [TASK_PRIORITIES.HIGH]: 'Yüksek',
  [TASK_PRIORITIES.URGENT]: 'Acil',
} as const

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.MANAGER]: 'Yönetici',
  [USER_ROLES.MEMBER]: 'Üye'
} as const 