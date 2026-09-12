"use client";

import { useRouter } from "next/navigation";

/**
 * Legal-Seiten werden aus mehreren Kontexten geoeffnet (Store, Login, Spiel).
 * Modal-Zustaende leben in React-State und ueberleben eine Navigation nicht,
 * darum tragen die Links aus einem Modal `?return=<kontext>`. Das X springt
 * dann dorthin zurueck statt nur ins Spiel.
 */
const RETURN_TARGETS: Record<string, string> = {
  store: "/?store=1",
  login: "/?login=1",
};

export default function LegalCloseButton() {
  const router = useRouter();

  function handleClose() {
    const hint = new URLSearchParams(window.location.search).get("return") ?? "";
    const target = RETURN_TARGETS[hint];

    if (target) {
      // replace: die Legal-Seite bleibt nicht als eigener History-Eintrag liegen.
      router.replace(target);
      return;
    }
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <button
      type="button"
      aria-label="Close"
      onClick={handleClose}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
    >
      ✕
    </button>
  );
}
