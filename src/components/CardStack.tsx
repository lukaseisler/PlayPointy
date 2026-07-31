"use client";

import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useRef, useState } from "react";
import { useIsStandalonePwa } from "@/hooks/useIsStandalonePwa";
import type { Card } from "@/lib/types";

interface CardStackProps {
  cards: Card[];
  index: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  renderCard: (card: Card, index: number) => React.ReactNode;
}

const SWIPE_DISTANCE_THRESHOLD = 110;
const SWIPE_VELOCITY_THRESHOLD = 500;
const FLY_OUT_DISTANCE = 600;
const TAP_MOVE_THRESHOLD = 12;

/**
 * Kartenstapel mit Drag-Swipe + Tap linkes/rechtes Drittel.
 * `touch-action: none` auf der aktiven Karte ist nötig, damit Framer Motion
 * horizontale Swipes zuverlässig bekommt (nicht der Browser).
 */
export default function CardStack({
  cards,
  index,
  onSwipeLeft,
  onSwipeRight,
  renderCard,
}: CardStackProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-320, 0, 320], [-12, 0, 12]);
  const showNext = useTransform(x, (v) => (v > 0 ? 0 : 1));
  const showPrev = useTransform(x, (v) => (v > 0 ? 1 : 0));
  const isFlying = useRef(false);
  const didDrag = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const isStandalonePwa = useIsStandalonePwa();
  const [dragEnabled, setDragEnabled] = useState(true);

  const current = cards[index];
  const next = cards[index + 1];
  const prevIndex = index > 0 ? index - 1 : index + 1;
  const prev = cards[prevIndex];

  function handleDragStart() {
    didDrag.current = true;
  }

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (!isStandalonePwa && info.offset.y < -100) {
      setTimeout(() => {
        try {
          document.documentElement.requestFullscreen().catch(() => {});
        } catch {
          /* ignore */
        }
      }, 450);
      return;
    }
    if (!isStandalonePwa && info.offset.y > 100) {
      setTimeout(() => {
        try {
          document.exitFullscreen().catch(() => {});
        } catch {
          /* ignore */
        }
      }, 450);
      return;
    }

    if (isFlying.current) return;

    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;
    const shouldSwipe =
      Math.abs(offsetX) > SWIPE_DISTANCE_THRESHOLD ||
      Math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD;

    if (shouldSwipe) {
      const direction = offsetX !== 0 ? Math.sign(offsetX) : Math.sign(velocityX);
      if (direction < 0) {
        flyOut(-1, onSwipeLeft);
      } else {
        flyOut(1, onSwipeRight);
      }
      return;
    }

    animate(x, 0, { type: "spring", stiffness: 380, damping: 32 });
  }

  function flyOut(direction: -1 | 1, callback: () => void) {
    isFlying.current = true;
    animate(x, direction * FLY_OUT_DISTANCE, {
      type: "tween",
      duration: 0.28,
      ease: [0.32, 0.72, 0.35, 1],
      onComplete: () => {
        callback();
        x.set(0);
        isFlying.current = false;
      },
    });
  }

  function handlePointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (isFlying.current || didDrag.current || !dragEnabled) {
      pointerStart.current = null;
      return;
    }
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;

    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx > TAP_MOVE_THRESHOLD || dy > TAP_MOVE_THRESHOLD) return;

    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, textarea, [data-no-tap-nav]")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relX = (e.clientX - rect.left) / rect.width;

    if (relX < 1 / 3) {
      flyOut(1, onSwipeRight);
    } else if (relX > 2 / 3) {
      flyOut(-1, onSwipeLeft);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length > 1) {
      setDragEnabled(false);
      didDrag.current = true;
      animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length === 0) {
      setDragEnabled(true);
    }
  }

  if (!current) return null;

  const dragProp = !dragEnabled ? false : isStandalonePwa ? ("x" as const) : true;

  return (
    <div
      className="relative isolate min-h-0 flex-1 touch-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {next && (
        <motion.div
          key={`next-${next.id}`}
          aria-hidden
          style={{ opacity: showNext }}
          className="pointer-events-none absolute inset-0 z-0 border-none outline-none [backface-visibility:hidden]"
        >
          {renderCard(next, index + 1)}
        </motion.div>
      )}
      {prev && (
        <motion.div
          key={`prev-${prev.id}`}
          aria-hidden
          style={{ opacity: showPrev }}
          className="pointer-events-none absolute inset-0 z-0 border-none outline-none [backface-visibility:hidden]"
        >
          {renderCard(prev, prevIndex)}
        </motion.div>
      )}

      <motion.div
        key={current.id}
        className="pointer-events-auto absolute inset-0 z-10 cursor-grab touch-none border-none outline-none [backface-visibility:hidden] active:cursor-grabbing"
        style={{ x, rotate, touchAction: "none" }}
        drag={dragProp}
        dragDirectionLock={true}
        dragElastic={
          isStandalonePwa
            ? 0.6
            : { left: 0.6, right: 0.6, top: 0.4, bottom: 0.4 }
        }
        dragMomentum={false}
        dragConstraints={
          isStandalonePwa
            ? { left: 0, right: 0 }
            : { left: 0, right: 0, top: 0, bottom: 0 }
        }
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        whileDrag={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        {renderCard(current, index)}
      </motion.div>
    </div>
  );
}
