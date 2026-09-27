import { copyFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const SRC = "public/logo-saturated.png";

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

async function resize(size) {
  return sharp(SRC).resize(size, size, { kernel: "lanczos3" }).png().toBuffer();
}

copyFileSync(SRC, "public/playpointyapplogo.png");

const icon512 = await resize(512);
const icon192 = await resize(192);
const apple180 = await resize(180);
const fav48 = await resize(48);
const fav32 = await resize(32);
const fav16 = await resize(16);

writeFileSync("public/icon-512x512.png", icon512);
writeFileSync("public/icon-192x192.png", icon192);
writeFileSync("public/apple-touch-icon.png", apple180);
writeFileSync("public/favicon-32x32.png", fav32);
writeFileSync(
  "public/favicon.ico",
  pngToIco([
    { size: 16, buf: fav16 },
    { size: 32, buf: fav32 },
    { size: 48, buf: fav48 },
  ]),
);

console.log("wrote exact resizes of the Photoshop logo");
