import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BarChart3, Calendar, Shield, Zap, CheckCircle } from 'lucide-react';

export function LandingFeatures() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Neden YAP?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modern ekipler için tasarlanmış güçlü özellikler
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Ekip İşbirliği</CardTitle>
              <CardDescription>
                Gerçek zamanlı işbirliği ile ekibinizle birlikte çalışın, görevleri atayın ve ilerlemeyi takip edin.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Gelişmiş Analitik</CardTitle>
              <CardDescription>
                Proje performansınızı analiz edin, raporlar oluşturun ve veri odaklı kararlar alın.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Akıllı Planlama</CardTitle>
              <CardDescription>
                Otomatik zamanlama, tekrarlayan görevler ve akıllı hatırlatmalarla planlamanızı optimize edin.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Güvenli Altyapı</CardTitle>
              <CardDescription>
                Enterprise-grade güvenlik ile verileriniz her zaman güvende ve yedeklenmiş durumda.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle>Hızlı ve Responsive</CardTitle>
              <CardDescription>
                Modern teknolojiler ile geliştirilmiş hızlı ve her cihazda mükemmel çalışan arayüz.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle>Kolay Kullanım</CardTitle>
              <CardDescription>
                Sezgisel arayüz ile dakikalar içinde projelerinizi oluşturun ve yönetmeye başlayın.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}
