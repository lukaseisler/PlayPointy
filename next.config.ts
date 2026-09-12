import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 blockiert im Dev-Modus standardmaessig JEDE Cross-Origin-
  // Anfrage an interne Dev-Ressourcen (v.a. den `/_next/webpack-hmr`
  // Hot-Reload-Websocket) - das Smartphone erreicht den Dev-Server aber
  // zwangslaeufig ueber die LAN-IP dieses Rechners, nie ueber "localhost".
  // Ohne diesen Eintrag wird die HMR-Verbindung vom Handy aus geblockt
  // (siehe Server-Log: "Blocked cross-origin request ... from
  // 192.168.178.155"), was genau erklaert, warum jeder App-Code-Fix auf
  // localhost im Test funktionierte, auf dem echten Handy aber nie half.
  // Die LAN-IP wechselt per DHCP, darum stehen hier ganze private Bereiche
  // statt einzelner Adressen.
  allowedDevOrigins: [
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
    "192.168.*.*",
  ],
  // Lokale WebPs direkt ausliefern – vermeidet `/_next/image`-404er auf
  // Cloudflare ohne aktiviertes Cloudflare Images Produkt.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
