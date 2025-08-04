import { Project } from '@/lib/types';

export const demoProjects: Project[] = [
  {
    id: '1',
    title: 'E-Ticaret Platformu Yenileme',
    description: 'Mevcut e-ticaret platformumuzu modern teknolojilerle yeniden tasarlayarak kullanıcı deneyimini iyileştirme projesi.',
    status: 'active',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-06-30T23:59:59Z',
    budget: 150000,
    progress: 65,
    ownerId: '1',
    teamMembers: ['1', '2', '3', '4'],
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    title: 'Mobil Uygulama Geliştirme',
    description: 'iOS ve Android platformları için native mobil uygulama geliştirme projesi.',
    status: 'active',
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-08-31T23:59:59Z',
    budget: 200000,
    progress: 35,
    ownerId: '2',
    teamMembers: ['2', '5', '6'],
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-01-20T16:45:00Z',
  },
  {
    id: '3',
    title: 'Veri Analizi Dashboard',
    description: 'Şirket verilerini görselleştiren ve analiz eden interaktif dashboard projesi.',
    status: 'completed',
    startDate: '2023-10-01T00:00:00Z',
    endDate: '2023-12-31T23:59:59Z',
    budget: 80000,
    progress: 100,
    ownerId: '6',
    teamMembers: ['6', '3', '4'],
    createdAt: '2023-10-01T10:00:00Z',
    updatedAt: '2023-12-31T18:00:00Z',
  },
  {
    id: '4',
    title: 'Güvenlik Sistemi Entegrasyonu',
    description: 'Mevcut sistemlere iki faktörlü kimlik doğrulama ve güvenlik protokolleri entegrasyonu.',
    status: 'paused',
    startDate: '2024-03-01T00:00:00Z',
    endDate: '2024-05-31T23:59:59Z',
    budget: 120000,
    progress: 20,
    ownerId: '1',
    teamMembers: ['1', '2', '5'],
    createdAt: '2024-03-01T11:00:00Z',
    updatedAt: '2024-01-20T12:00:00Z',
  },
  {
    id: '5',
    title: 'Müşteri Destek Sistemi',
    description: 'Müşteri taleplerini yönetmek için ticket sistemi ve chatbot entegrasyonu.',
    status: 'active',
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2024-04-15T23:59:59Z',
    budget: 90000,
    progress: 45,
    ownerId: '2',
    teamMembers: ['2', '3', '4', '6'],
    createdAt: '2024-01-15T14:00:00Z',
    updatedAt: '2024-01-20T17:10:00Z',
  },
];

export const getProjectById = (id: string): Project | undefined => {
  return demoProjects.find(project => project.id === id);
};

export const getProjectsByStatus = (status: Project['status']): Project[] => {
  return demoProjects.filter(project => project.status === status);
};

export const getProjectsByOwner = (ownerId: string): Project[] => {
  return demoProjects.filter(project => project.ownerId === ownerId);
};

export const getProjectsByTeamMember = (memberId: string): Project[] => {
  return demoProjects.filter(project => project.teamMembers.includes(memberId));
};

export const getActiveProjects = (): Project[] => {
  return demoProjects.filter(project => project.status === 'active');
};

export const getCompletedProjects = (): Project[] => {
  return demoProjects.filter(project => project.status === 'completed');
}; 