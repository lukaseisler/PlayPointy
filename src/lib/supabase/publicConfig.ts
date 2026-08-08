/**
 * Public Supabase web config. Literals only — do not read process.env here.
 * Next/Cloudflare builds were not reliably inlining NEXT_PUBLIC_* for the client,
 * which caused "Sign-in is not configured yet" in production.
 */
export const SUPABASE_URL = "https://uxylwvshvvwgpcxzepog.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_CpbLbsAELTx5LMKt_ovrGA_yBa7TMcJ";

export function isSupabaseConfigured(): boolean {
  return true;
}
