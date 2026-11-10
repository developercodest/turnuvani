import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnvironment } from "@/lib/env";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = request.nextUrl.searchParams.get("next");
  const { url, publishableKey } = getSupabaseEnvironment();
  const loginResponse = NextResponse.redirect(new URL("/login?error=verification", request.url));
  const destination = next === "/reset-password"
    ? "/reset-password"
    : next?.startsWith("/dashboard")
      ? next
      : "/verified";
  const successResponse = NextResponse.redirect(new URL(destination, request.url));
  successResponse.headers.set("Cache-Control", "private, no-store");
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => successResponse.cookies.set(name, value, options)),
    },
  });

  const error = code
    ? (await supabase.auth.exchangeCodeForSession(code)).error
    : tokenHash && type
      ? (await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error
      : new Error("Doğrulama bağlantısında geçerli bir kod bulunamadı.");

  if (error) return loginResponse;
  return successResponse;
}
