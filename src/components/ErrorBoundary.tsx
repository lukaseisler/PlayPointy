"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Fängt Laufzeitfehler beim Client-Render ab (v.a. auf Mobilgeräten mit
 * abweichenden Browser-APIs). Ohne diese Boundary würde ein einzelner
 * ungefangener Fehler die komplette Hydration abbrechen und die Seite bliebe
 * als reglose/"eingefrorene" statische SSR-HTML ohne jede Interaktion stehen.
 * Mit der Boundary bekommt der Nutzer stattdessen einen Reload-Button.
 *
 * React-Error-Boundaries fangen NUR Fehler waehrend des Renderns ab - nicht
 * aber Fehler, die asynchron in Event-Handlern (z.B. innerhalb von Framer-
 * Motion Touch-/Pointer-Listenern) oder in Promises geworfen werden. Genau
 * solche Fehler koennten auf Mobilgeraeten sonst still im Hintergrund
 * verpuffen und die Karte "tot", aber sichtbar interaktionslos zuruecklassen.
 * Deshalb haengt sich diese Komponente zusaetzlich an `window.onerror` und
 * `unhandledrejection`, damit auch solche Faelle sanft auf die Fallback-UI
 * fuehren, statt den Nutzer vor einer eingefrorenen Karte stehen zu lassen.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("PlayPointy Laufzeitfehler:", error);
  }

  componentDidMount() {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  handleWindowError = (event: ErrorEvent) => {
    console.error("PlayPointy window error:", event.error ?? event.message);
    this.setState({ hasError: true });
  };

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error("PlayPointy unhandled promise rejection:", event.reason);
    this.setState({ hasError: true });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-white px-8 text-center">
          <div className="text-4xl">😵</div>
          <p className="text-base font-semibold text-neutral-800">
            Oops, something went wrong.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-neutral-900 px-6 py-3 text-base font-semibold text-white"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
