import { authService } from '@/lib/services/auth/api'

// Mock fetch
global.fetch = jest.fn()

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
  })

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = { token: 'test-token', user: { id: '1', name: 'Test User' } }
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await authService.login({ email: 'test@example.com', password: 'password' })

      expect(fetch).toHaveBeenCalledWith(
        'https://yap-nest-pa3xjusm2-berkans-projects-d2fa45cc.vercel.app/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        })
      )
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'test-token')
      expect(result).toEqual(mockResponse)
    })

    it('should throw error on failed login', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(authService.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        'API Error: 401'
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

  describe('getCurrentUser', () => {
    it('should fetch current user with auth token', async () => {
      const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' }
      window.localStorage.getItem.mockReturnValue('test-token')
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      })

      const result = await authService.getCurrentUser()

      expect(fetch).toHaveBeenCalledWith(
        'https://yap-nest-pa3xjusm2-berkans-projects-d2fa45cc.vercel.app/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
      expect(result).toEqual(mockUser)
    })
  })
}) 