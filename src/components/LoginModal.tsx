"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isInAppBrowser } from "@/lib/inAppBrowser";
import { markResumeAfterAuth } from "@/lib/pendingCheckout";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Step = "choose" | "email" | "otp";

interface LoginModalProps {
  open: boolean;
  contextLabel?: string | null;
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
  if (!msg || msg === "{}" || /smtp|resend|fetch failed|network/i.test(msg)) {
    return fallback;
  }
  return msg;
}

export default function LoginModal({
  open,
  contextLabel,
  initialError,
  onClose,
  onSignedIn,
}: LoginModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [inApp, setInApp] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("choose");
    setEmail("");
    setOtp(Array(OTP_LENGTH).fill(""));
    setError(initialError ?? null);
    setBusy(false);
    setResendIn(0);
    setInApp(isInAppBrowser());
  }, [open, initialError]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (!open || step !== "email") return;
    const t = window.setTimeout(() => emailInputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, step]);

  useEffect(() => {
    if (!open || step !== "otp") return;
    const t = window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  async function signInWithGoogle() {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Sign-in is not configured yet.");
      return;
    }
    if (inApp) {
      setError("Open in your browser to continue with Google — or use email below.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is not configured yet.");
      return;
    }
    setBusy(true);
    const nextPath = `${window.location.pathname}${window.location.search}` || "/";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    markResumeAfterAuth();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setBusy(false);
    if (oauthError) {
      setError(friendlyAuthError(oauthError, "Google sign-in failed. Try email instead."));
    }
  }

  async function sendOtp() {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is not configured yet.");
      return;
    }
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
    setStep("otp");
    setResendIn(RESEND_COOLDOWN_SEC);
    setOtp(Array(OTP_LENGTH).fill(""));
  }

  async function verifyOtp(code: string) {
    if (code.length !== OTP_LENGTH) return;
    const supabase = createClient();
    if (!supabase) {
      setError("Sign-in is not configured yet.");
      return;
    }
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Sign in"
            className="w-full max-w-md rounded-t-[2rem] bg-white px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[2rem]"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {contextLabel ? "Unlock pack" : "Restore purchases"}
                </h2>
                {contextLabel ? (
                  <p className="mt-1 text-sm text-neutral-500">Unlocking {contextLabel}…</p>
                ) : (
                  <p className="mt-1 text-sm text-neutral-500">
                    Log in with Google or email
                  </p>
                )}
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
              >
                ✕
              </button>
            </div>

            {inApp && (
              <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Google sign-in often fails inside TikTok/Instagram.{" "}
                <a
                  href={typeof window !== "undefined" ? window.location.href : "/"}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline"
                >
                  Open in browser
                </a>{" "}
                or use email.
              </div>
            )}

            <p className="mb-4 text-xs text-neutral-500">
              Use the same sign-in method you purchased with.
            </p>

            {error && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            {step === "choose" && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void signInWithGoogle()}
                  className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Continue with Google
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setError(null);
                    setStep("email");
                  }}
                  className="w-full rounded-full border-2 border-neutral-200 py-3 text-sm font-semibold text-neutral-800"
                >
                  Continue with email
                </button>
              </div>
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
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-3 text-base text-neutral-900 outline-none focus:border-neutral-400"
                    placeholder="you@email.com"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "Sending…" : "Send code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("choose");
                    setError(null);
                  }}
                  className="text-sm font-medium text-neutral-500"
                >
                  Back
                </button>
              </form>
            )}

            {step === "otp" && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-neutral-600">
                  Enter the 6-digit code sent to <span className="font-semibold">{email}</span>
                </p>
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
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
                      className="h-12 w-11 rounded-xl border border-neutral-200 text-center text-lg font-semibold text-neutral-900 outline-none focus:border-neutral-400"
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
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                  }}
                  className="text-sm font-medium text-neutral-500"
                >
                  Change email
                </button>
              </div>
            )}

            <nav className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-neutral-500">
              <Link href="/privacy" className="underline underline-offset-2">
                Privacy
              </Link>
              <Link href="/terms" className="underline underline-offset-2">
                Terms
              </Link>
              <Link href="/imprint" className="underline underline-offset-2">
                Imprint
              </Link>
            </nav>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
