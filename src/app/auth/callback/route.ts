import { NextResponse } from "next/server";

/**
 * OAuth return URL.
 * Session exchange is handled client-side after redirect when possible;
 * avoid createServerClient here — it 500s the Cloudflare Worker in production.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") ? next : "/";
  const code = searchParams.get("code");

  // Preserve code in hash/query for the client to finish PKCE if present.
  const url = new URL(safeNext, origin);
  if (code) {
    url.searchParams.set("code", code);
  }
  return NextResponse.redirect(url);
}
