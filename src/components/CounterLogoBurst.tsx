"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface LogoBurstParticle {
  id: string;
  x: number;
  y: number;
  rotate: number;
  duration: number;
  scale: number;
}

/**
 * 4 Logos gleichzeitig — Feuerwerk in Zeitlupe, weiter gespreizt:
 * links oben → 2× schräg → senkrecht unten rechts.
 */
function createFirework(burstKey: number): LogoBurstParticle[] {
  const paths = [
    { x: -155, y: 10, rotate: -32, scale: 1 },
    { x: -108, y: 78, rotate: -14, scale: 1.05 },
    { x: -58, y: 130, rotate: 12, scale: 1 },
    { x: -8, y: 175, rotate: 26, scale: 1.05 },
  ] as const;

  return paths.map((p, i) => ({
    id: `${burstKey}-${i}`,
    x: p.x,
    y: p.y,
    rotate: p.rotate,
    duration: 1.4,
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
            rotate: { duration: p.duration, ease: "easeOut" },
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
