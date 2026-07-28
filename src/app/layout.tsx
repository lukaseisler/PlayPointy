import type { Metadata, Viewport } from "next";
import { Fredoka, Oswald } from "next/font/google";
import DebugErrorOverlay from "@/components/DebugErrorOverlay";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Seriösere, kondensierte Zweit-Schrift fuer den Pack-Namen - wirkt in
// Grossbuchstaben + weitem Tracking wie ein authentischer Kartendruck,
// waehrend Fredoka (rund/verspielt) fuer den Rest der UI zustaendig bleibt.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PlayPointy - Who is more likely to...",
  description:
    "The ultimate party card game for your group. No download, no account – just play.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#171717",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${oswald.variable} h-full antialiased`}>
      <head>
        {/* PWA-Basis: erlaubt "Add to Home Screen" auf Mobilgeraeten, damit
            das Spiel im Vollbild (ohne Browser-Chrome) laufen kann. */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="h-full min-h-dvh bg-neutral-950 font-sans">
        {/* Ausserhalb von PhoneFrame's `overflow-hidden`-Containern gemountet,
            damit die Fehlerbox garantiert sichtbar ist - auch wenn irgendwo
            tiefer im Baum etwas haengt/abstuerzt. */}
        <DebugErrorOverlay />
        {children}
      </body>
    </html>
  );
}
