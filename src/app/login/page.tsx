'use client';

import Link from 'next/link'
import { LoginForm } from '@/components/forms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">Y</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Hesabınıza giriş yapın
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Proje yönetimi platformuna hoş geldiniz
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Giriş Yap</CardTitle>
            <CardDescription>
              E-posta ve şifrenizi kullanarak giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Kayıt olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 