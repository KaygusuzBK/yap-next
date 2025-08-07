"use client";

import AuthCard from '@/features/auth/components/AuthCard';
import LoginForm from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthCard title="Giriş">
      <LoginForm />
    </AuthCard>
  );
}


