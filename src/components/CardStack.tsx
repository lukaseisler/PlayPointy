"use client";

import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useRef, useState } from "react";
import type { Card } from "@/lib/types";

interface CardStackProps {
  cards: Card[];
  index: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  renderCard: (card: Card, index: number) => React.ReactNode;
}

const SWIPE_DISTANCE_THRESHOLD = 90;
const SWIPE_VELOCITY_THRESHOLD = 450;
const FLY_OUT_DISTANCE = 600;
const TAP_MOVE_THRESHOLD = 12;

/**
 * Kartenstapel mit horizontalem Drag-Swipe + Tap linkes/rechtes Drittel.
 *
 * Wichtig für Mobile: immer `drag="x"` (nie beide Achsen + directionLock).
 * Sonst lockt der erste vertikale Finger-Pixel die Geste auf Y und horizontales
 * Swipen scheitert — Desktop-Maus bleibt präzise genug und wirkt „ok“.
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
  const [dragEnabled, setDragEnabled] = useState(true);

  const current = cards[index];
  const next = cards[index + 1];
  const prevIndex = index > 0 ? index - 1 : index + 1;
  const prev = cards[prevIndex];

  function handleDragStart() {
    didDrag.current = true;
  }

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
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
    // Mehrfinger = native Browser-Geste (z. B. iOS Tab-Übersicht) → Drag aus.
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

  return (
    <div
      className="relative isolate min-h-0 flex-1 overflow-hidden"
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
        className="pointer-events-auto absolute inset-0 z-10 cursor-grab border-none outline-none [backface-visibility:hidden] active:cursor-grabbing"
        style={{ x, rotate, touchAction: "none" }}
        drag={dragEnabled ? "x" : false}
        dragElastic={0.6}
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0 }}
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
