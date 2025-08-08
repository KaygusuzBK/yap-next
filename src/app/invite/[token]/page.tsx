"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { acceptTeamInvitation } from "../../../features/teams/api"
import { CheckCircle, XCircle, Clock, Users } from "lucide-react"
import Logo from "../../../components/Logo"

type InvitationStatus = 'loading' | 'success' | 'error' | 'expired' | 'already-accepted'

export default function InvitePage() {
  const params = useParams() as { token?: string }
  const router = useRouter()
  const token = params?.token ?? ""
  
  const [status, setStatus] = useState<InvitationStatus>('loading')
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Geçersiz davet linki')
      return
    }

    const acceptInvite = async () => {
      try {
        setStatus('loading')
        await acceptTeamInvitation(token)
        setStatus('success')
        setMessage('Takıma başarıyla katıldınız!')
        // Takım adını almak için ek sorgu yapabiliriz
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu'
        setMessage(errorMessage)
        
        if (errorMessage.includes('süresi dolmuş')) {
          setStatus('expired')
        } else if (errorMessage.includes('zaten kabul edilmiş')) {
          setStatus('already-accepted')
        } else {
          setStatus('error')
        }
      }
    }

    acceptInvite()
  }, [token])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Clock className="h-8 w-8 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
      case 'expired':
      case 'already-accepted':
        return <XCircle className="h-8 w-8 text-red-500" />
      default:
        return null
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Davet İşleniyor...'
      case 'success':
        return 'Davet Kabul Edildi!'
      case 'error':
        return 'Hata Oluştu'
      case 'expired':
        return 'Davet Süresi Dolmuş'
      case 'already-accepted':
        return 'Davet Zaten Kabul Edilmiş'
      default:
        return 'Davet'
    }
  }

  const getStatusDescription = () => {
    switch (status) {
      case 'loading':
        return 'Davet bilgileri kontrol ediliyor...'
      case 'success':
        return 'Artık takımın üyesisiniz. Dashboard&apos;a yönlendiriliyorsunuz...'
      case 'error':
        return message
      case 'expired':
        return 'Bu davet linki artık geçerli değil. Yeni bir davet isteyin.'
      case 'already-accepted':
        return 'Bu daveti daha önce kabul etmişsiniz.'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size={48} withLink={false} />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            {getStatusIcon()}
            {getStatusTitle()}
          </CardTitle>
          <CardDescription>
            {getStatusDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <Users className="h-5 w-5" />
                <span className="font-medium">Takıma katıldınız!</span>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-800">
                <p className="font-medium">Hata Detayı:</p>
                <p className="text-sm mt-1">{message}</p>
              </div>
            </div>
          )}
          
          {status === 'expired' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-yellow-800">
                <p className="font-medium">Davet Süresi Dolmuş</p>
                <p className="text-sm mt-1">Davetler 7 gün geçerlidir.</p>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="flex-1"
              variant={status === 'success' ? 'default' : 'outline'}
            >
              Dashboard&apos;a Git
            </Button>
            
            {status === 'error' || status === 'expired' && (
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
              >
                Ana Sayfa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
