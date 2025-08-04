import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '@/lib/services/auth/store'
import { authService } from '@/lib/services/auth/api'

// Mock the auth service
jest.mock('@/lib/services/auth/api', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store state
    act(() => {
      useAuthStore.setState({
        user: null,
        loading: false,
        error: null,
      })
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }
      ;(authService.login as jest.Mock).mockResolvedValueOnce({ token: 'test-token' })
      ;(authService.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'password')
      })

      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      })
      expect(authService.getCurrentUser).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials'
      ;(authService.login as jest.Mock).mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'wrong')
      })

      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('logout', () => {
    it('should logout successfully', () => {
      const { result } = renderHook(() => useAuthStore())

      // Set initial state
      act(() => {
        useAuthStore.setState({ user: { id: '1', name: 'Test User' } })
      })

      act(() => {
        result.current.logout()
      })

      expect(authService.logout).toHaveBeenCalled()
      expect(result.current.user).toBeNull()
    })
  })

  describe('fetchCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }
      ;(authService.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser)

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.fetchCurrentUser()
      })

      expect(authService.getCurrentUser).toHaveBeenCalled()
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.loading).toBe(false)
    })

    it('should handle fetch error', async () => {
      ;(authService.getProfile as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.fetchCurrentUser()
      })

      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(false)
    })
  })
}) 