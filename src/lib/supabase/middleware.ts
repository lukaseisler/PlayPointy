import { NextResponse, type NextRequest } from "next/server";

/**
 * No-op on Cloudflare: calling Supabase Auth here 500s the Worker.
 * Session refresh stays in the browser AuthProvider.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request });
}
