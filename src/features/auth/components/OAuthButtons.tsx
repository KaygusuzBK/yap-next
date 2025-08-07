"use client";

import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Github, Chrome } from 'lucide-react';

export default function OAuthButtons() {
  const signInWith = async (provider: 'github' | 'google') => {
    const supabase = getSupabase();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
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


