"use client";

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setStatus('E-posta gönderildi. Gelen kutunu kontrol et.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Şifre Sıfırlama</h1>
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
        {status && <p className="text-sm text-green-600">{status}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
        </button>
      </form>
    </main>
  );
}


