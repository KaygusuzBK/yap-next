"use client";

import AuthCard from '@/features/auth/components/AuthCard';
import RegisterForm from '@/features/auth/components/RegisterForm';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  if (!loading && user) return null;

  return (
    <AuthCard title="Kayıt">
      <RegisterForm />
    </AuthCard>
  );
}


