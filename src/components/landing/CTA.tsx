import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function LandingCTA() {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Hemen Başlayın</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Binlerce ekip YAP ile projelerini yönetiyor. Siz de bugün ücretsiz hesap oluşturun!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Ücretsiz Hesap Oluştur
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600">
              Giriş Yap
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
