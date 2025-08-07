"use client";

import Protected from "@/components/auth/Protected";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  return (
    <Protected>
      <main className="min-h-dvh p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p>Hoş geldin, {user?.email}</p>
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => signOut()}
        >
          Çıkış Yap
        </button>
      </main>
    </Protected>
  );
}


