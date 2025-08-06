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

export const PROJECT_PRIORITIES = {
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

export const PROJECT_MEMBER_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  MEMBER: 'member',
  VIEWER: 'viewer'
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

export const PRIORITY_COLORS = {
  [TASK_PRIORITIES.LOW]: 'bg-green-100 text-green-800',
  [TASK_PRIORITIES.MEDIUM]: 'bg-blue-100 text-blue-800',
  [TASK_PRIORITIES.HIGH]: 'bg-orange-100 text-orange-800',
  [TASK_PRIORITIES.URGENT]: 'bg-red-100 text-red-800',
} as const

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.MANAGER]: 'Yönetici',
  [USER_ROLES.MEMBER]: 'Üye'
} as const

export const PROJECT_MEMBER_ROLE_LABELS = {
  [PROJECT_MEMBER_ROLES.OWNER]: 'Sahip',
  [PROJECT_MEMBER_ROLES.MANAGER]: 'Yönetici',
  [PROJECT_MEMBER_ROLES.MEMBER]: 'Üye',
  [PROJECT_MEMBER_ROLES.VIEWER]: 'İzleyici'
} as const

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
} as const

export const NOTIFICATION_TYPE_COLORS = {
  [NOTIFICATION_TYPES.INFO]: 'bg-blue-100 text-blue-800',
  [NOTIFICATION_TYPES.SUCCESS]: 'bg-green-100 text-green-800',
  [NOTIFICATION_TYPES.WARNING]: 'bg-yellow-100 text-yellow-800',
  [NOTIFICATION_TYPES.ERROR]: 'bg-red-100 text-red-800',
} as const

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const

export const LANGUAGES = {
  TR: 'tr',
  EN: 'en'
} as const

export const RECURRING_PATTERNS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
} as const

export const RECURRING_PATTERN_LABELS = {
  [RECURRING_PATTERNS.DAILY]: 'Günlük',
  [RECURRING_PATTERNS.WEEKLY]: 'Haftalık',
  [RECURRING_PATTERNS.MONTHLY]: 'Aylık',
  [RECURRING_PATTERNS.YEARLY]: 'Yıllık'
} as const 