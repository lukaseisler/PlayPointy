/**
 * All Packs oeffnet auf pointerdown. Ein zweiter Finger am Displayrand
 * darf den Store danach nicht sofort wieder schliessen.
 */

const downIds = new Set<number>();
const heldSinceOpen = new Set<number>();
let closeBlockedUntil = 0;
let listening = false;

function onPointerDown(e: PointerEvent) {
  downIds.add(e.pointerId);
}

function onPointerUp(e: PointerEvent) {
  downIds.delete(e.pointerId);
  heldSinceOpen.delete(e.pointerId);
  if (downIds.size === 0) {
    closeBlockedUntil = Math.max(closeBlockedUntil, Date.now() + 400);
  }
}

export function ensureStorePointerTracking() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointerup", onPointerUp, true);
  window.addEventListener("pointercancel", onPointerUp, true);
}

/** Sofort aufrufen, bevor der Store rendert — nicht erst im useEffect. */
export function lockStoreOpen(pointerId?: number) {
  ensureStorePointerTracking();
  closeBlockedUntil = Date.now() + 1000;
  heldSinceOpen.clear();
  for (const id of downIds) heldSinceOpen.add(id);
  if (pointerId !== undefined) {
    downIds.add(pointerId);
    heldSinceOpen.add(pointerId);
  }
}

export function isStoreCloseBlocked() {
  if (Date.now() < closeBlockedUntil) return true;
  if (heldSinceOpen.size > 0) return true;
  if (downIds.size > 1) return true;
  return false;
}
