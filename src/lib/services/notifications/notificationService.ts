"use client";

import { getSupabase } from "@/lib/supabase";

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(limit = 50): Promise<AppNotification[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export function subscribeNotifications(onInsert: (n: AppNotification) => void, opts?: { userId?: string }) {
  const supabase = getSupabase();
  const filter = opts?.userId ? `user_id=eq.${opts.userId}` : undefined
  const channel = supabase
    .channel("realtime:notifications")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter },
      (payload) => {
        try {
          const row = payload.new as AppNotification;
          if (!opts?.userId || row.user_id === opts.userId) onInsert(row);
        } catch {}
      }
    )
    .subscribe();
  return () => {
    try { supabase.removeChannel(channel) } catch {}
  };
}


