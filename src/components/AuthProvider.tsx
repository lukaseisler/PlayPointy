"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import CheckoutConfirmModal from "@/components/CheckoutConfirmModal";
import LoginModal from "@/components/LoginModal";
import { FREE_PACK_ID } from "@/lib/data";
import {
  clearEntitlementsCache,
  readEntitlementsCache,
  writeEntitlementsCache,
} from "@/lib/entitlementsCache";
import { getPackById } from "@/lib/data";
import {
  clearPendingCheckout,
  consumeResumeAfterAuth,
  readPendingCheckout,
  savePendingCheckout,
} from "@/lib/pendingCheckout";
import { mergeActiveWithOwned, sanitizeUnlockedPackIds } from "@/lib/ownedPacks";
import { writeActivePackIds, readActivePackIds } from "@/lib/activePacks";
import type { StoreReason } from "@/lib/storeTypes";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/publicConfig";

export type EntitlementsStatus = "idle" | "loading" | "ready" | "error";

interface LoginIntent {
  packId?: string;
  packName?: string;
  reason: StoreReason;
  mode: "purchase" | "restore";
}

interface AuthContextValue {
  configured: boolean;
  user: User | null;
  authReady: boolean;
  unlockedPackIds: string[];
  entitlementsStatus: EntitlementsStatus;
  entitlementsError: string | null;
  refreshEntitlements: () => Promise<{ ids: string[]; ok: boolean }>;
  signOut: () => Promise<void>;
  openRestoreLogin: () => void;
  beginPurchase: (packId: string, packName: string, reason: StoreReason) => void;
  checkoutOpen: boolean;
  /** Nach Login/Restore: Parent soll Deck neu bauen. */
  deckEpoch: number;
  checkoutNotice: string | null;
  clearCheckoutNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!configured);
  const [unlockedPackIds, setUnlockedPackIds] = useState<string[]>([]);
  const [entitlementsStatus, setEntitlementsStatus] = useState<EntitlementsStatus>("idle");
  const [entitlementsError, setEntitlementsError] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginIntent, setLoginIntent] = useState<LoginIntent | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [deckEpoch, setDeckEpoch] = useState(0);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [checkoutConfirm, setCheckoutConfirm] = useState<{
    packId: string;
    packName: string;
  } | null>(null);

  const applyOwnedToActive = useCallback(
    (owned: string[], mode: "add" | "allOwned", purchasedPackId?: string) => {
      const current = readActivePackIds();
      const next = mergeActiveWithOwned(current, owned, mode, purchasedPackId);
      writeActivePackIds(next);
      setDeckEpoch((n) => n + 1);
    },
    [],
  );

  const refreshEntitlements = useCallback(async (): Promise<{
    ids: string[];
    ok: boolean;
  }> => {
    if (!configured) {
      setUnlockedPackIds([]);
      setEntitlementsStatus("ready");
      return { ids: [], ok: true };
    }
    const supabase = createClient();
    if (!supabase || !user) {
      setUnlockedPackIds([]);
      setEntitlementsStatus(user ? "loading" : "idle");
      return { ids: [], ok: false };
    }

    setEntitlementsStatus("loading");
    setEntitlementsError(null);

    const cached = readEntitlementsCache(user.id);
    if (cached) {
      setUnlockedPackIds(cached.packIds);
    }

    const { data, error } = await supabase
      .from("entitlements")
      .select("pack_id")
      .eq("user_id", user.id);

    if (error) {
      setEntitlementsStatus("error");
      setEntitlementsError(error.message || "Couldn't load purchases");
      if (cached) {
        setUnlockedPackIds(cached.packIds);
        return { ids: cached.packIds, ok: false };
      }
      setUnlockedPackIds([]);
      return { ids: [], ok: false };
    }

    const ids = sanitizeUnlockedPackIds((data ?? []).map((row) => row.pack_id as string));
    writeEntitlementsCache(user.id, ids);
    setUnlockedPackIds(ids);
    setEntitlementsStatus("ready");
    return { ids, ok: true };
  }, [configured, user]);

  useEffect(() => {
    if (!configured) {
      setAuthReady(true);
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      // Finish Google OAuth PKCE in the browser (no server createServerClient).
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          params.delete("code");
          const qs = params.toString();
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}${qs ? `?${qs}` : ""}`,
          );
        }
      }
      if (cancelled) return;
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(data.user ?? null);
      setAuthReady(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

  // URL authError from callback
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("authError") === "1") {
      setLoginError("Sign-in failed. Try again or use email.");
      setLoginIntent({ reason: "manual", mode: "restore" });
      setLoginOpen(true);
      params.delete("authError");
      const url = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", url);
    }
  }, []);

  // Legal-Seite mit "?return=login" geschlossen: Login-Sheet wieder oeffnen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") !== "1") return;
    setLoginIntent({ reason: "manual", mode: "restore" });
    setLoginOpen(true);
    params.delete("login");
    const url = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.replaceState({}, "", url);
  }, []);

  // After Google OAuth (full reload) or email OTP — resume purchase or restore messaging.
  useEffect(() => {
    if (!authReady || !user) return;
    if (!consumeResumeAfterAuth()) return;

    const pending = readPendingCheckout();
    if (pending) {
      const pack = getPackById(pending.packId);
      if (pack) {
        setCheckoutConfirm({ packId: pack.id, packName: pack.name });
        return;
      }
    }
    setCheckoutNotice("Signed in. Your unlocks will appear in All Packs.");
  }, [authReady, user]);

  // Return from Stripe Checkout.
  useEffect(() => {
    if (!authReady || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;

    const packId = params.get("pack_id");
    params.delete("checkout");
    params.delete("pack_id");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`,
    );

    if (checkout === "cancel") {
      setCheckoutNotice("Checkout canceled. You can try again anytime.");
      return;
    }
    if (checkout !== "success") return;

    if (!user) {
      clearPendingCheckout();
      const pack = packId ? getPackById(packId) : undefined;
      setCheckoutNotice(
        pack
          ? `Payment received for “${pack.name}”. Use Restore with the email from checkout to unlock.`
          : "Payment received. Use Restore with the email from checkout to unlock.",
      );
      return;
    }

    void (async () => {
      clearPendingCheckout();
      const { ids, ok } = await refreshEntitlements();
      if (ok) {
        applyOwnedToActive(ids, "add", packId ?? undefined);
      }
      const pack = packId ? getPackById(packId) : undefined;
      setCheckoutNotice(
        pack
          ? `Unlocked “${pack.name}”. Have fun.`
          : "Payment received. Your pack is unlocked.",
      );
    })();
  }, [authReady, user, refreshEntitlements, applyOwnedToActive]);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setUnlockedPackIds([]);
      setEntitlementsStatus("idle");
      setEntitlementsError(null);
      return;
    }
    void (async () => {
      const { ids, ok } = await refreshEntitlements();
      // Nur bei erfolgreichem Fetch auto-aktivieren — sonst kein Wipe bei Ausfall.
      if (ok) applyOwnedToActive(ids, "allOwned");
    })();
  }, [user?.id, authReady, refreshEntitlements, applyOwnedToActive]);

  useEffect(() => {
    if (!user) return;
    function onVisibility() {
      if (document.visibilityState === "visible") {
        void refreshEntitlements();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user, refreshEntitlements]);

  const signOut = useCallback(async () => {
    const uid = user?.id;
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    clearEntitlementsCache(uid);
    writeActivePackIds([FREE_PACK_ID]);
    setUnlockedPackIds([]);
    setUser(null);
    setEntitlementsStatus("idle");
    clearPendingCheckout();
    setDeckEpoch((n) => n + 1);
  }, [user?.id]);

  const openRestoreLogin = useCallback(() => {
    setLoginError(null);
    setLoginIntent({ reason: "manual", mode: "restore" });
    setLoginOpen(true);
  }, []);

  const beginPurchase = useCallback(
    (packId: string, packName: string, reason: StoreReason) => {
      if (packId === FREE_PACK_ID) return;

      savePendingCheckout(packId, reason);
      // Pack preview is the buy page — login is only for restore later.
      setCheckoutConfirm({ packId, packName });
    },
    [],
  );

  const handleSignedIn = useCallback(() => {
    setLoginOpen(false);
    setLoginIntent(null);
    // Toast via resume flag (set in LoginModal before verify / OAuth).
  }, []);

  const clearCheckoutNotice = useCallback(() => {
    setCheckoutNotice(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      user,
      authReady,
      unlockedPackIds,
      entitlementsStatus,
      entitlementsError,
      refreshEntitlements,
      signOut,
      openRestoreLogin,
      beginPurchase,
      checkoutOpen: Boolean(checkoutConfirm),
      deckEpoch,
      checkoutNotice,
      clearCheckoutNotice,
    }),
    [
      configured,
      user,
      authReady,
      unlockedPackIds,
      entitlementsStatus,
      entitlementsError,
      refreshEntitlements,
      signOut,
      openRestoreLogin,
      beginPurchase,
      checkoutConfirm,
      deckEpoch,
      checkoutNotice,
      clearCheckoutNotice,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        open={loginOpen}
        packId={loginIntent?.mode === "purchase" ? loginIntent.packId : null}
        packName={loginIntent?.mode === "purchase" ? loginIntent.packName : null}
        initialError={loginError}
        onClose={() => {
          setLoginOpen(false);
          setLoginIntent(null);
          // Pending behalten bis TTL — User kann erneut tippen.
        }}
        onSignedIn={handleSignedIn}
      />
      <CheckoutConfirmModal
        open={Boolean(checkoutConfirm)}
        packId={checkoutConfirm?.packId ?? ""}
        packName={checkoutConfirm?.packName ?? ""}
        onClose={() => setCheckoutConfirm(null)}
      />
    </AuthContext.Provider>
  );
}
