"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

export interface LogoBurstParticle {
  id: string;
  /** End-X relativ zum Ursprung (px) */
  x: number;
  /** Scheitelpunkt nach oben (negativ) */
  peakY: number;
  /** Landung / Fall unter dem Scheitel */
  endY: number;
  /** Endrotation in Grad */
  rotate: number;
  /** Spin-Richtung während des Flugs */
  spin: number;
  delay: number;
  duration: number;
  scale: number;
}

function createFountain(burstKey: number, count = 9): LogoBurstParticle[] {
  // Deterministisch pro Burst (kein Hydration-Zucken), wirkt aber zufällig.
  let seed = burstKey * 9973 + 11;
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed & 0x7fffffff) / 0x7fffffff;
  };

  return Array.from({ length: count }, (_, i) => {
    // Streuung: schräg links, oben, schräg rechts
    const t = (i / (count - 1)) * 2 - 1; // -1 … +1
    const spread = t * (48 + rand() * 36);
    const jitter = (rand() - 0.5) * 28;
    const x = spread + jitter;
    const peakY = -(36 + rand() * 52);
    const endY = peakY * 0.15 + rand() * 28;
    const rotate = (rand() - 0.5) * 420;
    const spin = rotate + (rand() > 0.5 ? 80 : -80);

    return {
      id: `${burstKey}-${i}`,
      x,
      peakY,
      endY,
      rotate,
      spin,
      delay: i * 0.018 + rand() * 0.03,
      duration: 0.62 + rand() * 0.22,
      scale: 0.55 + rand() * 0.45,
    };
  });
}

/**
 * Fountain-Burst aus winzigen PlayPointy-Logos.
 * Nur Transforms/Opacity → GPU-freundlich und flüssig.
 */
export default function CounterLogoBurst({ burstKey }: { burstKey: number }) {
  const particles = useMemo(() => createFountain(burstKey), [burstKey]);

  return (
    <div
      className="pointer-events-none absolute top-1/2 right-2 z-30 h-0 w-0"
      aria-hidden
    >
      <AnimatePresence>
        {particles.map((p) => (
          <motion.img
            key={p.id}
            src="/logo.png"
            alt=""
            draggable={false}
            initial={{
              opacity: 0,
              x: 0,
              y: 0,
              scale: 0.2,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, p.x * 0.55, p.x],
              y: [0, p.peakY, p.endY],
              scale: [0.2, p.scale, p.scale * 0.75],
              rotate: [0, p.rotate, p.spin],
            }}
            transition={{
              delay: p.delay,
              duration: p.duration,
              opacity: {
                delay: p.delay,
                duration: p.duration,
                times: [0, 0.08, 0.55, 1],
                ease: "linear",
              },
              x: {
                delay: p.delay,
                duration: p.duration,
                times: [0, 0.45, 1],
                ease: ["easeOut", "easeInOut"],
              },
              y: {
                delay: p.delay,
                duration: p.duration,
                times: [0, 0.38, 1],
                // Hoch = easeOut, Fall = easeIn (Schwerkraft)
                ease: ["easeOut", "easeIn"],
              },
              rotate: {
                delay: p.delay,
                duration: p.duration,
                ease: "linear",
              },
              scale: {
                delay: p.delay,
                duration: p.duration,
                times: [0, 0.2, 1],
                ease: "easeOut",
              },
            }}
            className="absolute top-0 left-0 h-5 w-auto origin-center select-none drop-shadow-md will-change-transform"
            style={{
              // GPU-Layer früh anlegen
              backfaceVisibility: "hidden",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
