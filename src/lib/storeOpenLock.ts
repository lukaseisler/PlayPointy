/**
 * All Packs opens on pointerdown. The leftover click must not dismiss the
 * store. A short timer is enough — tracking fingers forever blocked close
 * when iOS dropped a pointerup.
 */
const CLOSE_GRACE_MS = 800;

let closeBlockedUntil = 0;

export function lockStoreOpen(_pointerId?: number) {
  closeBlockedUntil = Date.now() + CLOSE_GRACE_MS;
}

export function isStoreCloseBlocked() {
  return Date.now() < closeBlockedUntil;
}
