import { Project } from '@/lib/types';

export const demoProjects: Project[] = [
  {
    id: 'uuid-1',
    title: 'E-ticaret Platformu',
    description: 'Modern e-ticaret platformu geliştirme projesi',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    budget: 50000.00,
    progress: 65,
    ownerId: 'uuid-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z',
  },
  {
    id: 'uuid-2',
    title: 'Mobil Uygulama',
    description: 'iOS ve Android mobil uygulama geliştirme',
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-08-15',
    budget: 75000.00,
    progress: 35,
    ownerId: 'uuid-2',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-19T16:45:00Z',
  },
  {
    id: 'uuid-3',
    title: 'Web Sitesi Yenileme',
    description: 'Kurumsal web sitesi yenileme projesi',
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2024-03-01',
    budget: 25000.00,
    progress: 100,
    ownerId: 'uuid-1',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-03-01T17:00:00Z',
  },
];

export const getProjectById = (id: string): Project | undefined => {
  return demoProjects.find(project => project.id === id);
};

export const getProjectsByStatus = (status: Project['status']): Project[] => {
  return demoProjects.filter(project => project.status === status);
};

export const getActiveProjects = (): Project[] => {
  return demoProjects.filter(project => project.status === 'active');
};

export const getProjectsByOwner = (ownerId: string): Project[] => {
  return demoProjects.filter(project => project.ownerId === ownerId);
}; 