import { authService } from '@/lib/services/auth/api'

// Mock axios
jest.mock('@/lib/services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
  handleApiResponse: jest.fn((response) => response.data),
  handleApiError: jest.fn((error) => {
    throw new Error(error.response?.data?.message || `API Error: ${error.response?.status}`);
  }),
}))

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
})

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
  })

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = { token: 'test-token', user: { id: '1', name: 'Test User' } }
      const mockAxios = require('@/lib/services/api').default
      mockAxios.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await authService.login({ email: 'test@example.com', password: 'password' })

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password'
      })
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token')
      expect(result).toEqual(mockResponse)
    })

    it('should throw error on failed login', async () => {
      const mockAxios = require('@/lib/services/api').default
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' }
        }
      }
      mockAxios.post.mockRejectedValueOnce(mockError)

      await expect(authService.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials'
      )
    })
  })

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      authService.logout()
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('authToken')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      window.localStorage.getItem.mockReturnValue('test-token')
      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should return false when no token exists', () => {
      window.localStorage.getItem.mockReturnValue(null)
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('getProfile', () => {
    it('should fetch current user with auth token', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }
      const mockAxios = require('@/lib/services/api').default
      mockAxios.get.mockResolvedValueOnce({ data: mockUser })

      const result = await authService.getProfile()

      expect(mockAxios.get).toHaveBeenCalledWith('/auth/profile')
      expect(result).toEqual(mockUser)
    })
  })

  describe('register', () => {
    it('should register successfully and store token', async () => {
      const mockResponse = { token: 'test-token', user: { id: '1', name: 'Test User' } }
      const mockAxios = require('@/lib/services/api').default
      mockAxios.post.mockResolvedValueOnce({ data: mockResponse })

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password'
      })

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password'
      })
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockUser = { id: '1', name: 'Updated User', email: 'test@example.com' }
      const mockAxios = require('@/lib/services/api').default
      mockAxios.put.mockResolvedValueOnce({ data: mockUser })

      const result = await authService.updateProfile({ name: 'Updated User' })

      expect(mockAxios.put).toHaveBeenCalledWith('/auth/profile', { name: 'Updated User' })
      expect(result).toEqual(mockUser)
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockAxios = require('@/lib/services/api').default
      mockAxios.post.mockResolvedValueOnce({})

      await authService.changePassword({
        currentPassword: 'oldpassword',
        newPassword: 'newpassword'
      })

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword'
      })
    })
  })
}) 