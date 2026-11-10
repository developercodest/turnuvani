import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnvironment } from "@/lib/env";

/**
 * Deliberately anonymous server client for share pages. It never forwards an
 * admin session, so public RLS policies are consistently applied to every
 * visitor, signed in or not.
 */
export function createPublicSupabaseClient() {
  const { url, publishableKey } = getSupabaseEnvironment();
  return createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
}
