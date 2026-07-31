"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface LogoBurstParticle {
  id: string;
  x: number;
  peakY: number;
  endY: number;
  rotate: number;
  spin: number;
  delay: number;
  duration: number;
  scale: number;
}

function createFountain(burstKey: number, count = 10): LogoBurstParticle[] {
  let seed = burstKey * 9973 + 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed & 0x7fffffff) / 0x7fffffff;
  };

  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : (i / (count - 1)) * 2 - 1;
    const x = t * (56 + rand() * 40) + (rand() - 0.5) * 24;
    const peakY = -(42 + rand() * 58);
    const endY = peakY * 0.2 + 10 + rand() * 36;
    const rotate = (rand() - 0.5) * 480;
    const spin = rotate + (rand() > 0.5 ? 100 : -100);

    return {
      id: `${burstKey}-${i}`,
      x,
      peakY,
      endY,
      rotate,
      spin,
      delay: i * 0.015,
      duration: 0.65 + rand() * 0.2,
      scale: 0.65 + rand() * 0.4,
    };
  });
}

/**
 * Fountain aus winzigen PlayPointy-Logos (nur Transforms → flüssig).
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
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.15, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, p.x * 0.5, p.x],
            y: [0, p.peakY, p.endY],
            scale: [0.15, p.scale, p.scale * 0.7],
            rotate: [0, p.rotate, p.spin],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            opacity: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.1, 0.6, 1],
            },
            x: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.4, 1],
              ease: ["easeOut", "easeInOut"],
            },
            y: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.35, 1],
              ease: ["easeOut", "easeIn"],
            },
            rotate: { duration: p.duration, delay: p.delay, ease: "linear" },
            scale: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.18, 1],
              ease: "easeOut",
            },
          }}
          className="absolute top-0 left-0 h-6 w-auto max-w-none origin-center select-none drop-shadow-md"
          style={{ backfaceVisibility: "hidden", willChange: "transform, opacity" }}
        />
      ))}
    </div>
  );
}
