import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Hoş geldin</h1>
        <p>Supabase auth örneği için aşağıdaki sayfaları kullan.</p>
        <div className="flex items-center justify-center gap-3">
          <Link className="rounded bg-black px-4 py-2 text-white" href="/login">Giriş</Link>
          <Link className="rounded border px-4 py-2" href="/register">Kayıt</Link>
          <Link className="rounded border px-4 py-2" href="/forgot-password">Şifre Sıfırla</Link>
          <Link className="rounded border px-4 py-2" href="/dashboard">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
