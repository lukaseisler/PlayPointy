"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface LogoBurstParticle {
  id: string;
  x: number;
  y: number;
  rotate: number;
  spin: number;
  delay: number;
  duration: number;
  scale: number;
}

/** Nur nach unten, links und schräg unten-links — nicht in den weißen Header. */
function createFountain(burstKey: number, count = 6): LogoBurstParticle[] {
  let seed = burstKey * 9973 + 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed & 0x7fffffff) / 0x7fffffff;
  };

  // Richtungs-Slots: links, schräg unten-links, unten (je 2)
  const dirs = [
    { x: -1, y: 0.15 },
    { x: -0.85, y: 0.55 },
    { x: -0.55, y: 0.85 },
    { x: -0.25, y: 1 },
    { x: -0.7, y: 0.7 },
    { x: -0.4, y: 0.95 },
  ] as const;

  return Array.from({ length: count }, (_, i) => {
    const dir = dirs[i % dirs.length]!;
    const dist = 52 + rand() * 48;
    const x = dir.x * dist + (rand() - 0.5) * 12;
    const y = dir.y * dist + rand() * 18;
    const rotate = (rand() - 0.5) * 160;
    const spin = rotate + (rand() > 0.5 ? 40 : -40);

    return {
      id: `${burstKey}-${i}`,
      x,
      y,
      rotate,
      spin,
      delay: i * 0.05,
      duration: 1.15 + rand() * 0.35,
      scale: 0.45 + rand() * 0.25,
    };
  });
}

/**
 * Sanfter Logo-Fountain: 6 kleine Logos schweben nach links / unten.
 */
export default function CounterLogoBurst({ burstKey }: { burstKey: number }) {
  const particles = useMemo(() => createFountain(burstKey), [burstKey]);

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
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.2, rotate: 0 }}
          animate={{
            opacity: [0, 0.95, 0.85, 0],
            x: [0, p.x * 0.45, p.x],
            y: [0, p.y * 0.4, p.y],
            scale: [0.2, p.scale, p.scale * 0.85],
            rotate: [0, p.rotate, p.spin],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            opacity: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.12, 0.7, 1],
              ease: "easeOut",
            },
            x: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.5, 1],
              ease: ["easeOut", "easeInOut"],
            },
            y: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.5, 1],
              ease: ["easeOut", "easeInOut"],
            },
            rotate: {
              duration: p.duration,
              delay: p.delay,
              ease: "easeInOut",
            },
            scale: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.25, 1],
              ease: "easeOut",
            },
          }}
          className="absolute top-0 left-0 h-4 w-auto max-w-none origin-center select-none drop-shadow-md"
          style={{ backfaceVisibility: "hidden", willChange: "transform, opacity" }}
        />
      ))}
    </div>
  );
}
