import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isConfigured } from "@/lib/env";

/**
 * Anonymous Supabase client for PUBLIC reads only.
 * Bound by RLS — it can see the `public_doctors` / `public_insights` views and
 * nothing else. Returns null when Supabase is not configured so callers can
 * fall back gracefully (e.g. the marketing site still renders).
 */
let cached: SupabaseClient | null = null;

export function supabaseAnon(): SupabaseClient | null {
  if (!isConfigured.supabase) return null;
  if (cached) return cached;
  cached = createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
