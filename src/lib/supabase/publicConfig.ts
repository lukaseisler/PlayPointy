/**
 * Browser-only public Supabase config (literals — never process.env).
 * Do not put NEXT_PUBLIC_SUPABASE_* in Cloudflare secrets / .env.production —
 * that has caused Worker 500s. Do not import this from server-only modules.
 */
export const SUPABASE_URL = "https://uxylwvshvvwgpcxzepog.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_CpbLbsAELTx5LMKt_ovrGA_yBa7TMcJ";

export function isSupabaseConfigured(): boolean {
  return true;
}
