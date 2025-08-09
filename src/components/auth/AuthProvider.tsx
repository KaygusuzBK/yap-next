"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user ?? null
        setUser(u);
        try {
          if (typeof window !== 'undefined') {
            const getMetaString = (obj: unknown, key: string): string | '' => {
              if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
                const val = (obj as Record<string, unknown>)[key]
                return typeof val === 'string' ? val : ''
              }
              return ''
            }
            const fullName = u ? (getMetaString(u.user_metadata, 'full_name') || getMetaString(u.user_metadata, 'name')) : ''
            const email = u?.email ?? ''
            if (fullName) window.localStorage.setItem('profile_name', fullName)
            if (email) window.localStorage.setItem('profile_email', email)
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u);
      try {
        if (typeof window !== 'undefined') {
          const getMetaString = (obj: unknown, key: string): string | '' => {
            if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
              const val = (obj as Record<string, unknown>)[key]
              return typeof val === 'string' ? val : ''
            }
            return ''
          }
          const fullName = u ? (getMetaString(u.user_metadata, 'full_name') || getMetaString(u.user_metadata, 'name')) : ''
          const email = u?.email ?? ''
          if (fullName) window.localStorage.setItem('profile_name', fullName)
          if (email) window.localStorage.setItem('profile_email', email)
        }
      } catch {}
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signOut: async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


