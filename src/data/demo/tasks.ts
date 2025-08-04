import { Task } from '@/lib/types';

export const demoTasks: Task[] = [
  {
    id: 'uuid-1',
    title: 'Veritabanı Tasarımı',
    description: 'E-ticaret platformu için veritabanı şeması oluşturma',
    status: 'completed',
    priority: 'high',
    assigneeId: 'uuid-3',
    projectId: 'uuid-1',
    dueDate: '2024-02-15T17:00:00Z',
    estimatedHours: 16,
    actualHours: 18,
    parentTaskId: null,
    tags: ['database', 'design'],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-02-15T17:30:00Z',
  },
  {
    id: 'uuid-2',
    title: 'Frontend Geliştirme',
    description: 'React ile kullanıcı arayüzü geliştirme',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'uuid-2',
    projectId: 'uuid-1',
    dueDate: '2024-04-15T17:00:00Z',
    estimatedHours: 40,
    actualHours: 25,
    parentTaskId: null,
    tags: ['frontend', 'react'],
    createdAt: '2024-02-01T11:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z',
  },
  {
    id: 'uuid-3',
    title: 'Backend API Geliştirme',
    description: 'Node.js ile REST API geliştirme',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'uuid-1',
    projectId: 'uuid-1',
    dueDate: '2024-04-01T17:00:00Z',
    estimatedHours: 35,
    actualHours: 20,
    parentTaskId: null,
    tags: ['backend', 'api'],
    createdAt: '2024-02-01T11:00:00Z',
    updatedAt: '2024-03-19T16:45:00Z',
  },
  {
    id: 'uuid-4',
    title: 'UI/UX Tasarımı',
    description: 'Mobil uygulama için kullanıcı arayüzü tasarımı',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'uuid-2',
    projectId: 'uuid-2',
    dueDate: '2024-03-30T17:00:00Z',
    estimatedHours: 24,
    actualHours: 0,
    parentTaskId: null,
    tags: ['design', 'ui'],
    createdAt: '2024-02-15T09:00:00Z',
    updatedAt: '2024-02-15T09:00:00Z',
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

export const getOverdueTasks = (): Task[] => {
  const now = new Date();
  return demoTasks.filter(task => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < now && task.status !== 'completed';
  });
};

export const getTasksByPriority = (priority: Task['priority']): Task[] => {
  return demoTasks.filter(task => task.priority === priority);
};

export const getTasksByTag = (tag: string): Task[] => {
  return demoTasks.filter(task => task.tags.includes(tag));
}; 