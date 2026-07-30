"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { PwaInstallKind } from "@/lib/pwa";

interface PWANudgeProps {
  open: boolean;
  kind: Exclude<PwaInstallKind, "none">;
  onClose: () => void;
}

function copyForKind(kind: Exclude<PwaInstallKind, "none">): string {
  if (kind === "ios-safari") {
    return 'Add PlayPointy to your Home Screen. 📲 Tap Share, then "Add to Home Screen".';
  }
  return "Add PlayPointy to your Home Screen. 📲 Tap the browser menu (⋮) and choose Install / Add to Home screen.";
}

/**
 * Install-Hinweis – nur rendern, wenn der Parent die Eligibility
 * (Chromium BIP / iOS Safari) bereits geprüft hat.
 */
export default function PWANudge({ open, kind, onClose }: PWANudgeProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-none absolute inset-x-4 bottom-6 z-50 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          <div className="pointer-events-auto flex w-full max-w-[320px] items-center gap-3 rounded-2xl border border-white/20 bg-black/70 p-4 text-white shadow-xl backdrop-blur-md">
            <div className="text-2xl">📱</div>
            <p className="flex-1 text-sm leading-snug">{copyForKind(kind)}</p>
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto flex-none rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
