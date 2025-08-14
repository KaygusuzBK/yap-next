"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store/auth";
import { useUserStore } from "@/lib/store/user";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  const setUser = useAuthStore(s => s.setUser)
  const loading = useAuthStore(s => s.loading)
  const setLoading = useAuthStore(s => s.setLoading)
  const setProfile = useUserStore(s => s.setProfile)
  const router = useRouter();

  // Fire-and-forget: sync pending team invitations into notifications
  const syncInvites = async (u: User) => {
    if (!u?.id || !u.email) return;
    try {
      await fetch('/api/notifications/sync-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id, email: u.email })
      });
    } catch {}
  }

  useEffect(() => {
    const supabase = getSupabase();

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user ?? null
        setUser(u);
        // profile to user store
        const getMetaString = (obj: unknown, key: string): string | '' => {
          if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
            const val = (obj as Record<string, unknown>)[key]
            return typeof val === 'string' ? val : ''
          }
          return ''
        }
        const fullName = u ? (getMetaString(u.user_metadata, 'full_name') || getMetaString(u.user_metadata, 'name')) : ''
        const email = u?.email ?? ''
        if (fullName || email) setProfile(fullName || 'Kullanıcı', email || '—')
        if (u && email) syncInvites(u)
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u);
      const getMetaString = (obj: unknown, key: string): string | '' => {
        if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
          const val = (obj as Record<string, unknown>)[key]
          return typeof val === 'string' ? val : ''
        }
        return ''
      }
      const fullName = u ? (getMetaString(u.user_metadata, 'full_name') || getMetaString(u.user_metadata, 'name')) : ''
      const email = u?.email ?? ''
      if (fullName || email) setProfile(fullName || 'Kullanıcı', email || '—')
      if (u && email) syncInvites(u)
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  // Zorunlu bağımlılıklar store setter'lar; referans stabilitesi garanti edildi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signOut: async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('profile_name');
            window.localStorage.removeItem('profile_email');
          }
        } catch {}
        router.push('/');
      },
    }),
    [user, loading, router]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


