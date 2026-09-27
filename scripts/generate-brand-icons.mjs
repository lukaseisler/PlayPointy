import { writeFileSync } from "node:fs";
import sharp from "sharp";

const SRC = "public/logo saturated.png";

function pngToIco(images) {
  const count = images.length;
  let offset = 6 + 16 * count;
  const out = Buffer.alloc(
    offset + images.reduce((sum, img) => sum + img.buf.length, 0),
  );
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(count, 4);
  images.forEach((img, i) => {
    const entry = 6 + i * 16;
    out[entry] = img.size >= 256 ? 0 : img.size;
    out[entry + 1] = img.size >= 256 ? 0 : img.size;
    out.writeUInt16LE(1, entry + 4);
    out.writeUInt16LE(32, entry + 6);
    out.writeUInt32LE(img.buf.length, entry + 8);
    out.writeUInt32LE(offset, entry + 12);
    img.buf.copy(out, offset);
    offset += img.buf.length;
  });
  return out;
}

function isWhitePixel(r, g, b) {
  const minC = Math.min(r, g, b);
  const maxC = Math.max(r, g, b);
  return minC > 168 && maxC - minC < 55;
}

async function extractMark(size) {
  const { data, info } = await sharp(SRC)
    .resize(size, size, { kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const minC = Math.min(r, g, b);
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = isWhitePixel(r, g, b)
      ? Math.min(255, Math.round((minC - 150) * 2.4))
      : 0;
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

function backgroundSvg(size) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="diag" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff1f4f"/>
      <stop offset="22%" stop-color="#e700f3"/>
      <stop offset="55%" stop-color="#0076ff"/>
      <stop offset="100%" stop-color="#0081ff"/>
    </linearGradient>
    <radialGradient id="hot" cx="42%" cy="38%" r="52%">
      <stop offset="0%" stop-color="#ff2ee6"/>
      <stop offset="60%" stop-color="#ff2ee6" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ff2ee6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orange" cx="4%" cy="52%" r="42%">
      <stop offset="0%" stop-color="#ffab00"/>
      <stop offset="100%" stop-color="#ffab00" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="green" cx="10%" cy="96%" r="46%">
      <stop offset="0%" stop-color="#00f469"/>
      <stop offset="100%" stop-color="#00f469" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cyan" cx="52%" cy="100%" r="38%">
      <stop offset="0%" stop-color="#008bff"/>
      <stop offset="100%" stop-color="#008bff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#diag)"/>
  <rect width="100%" height="100%" fill="url(#hot)"/>
  <rect width="100%" height="100%" fill="url(#orange)"/>
  <rect width="100%" height="100%" fill="url(#green)"/>
  <rect width="100%" height="100%" fill="url(#cyan)"/>
</svg>`);
}

async function makeIcon(size, logoScale) {
  const bg = await sharp(backgroundSvg(size)).png().toBuffer();
  const logoSize = Math.round(size * logoScale);
  const mark = await extractMark(logoSize);
  const inset = Math.round((size - logoSize) / 2);
  return sharp(bg)
    .composite([{ input: mark, left: inset, top: inset }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const ICON_SCALE = 0.72;
const STRIPE_SCALE = 0.84;

const icon512 = await makeIcon(512, ICON_SCALE);
const icon192 = await makeIcon(192, ICON_SCALE);
const apple180 = await makeIcon(180, ICON_SCALE);
const stripe = await makeIcon(1024, STRIPE_SCALE);
const fav48 = await sharp(SRC).resize(48, 48, { kernel: "lanczos3" }).png().toBuffer();
const fav32 = await sharp(SRC).resize(32, 32, { kernel: "lanczos3" }).png().toBuffer();
const fav16 = await sharp(SRC).resize(16, 16, { kernel: "lanczos3" }).png().toBuffer();

writeFileSync("public/icon-512x512.png", icon512);
writeFileSync("public/icon-192x192.png", icon192);
writeFileSync("public/apple-touch-icon.png", apple180);
writeFileSync("public/playpointyapplogo.png", stripe);
writeFileSync("public/favicon-32x32.png", fav32);
writeFileSync(
  "public/favicon.ico",
  pngToIco([
    { size: 16, buf: fav16 },
    { size: 32, buf: fav32 },
    { size: 48, buf: fav48 },
  ]),
);

console.log("wrote icons from saturated logo");
