import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnvironment } from "@/lib/env";

/**
 * Client Components içinde kullanılacak ortak Supabase istemcisi.
 * `createBrowserClient`, tarayıcı çalışma zamanında singleton davranışını sağlar.
 */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseEnvironment();

  return createBrowserClient(url, publishableKey);
}
