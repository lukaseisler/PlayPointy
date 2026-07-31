"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface LogoBurstParticle {
  id: string;
  /** Endposition relativ zum Counter-Ursprung */
  x: number;
  y: number;
  rotate: number;
  duration: number;
  scale: number;
}

/**
 * 4 Logos gleichzeitig — Feuerwerk in Zeitlupe:
 * 1) links am oberen Rand
 * 2–3) schräg dazwischen
 * 4) senkrecht nach unten am rechten Rand
 */
function createFirework(burstKey: number): LogoBurstParticle[] {
  const paths = [
    { x: -110, y: 8, rotate: -28, scale: 0.95 }, // links, oben
    { x: -78, y: 52, rotate: -12, scale: 1 }, // schräg
    { x: -42, y: 88, rotate: 10, scale: 0.95 }, // schräg
    { x: -6, y: 118, rotate: 22, scale: 1 }, // unten, rechts
  ] as const;

  return paths.map((p, i) => ({
    id: `${burstKey}-${i}`,
    x: p.x,
    y: p.y,
    rotate: p.rotate,
    duration: 1.35,
    scale: p.scale,
  }));
}

export default function CounterLogoBurst({ burstKey }: { burstKey: number }) {
  const particles = useMemo(() => createFirework(burstKey), [burstKey]);

  return (
    <div
      className="pointer-events-none absolute top-1/2 left-1/2 z-50 h-0 w-0 overflow-visible"
      aria-hidden
    >
      {particles.map((p) => (
        <motion.img
          key={p.id}
          src="/logo.png"
          alt=""
          draggable={false}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.35, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, p.x * 0.55, p.x],
            y: [0, p.y * 0.45, p.y],
            scale: [0.35, p.scale, p.scale * 0.9],
            rotate: [0, p.rotate * 0.6, p.rotate],
          }}
          transition={{
            // Alle gleichzeitig — ein Abschuss
            delay: 0,
            duration: p.duration,
            opacity: {
              duration: p.duration,
              times: [0, 0.08, 0.65, 1],
              ease: "easeOut",
            },
            x: {
              duration: p.duration,
              times: [0, 0.4, 1],
              ease: ["easeOut", "easeInOut"],
            },
            y: {
              duration: p.duration,
              times: [0, 0.4, 1],
              ease: ["easeOut", "easeInOut"],
            },
            rotate: {
              duration: p.duration,
              ease: "easeOut",
            },
            scale: {
              duration: p.duration,
              times: [0, 0.2, 1],
              ease: "easeOut",
            },
          }}
          className="absolute top-0 left-0 h-8 w-auto max-w-none origin-center select-none drop-shadow-md"
          style={{ backfaceVisibility: "hidden", willChange: "transform, opacity" }}
        />
      ))}
    </div>
  );
}
