import { User } from '@/lib/types';

export const demoUsers: User[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@yapnext.com',
    avatar: '/avatars/ahmet.jpg',
    role: 'admin',
    createdAt: '2024-01-15T10:00:00Z',
    lastActive: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'Ayşe Demir',
    email: 'ayse@yapnext.com',
    avatar: '/avatars/ayse.jpg',
    role: 'project_leader',
    createdAt: '2024-01-16T09:00:00Z',
    lastActive: '2024-01-20T16:45:00Z',
  },
  {
    id: '3',
    name: 'Mehmet Kaya',
    email: 'mehmet@yapnext.com',
    avatar: '/avatars/mehmet.jpg',
    role: 'team_member',
    createdAt: '2024-01-17T11:00:00Z',
    lastActive: '2024-01-20T15:20:00Z',
  },
  {
    id: '4',
    name: 'Fatma Özkan',
    email: 'fatma@yapnext.com',
    avatar: '/avatars/fatma.jpg',
    role: 'team_member',
    createdAt: '2024-01-18T08:00:00Z',
    lastActive: '2024-01-20T17:10:00Z',
  },
  {
    id: '5',
    name: 'Ali Çelik',
    email: 'ali@yapnext.com',
    avatar: '/avatars/ali.jpg',
    role: 'team_member',
    createdAt: '2024-01-19T10:30:00Z',
    lastActive: '2024-01-20T13:45:00Z',
  },
  {
    id: '6',
    name: 'Zeynep Arslan',
    email: 'zeynep@yapnext.com',
    avatar: '/avatars/zeynep.jpg',
    role: 'project_leader',
    createdAt: '2024-01-20T09:15:00Z',
    lastActive: '2024-01-20T18:30:00Z',
  },
];

export const getCurrentUser = (): User => {
  return demoUsers[0]; // Demo için ilk kullanıcıyı döndür
};

export const getUserById = (id: string): User | undefined => {
  return demoUsers.find(user => user.id === id);
};

export const getUsersByRole = (role: User['role']): User[] => {
  return demoUsers.filter(user => user.role === role);
}; 