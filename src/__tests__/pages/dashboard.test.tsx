import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

// Mock the services
jest.mock('@/lib/services/dashboard/api', () => ({
  dashboardService: {
    getDashboardStats: jest.fn(),
  },
}))

jest.mock('@/lib/services/projects/api', () => ({
  projectService: {
    getAllProjects: jest.fn(),
  },
}))

jest.mock('@/lib/services/tasks/api', () => ({
  taskService: {
    getAllTasks: jest.fn(),
  },
}))

// Mock demo data imports
jest.mock('@/data/demo/projects', () => ({
  demoProjects: [
    {
      id: '1',
      title: 'Demo Project',
      description: 'Bu bir demo proje açıklamasıdır',
      status: 'active',
      progress: 75,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      budget: 10000,
      ownerId: '1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
}))

jest.mock('@/data/demo/tasks', () => ({
  demoTasks: [
    {
      id: '1',
      title: 'Demo Task',
      description: 'Bu bir demo görev açıklamasıdır',
      status: 'in_progress',
      priority: 'high',
      assigneeId: '1',
      projectId: '1',
      dueDate: '2024-04-01T00:00:00Z',
      estimatedHours: 8,
      actualHours: 4,
      parentTaskId: null,
      tags: ['demo', 'test'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
}))

jest.mock('@/data/demo/users', () => ({
  demoUsers: [
    {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'hashed_password',
      avatar: 'https://example.com/avatar.jpg',
      role: 'member',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
}))

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display dashboard stats when data loads successfully', async () => {
    const mockDashboardService = require('@/lib/services/dashboard/api').dashboardService
    const mockProjectService = require('@/lib/services/projects/api').projectService
    const mockTaskService = require('@/lib/services/tasks/api').taskService

    mockDashboardService.getDashboardStats.mockResolvedValueOnce({
      totalProjects: 5,
      activeProjects: 3,
      completedProjects: 2,
      totalTasks: 25,
      completedTasks: 15,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 120,
    })

    mockProjectService.getAllProjects.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          title: 'Test Project',
          status: 'active',
          progress: 75,
        },
      ],
    })

    mockTaskService.getAllTasks.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          title: 'Test Task',
          status: 'in_progress',
          priority: 'high',
        },
      ],
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // Total projects
      expect(screen.getByText('25')).toBeInTheDocument() // Total tasks
      expect(screen.getByText('8')).toBeInTheDocument() // Team members
    })
  })

  it('should handle API errors gracefully', async () => {
    const mockDashboardService = require('@/lib/services/dashboard/api').dashboardService
    const mockProjectService = require('@/lib/services/projects/api').projectService
    const mockTaskService = require('@/lib/services/tasks/api').taskService

    mockDashboardService.getDashboardStats.mockRejectedValueOnce(new Error('API Error'))
    mockProjectService.getAllProjects.mockRejectedValueOnce(new Error('API Error'))
    mockTaskService.getAllTasks.mockRejectedValueOnce(new Error('API Error'))

    render(<DashboardPage />)

    await waitFor(() => {
      // Should still render the page even with errors
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('should display action buttons', async () => {
    const mockDashboardService = require('@/lib/services/dashboard/api').dashboardService
    const mockProjectService = require('@/lib/services/projects/api').projectService
    const mockTaskService = require('@/lib/services/tasks/api').taskService

    mockDashboardService.getDashboardStats.mockRejectedValueOnce(new Error('API Error'))
    mockProjectService.getAllProjects.mockRejectedValueOnce(new Error('API Error'))
    mockTaskService.getAllTasks.mockRejectedValueOnce(new Error('API Error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Yeni Proje')).toBeInTheDocument()
      expect(screen.getByText('Filtrele')).toBeInTheDocument()
    })
  })

  it('should display project cards when projects are loaded', async () => {
    const mockDashboardService = require('@/lib/services/dashboard/api').dashboardService
    const mockProjectService = require('@/lib/services/projects/api').projectService
    const mockTaskService = require('@/lib/services/tasks/api').taskService

    mockDashboardService.getDashboardStats.mockResolvedValueOnce({
      totalProjects: 5,
      activeProjects: 3,
      completedProjects: 2,
      totalTasks: 25,
      completedTasks: 15,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 120,
    })

    mockProjectService.getAllProjects.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          title: 'Test Project',
          description: 'Test project description',
          status: 'active',
          progress: 75,
        },
      ],
    })

    mockTaskService.getAllTasks.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test task description',
          status: 'in_progress',
          priority: 'high',
        },
      ],
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
  })

  it('should display task cards when tasks are loaded', async () => {
    const mockDashboardService = require('@/lib/services/dashboard/api').dashboardService
    const mockProjectService = require('@/lib/services/projects/api').projectService
    const mockTaskService = require('@/lib/services/tasks/api').taskService

    mockDashboardService.getDashboardStats.mockResolvedValueOnce({
      totalProjects: 5,
      activeProjects: 3,
      completedProjects: 2,
      totalTasks: 25,
      completedTasks: 15,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 120,
    })

    mockProjectService.getAllProjects.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          title: 'Test Project',
          description: 'Test project description',
          status: 'active',
          progress: 75,
        },
      ],
    })

    mockTaskService.getAllTasks.mockResolvedValueOnce({
      data: [
        {
          id: '1',
          title: 'Test Task',
          description: 'Test task description',
          status: 'in_progress',
          priority: 'high',
        },
      ],
    })

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })
  })
}) 