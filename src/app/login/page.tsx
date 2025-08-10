"use client";

import AuthCard from '@/features/auth/components/AuthCard';
import LoginForm from '@/features/auth/components/LoginForm';
import OAuthButtons from '@/features/auth/components/OAuthButtons';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  if (!loading && user) return null;

  return (
    <AuthCard title="Giriş">
      <LoginForm />
      <OAuthButtons />
    </AuthCard>
  );
}


