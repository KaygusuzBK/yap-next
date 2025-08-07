"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authService } from '@/lib/services/auth/authService'
import { notify } from '@/lib/services/notifications/notificationService'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  const verifyEmail = useCallback(async (emailToken: string) => {
    try {
      setIsLoading(true)
      setError(null)
      await authService.verifyEmail(emailToken)
      setIsSuccess(true)
      notify.success('E-posta başarıyla doğrulandı')
      
      // 3 saniye sonra login sayfasına yönlendir
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      const errorMessage = error.message || 'E-posta doğrulama başarısız'
      setError(errorMessage)
      notify.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    // URL'den token'ı al
    const tokenParam = searchParams.get('token')
    
    if (tokenParam) {
      setToken(tokenParam)
      verifyEmail(tokenParam)
    } else {
      setError('Geçersiz veya eksik doğrulama bağlantısı')
    }
  }, [searchParams, verifyEmail])

  const resendVerification = async () => {
    const email = searchParams.get('email')
    if (!email) {
      const errorMessage = 'E-posta adresi bulunamadı'
      setError(errorMessage)
      notify.error(errorMessage)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      await authService.resendVerification(email)
      setIsSuccess(true)
      notify.success('Doğrulama e-postası yeniden gönderildi')
    } catch (error: any) {
      const errorMessage = error.message || 'Doğrulama e-postası gönderilemedi'
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
              E-posta Doğrulandı
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              E-posta adresiniz başarıyla doğrulandı. Giriş sayfasına yönlendiriliyorsunuz...
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
            E-posta Doğrulama
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            E-posta adresinizi doğruluyoruz...
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
          <div className="space-y-4">
            <Button 
              onClick={resendVerification}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                'Doğrulama E-postasını Yeniden Gönder'
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Giriş Sayfasına Dön
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Yükleniyor...
            </h2>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
} 