import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isConfigured } from "@/lib/env";

/**
 * Service-role Supabase client. SERVER ONLY. Bypasses RLS.
 *
 * Never import this into a Client Component. Every caller must authorize the
 * request itself (Clerk `auth()` + ownership checks) before touching data.
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!isConfigured.supabaseAdmin) {
    throw new Error(
      "Supabase admin client requested but SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL are not set.",
    );
  }
  if (cached) return cached;
  cached = createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function hasSupabaseAdmin() {
  return isConfigured.supabaseAdmin;
}
