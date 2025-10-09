"use client";

import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Github, Chrome } from 'lucide-react';

export default function OAuthButtons() {
  const signInWith = async (provider: 'github' | 'google') => {
    const supabase = getSupabase();
    const redirectTo = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
      : `${window.location.origin}/dashboard`;
    
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
  };
  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" onClick={() => signInWith('github')}>
        <Github /> GitHub ile devam et
      </Button>
      <Button type="button" variant="outline" onClick={() => signInWith('google')}>
        <Chrome /> Google ile devam et
      </Button>
    </div>
  );
}


