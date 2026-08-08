import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** Browser-Client. `null`, wenn Env fehlt (Gast-Modus ohne Auth). */
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey);
}
