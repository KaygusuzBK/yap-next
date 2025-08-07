"use client";

import AuthCard from '@/features/auth/components/AuthCard';
import LoginForm from '@/features/auth/components/LoginForm';
import OAuthButtons from '@/features/auth/components/OAuthButtons';
import MagicLink from '@/features/auth/components/MagicLink';

export default function LoginPage() {
  return (
    <AuthCard title="Giriş">
      <LoginForm />
      <OAuthButtons />
      <MagicLink />
    </AuthCard>
  );
}


