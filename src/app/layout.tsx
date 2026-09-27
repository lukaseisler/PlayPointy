import type { Metadata, Viewport } from "next";
import { Fredoka, Oswald } from "next/font/google";
import DebugErrorOverlay from "@/components/DebugErrorOverlay";
import JsonLd from "@/components/JsonLd";
import {
  SEO_DESCRIPTION,
  SEO_TITLE,
  SITE_NAME,
  SITE_URL,
  websiteJsonLd,
} from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SEO_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Lukas Eisler", url: SITE_URL }],
  creator: "Lukas Eisler",
  category: "games",
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zwingend für iOS Safe-Area-Variablen (env(safe-area-inset-*)).
  // Kein maximumScale/userScalable:false – sonst blockiert iOS Safari die
  // native Pinch-Geste in die Tab-Übersicht.
  viewportFit: "cover",
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
            das Spiel im Vollbild (ohne Browser-Chrome) laufen kann.
            Icons/Manifest kommen primaer aus `metadata` oben; Link bleibt
            als Fallback fuer aeltere Clients. */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Sofort, vor React: iPhone (nicht PWA) markieren, damit CSS greift
            auch wenn Hydration/HMR auf dem Gerät hakt. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var n=navigator,u=n.userAgent||"",ios=/iPhone|iPad|iPod/i.test(u)||(n.platform==="MacIntel"&&n.maxTouchPoints>1);var st=n.standalone===true||window.matchMedia("(display-mode:standalone)").matches;if(ios&&!st)document.documentElement.setAttribute("data-ios-safari","");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans">
        {/* Ausserhalb von PhoneFrame's `overflow-hidden`-Containern gemountet,
            damit die Fehlerbox garantiert sichtbar ist - auch wenn irgendwo
            tiefer im Baum etwas haengt/abstuerzt. */}
        <JsonLd data={websiteJsonLd()} />
        <DebugErrorOverlay />
        {children}
      </body>
    </html>
  );
}
