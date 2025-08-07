"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase new password flow may redirect with access token; if not, we still show form.
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
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
        <h1 className="text-2xl font-semibold">Yeni Şifre</h1>
        <input
          type="password"
          placeholder="Yeni şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {done && <p className="text-sm text-green-600">Şifre güncellendi, yönlendiriliyorsunuz...</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>
    </main>
  );
}


