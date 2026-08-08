const SUPABASE_URL = "https://uxylwvshvvwgpcxzepog.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_CpbLbsAELTx5LMKt_ovrGA_yBa7TMcJ";

export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}
