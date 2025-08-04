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

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders dashboard title', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
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
        status: 'active',
        progress: 75,
      },
    ]

    const mockTasks = [
      {
        id: '1',
        title: 'Test Task',
        status: 'in_progress',
        priority: 'high',
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
    dashboardService.getDashboardStats.mockRejectedValue(new Error('API Error'))

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
}) 