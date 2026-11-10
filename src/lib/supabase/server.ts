import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnvironment } from "@/lib/env";

/** Request-scoped client. Server actions must still explicitly authorize every mutation. */
export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseEnvironment();
  const cookieStore = await cookies();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
}
