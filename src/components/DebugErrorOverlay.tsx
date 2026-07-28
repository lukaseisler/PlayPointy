"use client";

import { useEffect, useState } from "react";

interface CapturedError {
  message: string;
  source: "error" | "unhandledrejection";
}

function describeError(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Sichtbare Rot-Fehlerbox fuer Live-Diagnose auf echten Mobilgeraeten ohne
 * angeschlossene DevTools. Faengt globale JS-Fehler ab (z.B. in Framer-
 * Motion Touch-/Pointer-Listenern, die sonst lautlos in der fuer den Nutzer
 * unerreichbaren Konsole verschwinden wuerden) und zeigt die Fehlermeldung
 * DIREKT im UI an. Bewusst als eigenstaendige, immer gemountete Komponente
 * (statt Teil der ErrorBoundary) und ganz oben im Layout platziert, ausser-
 * halb von PhoneFrame's `overflow-hidden`-Containern, damit sie garantiert
 * sichtbar bleibt, egal in welchem Zustand der Rest der App gerade haengt.
 */
export default function DebugErrorOverlay() {
  const [errors, setErrors] = useState<CapturedError[]>([]);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      const message = event.error ? describeError(event.error) : event.message || "Unknown error";
      setErrors((prev) => [...prev, { message, source: "error" }]);
    }
    function handleRejection(event: PromiseRejectionEvent) {
      setErrors((prev) => [...prev, { message: describeError(event.reason), source: "unhandledrejection" }]);
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (errors.length === 0) return null;

  return (
    <div className="pointer-events-auto fixed inset-x-0 top-0 z-[9999] max-h-[70dvh] overflow-y-auto bg-red-600 px-4 py-3 text-white shadow-2xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold tracking-wide uppercase">
          ⚠️ Debug: {errors.length} JS Error{errors.length > 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={() => setErrors([])}
          className="pointer-events-auto rounded-full bg-white/20 px-3 py-1 text-xs font-bold"
        >
          Dismiss
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {errors.map((err, i) => (
          <pre
            key={i}
            className="overflow-x-auto rounded bg-black/20 px-2 py-1.5 font-mono text-[11px] leading-snug whitespace-pre-wrap break-words"
          >
            [{err.source}] {err.message}
          </pre>
        ))}
      </div>
    </div>
  );
}
