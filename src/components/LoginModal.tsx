"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useKeyboardOverlap } from "@/hooks/useKeyboardOverlap";
import { getPackById, getStorePacks } from "@/lib/data";
import { usePackTeaserCards } from "@/lib/usePackTeaserCards";
import { isInAppBrowser } from "@/lib/inAppBrowser";
import { markResumeAfterAuth } from "@/lib/pendingCheckout";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/publicConfig";

type Step = "email" | "otp";

interface LoginModalProps {
  open: boolean;
  /** Purchase flow: pack being unlocked. Null = restore. */
  packId?: string | null;
  packName?: string | null;
  initialError?: string | null;
  onClose: () => void;
  onSignedIn: () => void;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

function friendlyAuthError(
  error: { message?: string; code?: string; status?: number },
  fallback: string,
): string {
  const code = error.code ?? "";
  if (code === "over_email_send_rate_limit" || error.status === 429) {
    return "Please wait a minute before requesting another code.";
  }
  if (code === "otp_expired" || /expired/i.test(error.message ?? "")) {
    return "Code expired. Request a new one.";
  }
  if (code === "invalid_credentials" || /invalid|token/i.test(error.message ?? "")) {
    return "Invalid or expired code. Try again.";
  }
  const msg = (error.message ?? "").trim();
  // Netzwerk-/DNS-Fehler heissen je nach Browser "Failed to fetch",
  // "fetch failed" oder "Load failed" - nie roh anzeigen.
  if (!msg || msg === "{}" || /smtp|resend|fetch|network|load failed/i.test(msg)) {
    return fallback;
  }
  return msg;
}

export default function LoginModal({
  open,
  packId,
  packName,
  initialError,
  onClose,
  onSignedIn,
}: LoginModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [inApp, setInApp] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const sheetHostRef = useRef<HTMLDivElement | null>(null);
  const otpRowRef = useRef<HTMLDivElement | null>(null);
  /** Blocks backdrop dismiss after step/layout changes (IG/TikTok ghost taps). */
  const ignoreBackdropCloseUntil = useRef(0);
  const keyboardInset = useKeyboardOverlap(sheetHostRef, open);
  const keyboardOpen = keyboardInset > 80;
  const prevInsetRef = useRef(0);

  const isUnlock = Boolean(packId);
  const packSummary = useMemo(() => {
    if (!packId) return null;
    return getStorePacks().find((p) => p.id === packId) ?? null;
  }, [packId]);
  const packMeta = useMemo(
    () => (packId ? getPackById(packId) : undefined),
    [packId],
  );
  const previewCards = usePackTeaserCards(open && packId ? packId : null, 3);
  const displayName = packName ?? packMeta?.name ?? "this pack";
  const accent = packSummary?.accentHex ?? "#e11d48";

  useEffect(() => {
    if (keyboardInset > 80 && prevInsetRef.current <= 80) {
      armBackdropGuard(600);
    }
    prevInsetRef.current = keyboardInset;
  }, [keyboardInset]);

  function armBackdropGuard(ms = 500) {
    ignoreBackdropCloseUntil.current = Date.now() + ms;
  }

  function requestClose() {
    if (Date.now() < ignoreBackdropCloseUntil.current) return;
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    setStep("email");
    setEmail("");
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(initialError ?? null);
    setBusy(false);
    setResendIn(0);
    setInApp(isInAppBrowser());
    armBackdropGuard(600);
  }, [open, initialError]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  // Never autofocus email — keyboard only on tap.
  useEffect(() => {
    if (!open || step !== "otp") return;
    armBackdropGuard(700);
    if (inApp) return;
    const t = window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, step, inApp]);

  useEffect(() => {
    if (!open || !keyboardOpen) return;
    const el = step === "otp" ? otpRowRef.current : emailInputRef.current;
    const t = window.setTimeout(() => {
      el?.scrollIntoView({ block: "center", inline: "nearest" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [open, step, keyboardOpen, keyboardInset]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  async function sendOtp() {
    if (!isSupabaseConfigured()) {
      setError("Sign-in is not configured yet.");
      return;
    }
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    const supabase = createClient();
    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: undefined,
      },
    });
    setBusy(false);
    if (otpError) {
      console.error("signInWithOtp failed", otpError);
      setError(friendlyAuthError(otpError, "Could not send code. Try again in a moment."));
      return;
    }
    setEmail(trimmed);
    armBackdropGuard(700);
    setStep("otp");
    setResendIn(RESEND_COOLDOWN_SEC);
    setOtp(Array(OTP_LENGTH).fill(""));
  }

  async function verifyOtp(code: string) {
    if (code.length !== OTP_LENGTH) return;
    const supabase = createClient();
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    setBusy(false);
    if (verifyError) {
      setError(friendlyAuthError(verifyError, "Invalid or expired code."));
      return;
    }
    markResumeAfterAuth();
    onSignedIn();
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    const code = next.join("");
    if (code.length === OTP_LENGTH) {
      void verifyOtp(code);
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH)
      .fill("")
      .map((_, i) => pasted[i] ?? "");
    setOtp(next);
    if (pasted.length === OTP_LENGTH) {
      void verifyOtp(pasted);
    } else {
      otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    }
  }

  const sheetTint = isUnlock
    ? `linear-gradient(180deg, ${accent}18 0%, #ffffff 42%)`
    : "linear-gradient(180deg, #fff1f2 0%, #ffffff 38%)";

  return (
    <AnimatePresence>
      {open && (
        <div
          className="absolute inset-0 z-[60] flex flex-col justify-end bg-transparent"
          onClick={() => requestClose()}
        >
          <div
            ref={sheetHostRef}
            role="dialog"
            aria-modal="true"
            aria-label={isUnlock ? `Unlock ${displayName}` : "Restore packs"}
            className="relative flex h-[85%] w-full flex-col overflow-hidden rounded-t-[2rem] bg-white"
            style={{ backgroundImage: sheetTint }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <motion.div
              className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6"
              style={{
                paddingBottom: `max(${keyboardInset + 24}px, env(safe-area-inset-bottom, 0px), 1.5rem)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {isUnlock ? (
                    <>
                      <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">
                        Unlock
                      </p>
                      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                        {displayName}
                      </h2>
                      {!keyboardOpen && packMeta && (
                        <p className="mt-1 text-sm text-neutral-500">
                          {packMeta.cardCount} cards · log in to continue
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                        Already bought packs?
                      </h2>
                      {!keyboardOpen && (
                        <p className="mt-1.5 text-sm text-neutral-500">
                          Enter the email you used at checkout.
                        </p>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-neutral-600 ring-1 ring-black/5"
                >
                  ✕
                </button>
              </div>

              {!keyboardOpen && !isUnlock && (
                <div className="mb-5 flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 ring-1 ring-rose-100">
                  <Image
                    src="/pre_log_in_icon.webp"
                    alt=""
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-white"
                  />
                  <p className="text-sm leading-snug text-neutral-600">
                    We’ll email you a one-time code — no password needed.
                  </p>
                </div>
              )}

              {!keyboardOpen && isUnlock && (
                <div className="mb-5">
                  {previewCards.length > 0 ? (
                    <div className="relative mx-auto h-[7.5rem] w-full max-w-[280px]">
                      {previewCards.slice(0, 3).map((card, i) => {
                        const poses = [
                          "left-2 top-3 -rotate-8",
                          "left-1/2 top-0 z-10 -translate-x-1/2",
                          "right-2 top-3 rotate-8",
                        ];
                        return (
                          <div
                            key={card.id}
                            className={`absolute h-[6.75rem] w-[5.1rem] overflow-hidden rounded-xl shadow-md ring-1 ring-black/10 ${poses[i]}`}
                            style={{ backgroundColor: card.hex || accent }}
                          >
                            {card.image && (
                              <Image
                                src={`/${card.image}`}
                                alt=""
                                fill
                                sizes="82px"
                                className="object-cover"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : packSummary?.previewImage ? (
                    <div
                      className="relative mx-auto aspect-[3/2] w-full max-w-[240px] overflow-hidden rounded-2xl shadow-md ring-1 ring-black/10"
                      style={{ backgroundColor: accent }}
                    >
                      <Image
                        src={`/${packSummary.previewImage}`}
                        alt=""
                        fill
                        sizes="240px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              )}

              {error && (
                <p
                  className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {step === "email" && (
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendOtp();
                  }}
                >
                  <label className="text-sm font-medium text-neutral-700">
                    Email
                    <input
                      ref={emailInputRef}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-base text-neutral-900 outline-none focus:border-neutral-400"
                      placeholder="you@email.com"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-neutral-900 py-3.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {busy ? "Sending…" : "Send code"}
                  </button>
                </form>
              )}

              {step === "otp" && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-neutral-600">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold">{email}</span>
                  </p>
                  <div
                    ref={otpRowRef}
                    className="flex justify-between gap-2"
                    style={{ scrollMarginBottom: 16 }}
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-12 w-11 rounded-xl border border-neutral-200 bg-white text-center text-lg font-semibold text-neutral-900 outline-none focus:border-neutral-400"
                        disabled={busy}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={busy || resendIn > 0}
                    onClick={() => void sendOtp()}
                    className="text-sm font-medium text-neutral-600 disabled:text-neutral-400"
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                  {!keyboardOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        armBackdropGuard(500);
                        setStep("email");
                        setError(null);
                      }}
                      className="text-sm font-medium text-neutral-500"
                    >
                      Change email
                    </button>
                  )}
                </div>
              )}

              {!keyboardOpen && (
                <nav className="mt-auto flex flex-wrap justify-center gap-x-4 gap-y-1 pt-8 text-xs text-neutral-500">
                  <Link href="/privacy?return=login" className="underline underline-offset-2">
                    Privacy
                  </Link>
                  <Link href="/terms?return=login" className="underline underline-offset-2">
                    Terms
                  </Link>
                  <Link href="/imprint?return=login" className="underline underline-offset-2">
                    Imprint
                  </Link>
                </nav>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
