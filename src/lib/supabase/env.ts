/**
 * Server env only. No hardcoded fallbacks — those crashed the Cloudflare Worker
 * when wired into createServerClient on every auth path.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
