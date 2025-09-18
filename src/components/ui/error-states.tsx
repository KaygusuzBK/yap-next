"use client"

import React from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"

interface ErrorStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  variant?: "default" | "card" | "minimal"
  icon?: React.ReactNode
  showRetry?: boolean
  onRetry?: () => void
  showHome?: boolean
  onHome?: () => void
  showBack?: boolean
  onBack?: () => void
}

export function ErrorState({
  title = "Bir hata oluştu",
  description = "Beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin.",
  actionLabel,
  onAction,
  variant = "default",
  icon = <AlertTriangle className="h-8 w-8" />,
  showRetry = true,
  onRetry,
  showHome = false,
  onHome,
  showBack = false,
  onBack
}: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
      <div className="text-destructive">{icon}</div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {showRetry && onRetry && (
          <Button variant="outline" onClick={onRetry} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tekrar Dene
          </Button>
        )}
        {showBack && onBack && (
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        )}
        {showHome && onHome && (
          <Button variant="outline" onClick={onHome} size="sm">
            <Home className="h-4 w-4 mr-2" />
            Ana Sayfa
          </Button>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )

  if (variant === "card") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Hata</CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    )
  }

  if (variant === "minimal") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {title}: {description}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
      {content}
    </div>
  )
}

// Özel hata durumları
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Bağlantı Hatası"
      description="Sunucuya bağlanırken bir sorun oluştu. İnternet bağlantınızı kontrol edin."
      onRetry={onRetry}
      showRetry={true}
    />
  )
}

export function NotFoundError({ 
  resource = "Sayfa", 
  onBack 
}: { 
  resource?: string
  onBack?: () => void 
}) {
  return (
    <ErrorState
      title={`${resource} Bulunamadı`}
      description="Aradığınız sayfa veya kaynak mevcut değil."
      onBack={onBack}
      showBack={true}
      showHome={true}
    />
  )
}

export function UnauthorizedError({ onHome }: { onHome?: () => void }) {
  return (
    <ErrorState
      title="Yetkisiz Erişim"
      description="Bu sayfaya erişim yetkiniz bulunmuyor."
      onHome={onHome}
      showHome={true}
    />
  )
}

export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Sunucu Hatası"
      description="Sunucuda bir sorun oluştu. Lütfen daha sonra tekrar deneyin."
      onRetry={onRetry}
      showRetry={true}
    />
  )
}
