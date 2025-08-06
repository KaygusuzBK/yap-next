"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotification } from '@/hooks/useNotification'

export default function NotificationsDemoPage() {
  const { 
    showSuccess, 
    showError, 
    showInfo, 
    showWarning, 
    showLoading, 
    dismissAll,
    showPromise 
  } = useNotification()

  const handlePromiseDemo = async () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve('İşlem başarılı!')
        } else {
          reject(new Error('İşlem başarısız!'))
        }
      }, 2000)
    })

    showPromise(promise, {
      loading: 'İşlem yapılıyor...',
      success: 'İşlem başarıyla tamamlandı!',
      error: 'İşlem sırasında hata oluştu!'
    })
  }

  const handleLoadingDemo = () => {
    const loadingToast = showLoading('Yükleniyor...')
    
    setTimeout(() => {
      dismissAll()
      showSuccess('Yükleme tamamlandı!')
    }, 3000)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Notification Sistemi Demo</h1>
          <p className="text-gray-600">
            Farklı notification türlerini test edebilirsiniz
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Başarılı Bildirimler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Başarılı Bildirimler</CardTitle>
              <CardDescription>
                Yeşil renkli başarı bildirimleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => showSuccess('İşlem başarıyla tamamlandı!')}
                className="w-full"
                variant="outline"
              >
                Basit Başarı
              </Button>
              <Button 
                onClick={() => showSuccess('Hesabınız başarıyla oluşturuldu!', { duration: 6000 })}
                className="w-full"
                variant="outline"
              >
                Uzun Süreli Başarı
              </Button>
            </CardContent>
          </Card>

          {/* Hata Bildirimleri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Hata Bildirimleri</CardTitle>
              <CardDescription>
                Kırmızı renkli hata bildirimleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => showError('Bir hata oluştu!')}
                className="w-full"
                variant="outline"
              >
                Basit Hata
              </Button>
              <Button 
                onClick={() => showError('Giriş yapılırken hata oluştu. Lütfen tekrar deneyin.', { duration: 8000 })}
                className="w-full"
                variant="outline"
              >
                Detaylı Hata
              </Button>
            </CardContent>
          </Card>

          {/* Bilgi Bildirimleri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Bilgi Bildirimleri</CardTitle>
              <CardDescription>
                Mavi renkli bilgi bildirimleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => showInfo('Yeni bir güncelleme mevcut!')}
                className="w-full"
                variant="outline"
              >
                Basit Bilgi
              </Button>
              <Button 
                onClick={() => showInfo('Sistem bakımı 2 saat sürecek.', { duration: 5000 })}
                className="w-full"
                variant="outline"
              >
                Sistem Bilgisi
              </Button>
            </CardContent>
          </Card>

          {/* Uyarı Bildirimleri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-600">Uyarı Bildirimleri</CardTitle>
              <CardDescription>
                Sarı renkli uyarı bildirimleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => showWarning('Dikkat! Bu işlem geri alınamaz.')}
                className="w-full"
                variant="outline"
              >
                Basit Uyarı
              </Button>
              <Button 
                onClick={() => showWarning('Şifreniz 3 gün içinde sona erecek.', { duration: 7000 })}
                className="w-full"
                variant="outline"
              >
                Şifre Uyarısı
              </Button>
            </CardContent>
          </Card>

          {/* Yükleme Bildirimleri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-600">Yükleme Bildirimleri</CardTitle>
              <CardDescription>
                Gri renkli yükleme bildirimleri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleLoadingDemo}
                className="w-full"
                variant="outline"
              >
                Yükleme Demo (3s)
              </Button>
            </CardContent>
          </Card>

          {/* Promise Bildirimleri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">Promise Bildirimleri</CardTitle>
              <CardDescription>
                Promise tabanlı bildirimler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handlePromiseDemo}
                className="w-full"
                variant="outline"
              >
                Promise Demo (2s)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Kontrol Butonları */}
        <div className="mt-8 text-center">
          <Card>
            <CardHeader>
              <CardTitle>Kontrol</CardTitle>
              <CardDescription>
                Bildirimleri yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={dismissAll}
                variant="destructive"
                className="mr-4"
              >
                Tüm Bildirimleri Kapat
              </Button>
              <Button 
                onClick={() => {
                  showSuccess('Test başarılı!')
                  showError('Test hatası!')
                  showInfo('Test bilgisi!')
                  showWarning('Test uyarısı!')
                }}
                variant="outline"
              >
                Tüm Türleri Test Et
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 