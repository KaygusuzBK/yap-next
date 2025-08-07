"use client";

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import Input from '@/components/ui/input';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function MagicLink() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const onSend = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success('Giriş bağlantısı gönderildi');
  };
  return (
    <div className="space-y-2">
      <Input type="email" placeholder="ornek@mail.com" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
      <Button type="button" onClick={onSend} disabled={loading}>
        {loading ? 'Gönderiliyor...' : 'Magic Link Gönder'}
      </Button>
    </div>
  );
}


