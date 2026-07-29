/**
 * Bereitet die OpenNext-Ausgabe fuer Cloudflare Pages vor.
 *
 * OpenNext (Workers-Format):
 *   .open-next/worker.js
 *   .open-next/assets/_next/...
 *   .open-next/assets/cards/...
 *
 * Cloudflare Pages erwartet:
 *   .open-next/_worker.js          ← Worker-Einstieg
 *   .open-next/_next/...             ← gleiche Pfade wie im HTML
 *   .open-next/cards/...
 *   .open-next/_routes.json          ← statische Pfade am Worker vorbei
 *
 * Ohne diesen Schritt liefert Pages 404 fuer /_next/* und /cards/* (HTML
 * referenziert /_next/..., Dateien liegen aber unter /assets/_next/...).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".open-next");
const assetsDir = path.join(root, "assets");
const workerSrc = path.join(root, "worker.js");
const workerDst = path.join(root, "_worker.js");

if (!fs.existsSync(root)) {
  console.error("Missing .open-next/ — run `opennextjs-cloudflare build` first.");
  process.exit(1);
}

if (!fs.existsSync(workerSrc)) {
  console.error("Missing .open-next/worker.js — OpenNext build incomplete.");
  process.exit(1);
}

// Pages braucht `_worker.js`; Workers-Deploy behält `worker.js`.
fs.copyFileSync(workerSrc, workerDst);
console.log("Copied worker.js → _worker.js");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(assetsDir)) {
  console.error("Missing .open-next/assets/ — OpenNext build incomplete.");
  process.exit(1);
}

for (const entry of fs.readdirSync(assetsDir)) {
  if (entry === "worker.js" || entry === "_worker.js") continue;
  copyRecursive(path.join(assetsDir, entry), path.join(root, entry));
}
console.log("Copied assets/* → .open-next/ (HTML paths match file paths)");

const routes = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/cards/*",
    "/favicon.ico",
    "/logo.png",
    "/manifest.json",
    "/cards.json",
    "/packs.json",
    "/BUILD_ID",
  ],
};

fs.writeFileSync(path.join(root, "_routes.json"), `${JSON.stringify(routes, null, 2)}\n`);
console.log("Wrote _routes.json");

const required = ["_worker.js", "_routes.json", "_next", "cards"];
for (const name of required) {
  if (!fs.existsSync(path.join(root, name))) {
    console.error(`Post-prepare check failed: missing .open-next/${name}`);
    process.exit(1);
  }
}

console.log("Cloudflare Pages output ready in .open-next/");
