import { LandingHeader } from '@/components/landing/Header';
import { LandingHero } from '@/components/landing/Hero';
import { LandingStats } from '@/components/landing/Stats';
import { LandingFeatures } from '@/components/landing/Features';
import { LandingCTA } from '@/components/landing/CTA';
import { LandingFooter } from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <LandingHeader />
      <LandingHero />
      <LandingStats />
      <LandingFeatures />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
