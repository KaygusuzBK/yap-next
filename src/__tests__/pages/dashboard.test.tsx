import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { dashboardService } from '@/lib/services/dashboard/api';
import { projectService } from '@/lib/services/projects/api';
import { taskService } from '@/lib/services/tasks/api';

// Mock the services
jest.mock('@/lib/services/dashboard/api');
jest.mock('@/lib/services/projects/api');
jest.mock('@/lib/services/tasks/api');

const mockDashboardService = dashboardService as jest.Mocked<typeof dashboardService>;
const mockProjectService = projectService as jest.Mocked<typeof projectService>;
const mockTaskService = taskService as jest.Mocked<typeof taskService>;

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard with stats and data', async () => {
    // Mock successful API responses
    mockDashboardService.getDashboardStats.mockResolvedValueOnce({
      totalProjects: 10,
      activeProjects: 5,
      completedProjects: 3,
      totalTasks: 25,
      completedTasks: 15,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 120,
    });

    mockProjectService.getAllProjects.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 10000,
        progress: 50,
        ownerId: 'user1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]);

    mockTaskService.getAllTasks.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Test Task',
        description: 'Test Task Description',
        status: 'in_progress',
        priority: 'medium',
        assigneeId: 'user1',
        projectId: 'project1',
        dueDate: '2024-12-31',
        estimatedHours: 8,
        actualHours: 4,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]);

    render(<DashboardPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check if dashboard title is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Check if stats are displayed
    expect(screen.getByText('10')).toBeInTheDocument(); // totalProjects
    expect(screen.getByText('25')).toBeInTheDocument(); // totalTasks
    expect(screen.getByText('8')).toBeInTheDocument(); // teamMembers
    expect(screen.getByText('120')).toBeInTheDocument(); // totalHours
  });

  it('should display action buttons', async () => {
    // Mock successful API responses
    mockDashboardService.getDashboardStats.mockResolvedValueOnce({
      totalProjects: 10,
      activeProjects: 5,
      completedProjects: 3,
      totalTasks: 25,
      completedTasks: 15,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 120,
    });

    mockProjectService.getAllProjects.mockResolvedValueOnce([]);
    mockTaskService.getAllTasks.mockResolvedValueOnce([]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check if action buttons are present
    expect(screen.getByText('Filtrele')).toBeInTheDocument();
    expect(screen.getByText('Yeni Proje')).toBeInTheDocument();
  });

  it('should display project cards when projects are loaded', async () => {
    // Mock successful API responses
    mockDashboardService.getDashboardStats.mockResolvedValueOnce({
      totalProjects: 10,
      activeProjects: 5,
      completedProjects: 3,
      totalTasks: 25,
      completedTasks: 15,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 120,
    });

    mockProjectService.getAllProjects.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Test Project',
        description: 'Test Description',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        budget: 10000,
        progress: 50,
        ownerId: 'user1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]);

    mockTaskService.getAllTasks.mockResolvedValueOnce([]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check if project card is displayed
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should display task cards when tasks are loaded', async () => {
    // Mock successful API responses
    mockDashboardService.getDashboardStats.mockResolvedValueOnce({
      totalProjects: 10,
      activeProjects: 5,
      completedProjects: 3,
      totalTasks: 25,
      completedTasks: 15,
      overdueTasks: 2,
      teamMembers: 8,
      totalHours: 120,
    });

    mockProjectService.getAllProjects.mockResolvedValueOnce([]);

    mockTaskService.getAllTasks.mockResolvedValueOnce([
      {
        id: '1',
        title: 'Test Task',
        description: 'Test Task Description',
        status: 'in_progress',
        priority: 'medium',
        assigneeId: 'user1',
        projectId: 'project1',
        dueDate: '2024-12-31',
        estimatedHours: 8,
        actualHours: 4,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check if task card is displayed
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Task Description')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockDashboardService.getDashboardStats.mockRejectedValueOnce(new Error('API Error'));
    mockProjectService.getAllProjects.mockRejectedValueOnce(new Error('API Error'));
    mockTaskService.getAllTasks.mockRejectedValueOnce(new Error('API Error'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Should still render the dashboard with fallback data
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
}); 