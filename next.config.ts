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
  allowedDevOrigins: ["192.168.178.155", "192.168.178.*"],
};

export default nextConfig;
