"use client";

import { useEffect } from "react";

/** Scrolls the phone-frame legal panel to #anchors (window scroll won't). */
export default function LegalHashScroll() {
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const el = document.getElementById(id);
    el?.scrollIntoView({ block: "start" });
  }, []);
  return null;
}
