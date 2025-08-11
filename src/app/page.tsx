"use client";

import Hero from '@/features/landing/Hero';
import Features from '@/features/landing/Features';
import Stats from '@/features/landing/Stats';
import CTA from '@/features/landing/CTA';
import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  return (
    <main>
      <Hero />
      <Stats />
      <Features />
      <CTA />
    </main>
  );
}
