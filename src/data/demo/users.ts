import { User } from '@/lib/types';

export const demoUsers: User[] = [
  {
    id: 'uuid-1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    password: 'hashed_password',
    avatar: 'https://example.com/avatar1.jpg',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z',
  },
  {
    id: 'uuid-2',
    name: 'Ayşe Demir',
    email: 'ayse@example.com',
    password: 'hashed_password',
    avatar: 'https://example.com/avatar2.jpg',
    role: 'manager',
    isActive: true,
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-03-19T16:45:00Z',
  },
  {
    id: 'uuid-3',
    name: 'Mehmet Kaya',
    email: 'mehmet@example.com',
    password: 'hashed_password',
    avatar: 'https://example.com/avatar3.jpg',
    role: 'member',
    isActive: true,
    createdAt: '2024-02-01T11:30:00Z',
    updatedAt: '2024-03-18T13:20:00Z',
  },
];

export const getCurrentUser = (): User => demoUsers[0];

export const getUserById = (id: string): User | undefined => {
  return demoUsers.find(user => user.id === id);
};

export const getUsersByRole = (role: User['role']): User[] => {
  return demoUsers.filter(user => user.role === role);
};

export const getActiveUsers = (): User[] => {
  return demoUsers.filter(user => user.isActive);
}; 