"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/lib/services/auth/authService'
import { useAuthStore } from '@/lib/services/auth/store'
import { notify } from '@/lib/services/notifications/notificationService'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuthCallbackPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // URL'den provider bilgisini al
      const provider = searchParams.get('provider') as 'google' | 'github' | 'microsoft'
      
      if (!provider) {
        // Provider belirtilmemişse, session'dan otomatik tespit et
        const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
        
        if (session?.user) {
          // Session varsa kullanıcı bilgilerini al
          await fetchCurrentUser()
          setIsSuccess(true)
          notify.success('Başarıyla giriş yaptınız!')
          
          // 2 saniye sonra dashboard'a yönlendir
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        } else {
          throw new Error('Kimlik doğrulama başarısız')
        }
      } else {
        // Belirli provider için callback işle
        await authService.handleOAuthCallback(provider)
        await fetchCurrentUser()
        setIsSuccess(true)
        notify.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} ile başarıyla giriş yaptınız!`)
        
        // 2 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Kimlik doğrulama başarısız'
      setError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Giriş Başarılı
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Hesabınızla başarıyla giriş yaptınız. Dashboard'a yönlendiriliyorsunuz...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Kimlik Doğrulama
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hesabınız doğrulanıyor...
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm text-gray-600">Doğrulanıyor...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-500"
            >
              Giriş sayfasına dön
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 