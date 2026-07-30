"use client";

import { useEffect, useState } from "react";
import { isStandaloneDisplayMode } from "@/lib/pwa";

/** Client-Hook: true, wenn die App als installierte PWA / Standalone läuft. */
export function useIsStandalonePwa(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    function update() {
      setStandalone(isStandaloneDisplayMode());
    }
    update();

    const queries = [
      window.matchMedia("(display-mode: standalone)"),
      window.matchMedia("(display-mode: fullscreen)"),
      window.matchMedia("(display-mode: minimal-ui)"),
    ];
    for (const mq of queries) {
      mq.addEventListener("change", update);
    }
    return () => {
      for (const mq of queries) {
        mq.removeEventListener("change", update);
      }
    };
  }, []);

  return standalone;
}
