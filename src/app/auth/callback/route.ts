import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Public anon credentials — used only on this OAuth callback route. */
const SUPABASE_URL = "https://uxylwvshvvwgpcxzepog.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CpbLbsAELTx5LMKt_ovrGA_yBa7TMcJ";

/**
 * OAuth code exchange (email OTP verifies client-side).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* ignore */
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  const err = new URL("/", origin);
  err.searchParams.set("authError", "1");
  return NextResponse.redirect(err);
}
