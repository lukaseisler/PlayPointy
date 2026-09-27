"use client";

import { motion } from "framer-motion";

export function ShineSweep({ delay = 1.05 }: { delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-[38%] -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
      initial={{ x: "-160%" }}
      animate={{ x: ["-160%", "320%"] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 2.1,
        ease: [0.4, 0, 0.2, 1],
        delay,
      }}
    />
  );
}
