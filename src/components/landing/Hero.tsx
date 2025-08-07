import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Rocket, Play } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
          <Zap className="w-4 h-4 mr-2" />
          Yeni Nesil Proje Yönetimi
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
          Projelerinizi
          <span className="block text-blue-600">Yönetin</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Modern proje yönetim platformu ile projelerinizi organize edin, 
          görevlerinizi takip edin ve ekibinizle mükemmel işbirliği yapın.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Rocket className="w-5 h-5 mr-2" />
              Ücretsiz Başla
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Play className="w-5 h-5 mr-2" />
              Demo İzle
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
