"use client";

import { AnimatePresence, motion } from "framer-motion";

interface PWANudgeProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Kleiner Install-Hinweis, der einmalig nach ein paar Karten auftaucht und
 * dazu ermutigt, das Spiel per "Add to Home Screen" / "Install App" im
 * Vollbild (ohne Browser-Chrome) zu nutzen. Rein informativ - stoesst keinen
 * nativen Install-Prompt an.
 */
export default function PWANudge({ open, onClose }: PWANudgeProps) {
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
            <p className="flex-1 text-sm leading-snug">
              Add game to home screen. 📲 Tap the browser menu (⋮) and select install and create shortcut
            </p>
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
