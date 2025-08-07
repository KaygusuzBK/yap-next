import Hero from '@/features/landing/Hero';
import Features from '@/features/landing/Features';
import Stats from '@/features/landing/Stats';
import CTA from '@/features/landing/CTA';

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <Features />
      <CTA />
    </main>
  );
}
