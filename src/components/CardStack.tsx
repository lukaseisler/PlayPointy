"use client";

import { animate, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useRef } from "react";
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

/**
 * Zeigt die aktuelle Karte (per Drag/Swipe steuerbar) plus die Karte, die
 * beim Wegziehen sichtbar wird - exakt deckungsgleich dahinter (kein
 * inset/scale/rotate-Versatz, kein sichtbarer Rahmen/Spalt/Seam).
 *
 * WICHTIG: Welche Karte dahinter auftaucht, haengt von der Zugrichtung ab:
 * - Zieht man nach LINKS (x < 0)  -> dahinter erscheint die NAECHSTE Karte
 *   (Swipe links = "naechste Karte").
 * - Zieht man nach RECHTS (x > 0) -> dahinter erscheint die VORHERIGE Karte
 *   (Swipe rechts = "Undo/zurueck"). Vorher wurde hier immer nur `index + 1`
 *   gezeigt, wodurch beim Rechts-Swipe zunaechst die falsche (naechste) Karte
 *   sichtbar war und erst nach Abschluss der Animation auf die vorherige
 *   "umgesprungen" ist. Beide Karten liegen jetzt permanent uebereinander im
 *   DOM und ihre Opacity ist direkt an das Vorzeichen von `x` gekoppelt -
 *   dadurch ist von der allerersten Pixel-Bewegung an die richtige Karte
 *   sichtbar, ganz ohne Sprung am Ende.
 *
 * Swipe links  -> onSwipeLeft()  (nächste Karte)
 * Swipe rechts -> onSwipeRight() (vorherige Karte)
 * dragMomentum ist deaktiviert, damit unsere eigene Spring-/Fly-Out-Animation
 * in onDragEnd nicht mit Framer Motions Trägheits-Animation konkurriert.
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
  // Sichtbarkeit der beiden "dahinter"-Karten - Stufenfunktion statt Fade,
  // damit exakt beim Vorzeichenwechsel von `x` (Zugrichtung) instantan auf
  // die jeweils passende Karte umgeschaltet wird.
  const showNext = useTransform(x, (v) => (v > 0 ? 0 : 1));
  const showPrev = useTransform(x, (v) => (v > 0 ? 1 : 0));
  const isFlying = useRef(false);

  const current = cards[index];
  const next = cards[index + 1];
  // Sonderfall erste Karte (index === 0): Es gibt noch keine "vorherige"
  // Karte - ein Rechts-Swipe auf Karte 1 verhaelt sich bewusst identisch
  // zu Links, zeigt also ebenfalls schon die NAECHSTE Karte dahinter,
  // statt wrap-around auf die letzte Karte des Stapels zu springen.
  const prevIndex = index > 0 ? index - 1 : index + 1;
  const prev = cards[prevIndex];

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    // Swipe hoch/runter steuert den nativen Vollbildmodus - unabhaengig vom
    // aktuellen Karten-Index, jederzeit waehrend des Spiels nutzbar. Early
    // Return in BEIDEN Faellen (direkt nach dem `setTimeout`, nicht darin):
    // die Karte soll dabei NICHT wie bei Links/Rechts abgeworfen werden,
    // sondern (dank `dragConstraints`/`dragElastic` auf y) sofort elastisch
    // in die Mitte zurueckschnappen. Der eigentliche Fullscreen-Wechsel wird
    // um 450ms verzoegert (vorher 350ms, davor 250ms - stufenweise erhoeht,
    // um dem Browser maximalen Puffer fuer den Layout-Shift zu geben), damit
    // dieser Snap-back inkl. Spring-Ausschwingen VOLLSTAENDIG abgeschlossen
    // ist, BEVOR der Browser den intensiven Layout-Shift fuer den
    // Fullscreen-Wechsel ausfuehrt - sonst ueberlagern sich beide
    // Animationen und es ruckelt sichtbar.
    if (info.offset.y < -100) {
      setTimeout(() => {
        try {
          document.documentElement.requestFullscreen().catch(() => {});
        } catch {
          // Ignore Safari specific errors
        }
      }, 450);
      return;
    }
    if (info.offset.y > 100) {
      setTimeout(() => {
        try {
          document.exitFullscreen().catch(() => {});
        } catch {
          // Ignore Safari specific errors
        }
      }, 450);
      return;
    }

    if (isFlying.current) return;

    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;
    const shouldSwipe =
      Math.abs(offsetX) > SWIPE_DISTANCE_THRESHOLD || Math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD;

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

  if (!current) return null;

  return (
    // `isolate` erzeugt einen eigenen Stacking-Context, damit die z-index
    // Werte der Karten sich nicht mit Modals/anderen Teilen der Seite mischen.
    // `touch-none` verhindert, dass der Browser hier eigene Scroll-/Zoom-
    // Gesten gegen Framer Motions Drag-Erkennung "gewinnt".
    <div className="relative isolate min-h-0 flex-1 touch-none overflow-hidden">
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

      {/* GameCard fuellt den Frame randlos (`h-full w-full`) – daher kein
          `items-center justify-center` mehr (das gehoerte zum kurzlebigen
          "schwebende Spielkarte"-Experiment). */}
      <motion.div
        key={current.id}
        className="pointer-events-auto absolute inset-0 z-10 cursor-grab touch-none border-none outline-none [backface-visibility:hidden] active:cursor-grabbing"
        style={{ x, rotate }}
        // Beide Achsen aktiv (statt nur "x"), damit ein Swipe hoch/runter
        // (Fullscreen an/aus, siehe `handleDragEnd`) ueberhaupt als Drag-
        // Geste erkannt wird - mit `drag="x"` allein wuerde Framer Motion
        // eine vorwiegend vertikale Bewegung gar nicht erst als Drag werten.
        // `dragDirectionLock` committet weiterhin fruehzeitig auf genau EINE
        // Achse, wodurch sich Links/Rechts nach wie vor exakt wie zuvor
        // anfuehlen - nur eben mit Vertikal als echter Alternative statt
        // totem Winkel. `dragConstraints`/`dragElastic` fuer top/bottom
        // sorgen dafuer, dass die Karte nach dem Loslassen (in JEDEM Fall)
        // elastisch in die Mitte zurueckschnappt statt zu "kleben".
        drag
        dragDirectionLock={true}
        dragElastic={{ left: 0.6, right: 0.6, top: 0.4, bottom: 0.4 }}
        dragMomentum={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        {renderCard(current, index)}
      </motion.div>
    </div>
  );
}
