"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { PACK_PRICE_LABEL } from "@/lib/stripe/catalog";
import { createClient } from "@/lib/supabase/client";

interface CheckoutConfirmModalProps {
  open: boolean;
  packId: string;
  packName: string;
  onClose: () => void;
}

export default function CheckoutConfirmModal({
  open,
  packId,
  packName,
  onClose,
}: CheckoutConfirmModalProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptWaiver, setAcceptWaiver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    if (!acceptTerms || !acceptWaiver) {
      setError("Please check both boxes to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Please sign in again, then retry checkout.");
        setBusy(false);
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          packId,
          acceptTerms: true,
          acceptWithdrawalWaiver: true,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout could not be started.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Checkout could not be started. Try again.");
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="checkout-title"
                  className="text-lg font-semibold text-neutral-900"
                >
                  Unlock {packName}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {PACK_PRICE_LABEL} · one-time · includes VAT
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={busy}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-neutral-700">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I accept the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="underline underline-offset-2"
                  >
                    Terms of Service
                  </Link>
                  .
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptWaiver}
                  onChange={(e) => setAcceptWaiver(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I want instant access and understand I can&apos;t get a refund
                  once this pack unlocks.
                </span>
              </label>
            </div>

            {error ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              disabled={busy || !acceptTerms || !acceptWaiver}
              onClick={() => void startCheckout()}
              className="mt-5 w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? "Redirecting…" : `Buy · ${PACK_PRICE_LABEL}`}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="mt-2 w-full py-2 text-sm text-neutral-500"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
