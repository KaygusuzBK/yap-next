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

  it('renders dashboard title', async () => {
    // Mock successful API calls
    const { dashboardService } = require('@/lib/services/dashboard/api')
    const { projectService } = require('@/lib/services/projects/api')
    const { taskService } = require('@/lib/services/tasks/api')

    dashboardService.getDashboardStats.mockResolvedValue({
      totalProjects: 10,
      activeProjects: 5,
      completedProjects: 3,
      totalTasks: 50,
      completedTasks: 30,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 1200,
    })
    projectService.getAllProjects.mockResolvedValue([])
    taskService.getAllTasks.mockResolvedValue([])

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<DashboardPage />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('displays dashboard stats when data loads successfully', async () => {
    const mockStats = {
      totalProjects: 10,
      activeProjects: 5,
      completedProjects: 3,
      totalTasks: 50,
      completedTasks: 30,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 1200,
    }

    const mockProjects = [
      {
        id: '1',
        title: 'Test Project',
        description: 'Test project description',
        status: 'active',
        progress: 75,
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        budget: 10000,
        ownerId: '1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    const mockTasks = [
      {
        id: '1',
        title: 'Test Task',
        description: 'Test task description',
        status: 'in_progress',
        priority: 'high',
        assigneeId: '1',
        projectId: '1',
        dueDate: '2024-04-01T00:00:00Z',
        estimatedHours: 8,
        actualHours: 4,
        parentTaskId: null,
        tags: ['test'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    // Mock the service calls
    const { dashboardService } = require('@/lib/services/dashboard/api')
    const { projectService } = require('@/lib/services/projects/api')
    const { taskService } = require('@/lib/services/tasks/api')

    dashboardService.getDashboardStats.mockResolvedValue(mockStats)
    projectService.getAllProjects.mockResolvedValue(mockProjects)
    taskService.getAllTasks.mockResolvedValue(mockTasks)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument() // totalProjects
      expect(screen.getByText('50')).toBeInTheDocument() // totalTasks
      expect(screen.getByText('8')).toBeInTheDocument() // teamMembers
    })
  })

  it('shows error state when API fails', async () => {
    // Mock the service to throw an error
    const { dashboardService } = require('@/lib/services/dashboard/api')
    const { projectService } = require('@/lib/services/projects/api')
    const { taskService } = require('@/lib/services/tasks/api')

    dashboardService.getDashboardStats.mockRejectedValue(new Error('API Error'))
    projectService.getAllProjects.mockRejectedValue(new Error('API Error'))
    taskService.getAllTasks.mockRejectedValue(new Error('API Error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Bağlantı Hatası')).toBeInTheDocument()
      expect(screen.getByText('Tekrar Dene')).toBeInTheDocument()
    })
  })

  it('displays action buttons', async () => {
    // Mock successful API calls
    const { dashboardService } = require('@/lib/services/dashboard/api')
    const { projectService } = require('@/lib/services/projects/api')
    const { taskService } = require('@/lib/services/tasks/api')

    dashboardService.getDashboardStats.mockResolvedValue({
      totalProjects: 10,
      activeProjects: 5,
      completedProjects: 3,
      totalTasks: 50,
      completedTasks: 30,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 1200,
    })
    projectService.getAllProjects.mockResolvedValue([])
    taskService.getAllTasks.mockResolvedValue([])

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Filtrele')).toBeInTheDocument()
      expect(screen.getByText('Yeni Proje')).toBeInTheDocument()
    })
  })

  it('shows demo data when API fails', async () => {
    // Mock the service to throw an error
    const { dashboardService } = require('@/lib/services/dashboard/api')
    const { projectService } = require('@/lib/services/projects/api')
    const { taskService } = require('@/lib/services/tasks/api')

    dashboardService.getDashboardStats.mockRejectedValue(new Error('API Error'))
    projectService.getAllProjects.mockRejectedValue(new Error('API Error'))
    taskService.getAllTasks.mockRejectedValue(new Error('API Error'))

    render(<DashboardPage />)

    await waitFor(() => {
      // Should show demo data instead of error
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Filtrele')).toBeInTheDocument()
      expect(screen.getByText('Yeni Proje')).toBeInTheDocument()
    })
  })
}) 