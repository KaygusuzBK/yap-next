import { Task } from '@/lib/types';

export const demoTasks: Task[] = [
  // E-Ticaret Platformu Yenileme Projesi Görevleri
  {
    id: '1',
    title: 'UI/UX Tasarımı Tamamlama',
    description: 'Ana sayfa ve ürün detay sayfalarının modern tasarımını tamamlama',
    status: 'completed',
    priority: 'high',
    assigneeId: '3',
    projectId: '1',
    dueDate: '2024-01-15T23:59:59Z',
    estimatedHours: 40,
    actualHours: 38,
    dependencies: [],
    tags: ['design', 'ui', 'ux'],
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-15T18:00:00Z',
  },
  {
    id: '2',
    title: 'Frontend Geliştirme',
    description: 'React ile ana bileşenlerin geliştirilmesi',
    status: 'in_progress',
    priority: 'high',
    assigneeId: '4',
    projectId: '1',
    dueDate: '2024-02-15T23:59:59Z',
    estimatedHours: 80,
    actualHours: 45,
    dependencies: ['1'],
    tags: ['frontend', 'react', 'development'],
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-20T16:30:00Z',
  },
  {
    id: '3',
    title: 'Backend API Geliştirme',
    description: 'Node.js ile REST API endpoints geliştirme',
    status: 'in_progress',
    priority: 'high',
    assigneeId: '2',
    projectId: '1',
    dueDate: '2024-02-28T23:59:59Z',
    estimatedHours: 60,
    actualHours: 35,
    dependencies: [],
    tags: ['backend', 'api', 'nodejs'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
  },
  {
    id: '4',
    title: 'Veritabanı Tasarımı',
    description: 'PostgreSQL veritabanı şeması ve migration dosyaları',
    status: 'completed',
    priority: 'medium',
    assigneeId: '1',
    projectId: '1',
    dueDate: '2024-01-20T23:59:59Z',
    estimatedHours: 20,
    actualHours: 18,
    dependencies: [],
    tags: ['database', 'postgresql'],
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-20T12:00:00Z',
  },
  {
    id: '5',
    title: 'Test Yazımı',
    description: 'Unit ve integration testlerinin yazılması',
    status: 'todo',
    priority: 'medium',
    assigneeId: '3',
    projectId: '1',
    dueDate: '2024-03-15T23:59:59Z',
    estimatedHours: 30,
    actualHours: 0,
    dependencies: ['2', '3'],
    tags: ['testing', 'unit-tests'],
    createdAt: '2024-01-20T15:00:00Z',
    updatedAt: '2024-01-20T15:00:00Z',
  },

  // Mobil Uygulama Geliştirme Projesi Görevleri
  {
    id: '6',
    title: 'iOS Uygulama Geliştirme',
    description: 'Swift ile iOS uygulamasının temel özelliklerinin geliştirilmesi',
    status: 'in_progress',
    priority: 'high',
    assigneeId: '5',
    projectId: '2',
    dueDate: '2024-05-31T23:59:59Z',
    estimatedHours: 120,
    actualHours: 45,
    dependencies: [],
    tags: ['ios', 'swift', 'mobile'],
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-01-20T17:30:00Z',
  },
  {
    id: '7',
    title: 'Android Uygulama Geliştirme',
    description: 'Kotlin ile Android uygulamasının geliştirilmesi',
    status: 'todo',
    priority: 'high',
    assigneeId: '6',
    projectId: '2',
    dueDate: '2024-06-30T23:59:59Z',
    estimatedHours: 100,
    actualHours: 0,
    dependencies: [],
    tags: ['android', 'kotlin', 'mobile'],
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '8',
    title: 'API Entegrasyonu',
    description: 'Mobil uygulamalar için backend API entegrasyonu',
    status: 'review',
    priority: 'medium',
    assigneeId: '2',
    projectId: '2',
    dueDate: '2024-04-15T23:59:59Z',
    estimatedHours: 40,
    actualHours: 35,
    dependencies: ['6'],
    tags: ['api', 'integration'],
    createdAt: '2024-02-15T14:00:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
  },

  // Müşteri Destek Sistemi Projesi Görevleri
  {
    id: '9',
    title: 'Ticket Sistemi Tasarımı',
    description: 'Müşteri taleplerini yönetmek için ticket sistemi tasarımı',
    status: 'completed',
    priority: 'high',
    assigneeId: '4',
    projectId: '5',
    dueDate: '2024-02-01T23:59:59Z',
    estimatedHours: 25,
    actualHours: 22,
    dependencies: [],
    tags: ['design', 'ticket-system'],
    createdAt: '2024-01-15T14:00:00Z',
    updatedAt: '2024-02-01T18:00:00Z',
  },
  {
    id: '10',
    title: 'Chatbot Entegrasyonu',
    description: 'AI tabanlı chatbot entegrasyonu ve eğitimi',
    status: 'in_progress',
    priority: 'medium',
    assigneeId: '3',
    projectId: '5',
    dueDate: '2024-03-15T23:59:59Z',
    estimatedHours: 35,
    actualHours: 20,
    dependencies: ['9'],
    tags: ['ai', 'chatbot', 'integration'],
    createdAt: '2024-02-02T11:00:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
  },
  {
    id: '11',
    title: 'Bildirim Sistemi',
    description: 'Email ve SMS bildirim sistemi geliştirme',
    status: 'todo',
    priority: 'low',
    assigneeId: '6',
    projectId: '5',
    dueDate: '2024-04-01T23:59:59Z',
    estimatedHours: 20,
    actualHours: 0,
    dependencies: ['9'],
    tags: ['notifications', 'email', 'sms'],
    createdAt: '2024-02-10T16:00:00Z',
    updatedAt: '2024-02-10T16:00:00Z',
  },
];

export const getTaskById = (id: string): Task | undefined => {
  return demoTasks.find(task => task.id === id);
};

export const getTasksByProject = (projectId: string): Task[] => {
  return demoTasks.filter(task => task.projectId === projectId);
};

export const getTasksByStatus = (status: Task['status']): Task[] => {
  return demoTasks.filter(task => task.status === status);
};

export const getTasksByAssignee = (assigneeId: string): Task[] => {
  return demoTasks.filter(task => task.assigneeId === assigneeId);
};

export const getTasksByPriority = (priority: Task['priority']): Task[] => {
  return demoTasks.filter(task => task.priority === priority);
};

export const getOverdueTasks = (): Task[] => {
  const now = new Date();
  return demoTasks.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < now && task.status !== 'completed';
  });
};

export const getTasksByTag = (tag: string): Task[] => {
  return demoTasks.filter(task => task.tags.includes(tag));
}; 