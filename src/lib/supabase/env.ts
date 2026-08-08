import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./publicConfig";

/** Shared public config (same values as the browser client). */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}

export { isSupabaseConfigured } from "./publicConfig";
