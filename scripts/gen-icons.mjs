// Zero-dependency PWA icon generator.
// Renders the GHIM perfume-bottle mark (from app/icon.svg) into 192x192 and
// 512x512 PNGs using only Node's built-in zlib + fs (no sharp/canvas needed).
// Run: node scripts/gen-icons.mjs
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const NAVY = [10, 14, 23]; // #0a0e17
const BOTTLE = [21, 19, 31]; // #15131f
const CAP = [29, 26, 43]; // #1d1a2b
const GOLD = [201, 162, 75]; // #c9a24b

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function makeIcon(N) {
  const S = N * 2; // 2x supersample for smooth edges
  const f = S / 64; // viewBox is 64
  const hr = new Float32Array(S * S * 3);
  for (let i = 0; i < hr.length; i += 3) {
    hr[i] = NAVY[0];
    hr[i + 1] = NAVY[1];
    hr[i + 2] = NAVY[2];
  }

  const setP = (sx, sy, col, a) => {
    if (a <= 0) return;
    if (sx < 0 || sy < 0 || sx >= S || sy >= S) return;
    const i = (sy * S + sx) * 3;
    const inv = 1 - a;
    hr[i] = hr[i] * inv + col[0] * a;
    hr[i + 1] = hr[i + 1] * inv + col[1] * a;
    hr[i + 2] = hr[i + 2] * inv + col[2] * a;
  };

  const sdfRR = (x, y, x0, y0, x1, y1, r) => {
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const qx = Math.abs(x - cx) - (x1 - x0) / 2 + r;
    const qy = Math.abs(y - cy) - (y1 - y0) / 2 + r;
    const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    return outside;
  };

  const fillRR = (x0, y0, x1, y1, r, col) => {
    const minx = Math.floor(x0 - r - 1);
    const maxx = Math.ceil(x1 + r + 1);
    const miny = Math.floor(y0 - r - 1);
    const maxy = Math.ceil(y1 + r + 1);
    for (let sy = miny; sy <= maxy; sy++)
      for (let sx = minx; sx <= maxx; sx++) {
        const a = Math.max(0, Math.min(1, -sdfRR(sx + 0.5, sy + 0.5, x0, y0, x1, y1, r)));
        if (a > 0) setP(sx, sy, col, a);
      }
  };

  const strokeRR = (x0, y0, x1, y1, r, t, col) => {
    const minx = Math.floor(x0 - r - t);
    const maxx = Math.ceil(x1 + r + t);
    const miny = Math.floor(y0 - r - t);
    const maxy = Math.ceil(y1 + r + t);
    for (let sy = miny; sy <= maxy; sy++)
      for (let sx = minx; sx <= maxx; sx++) {
        const sd = sdfRR(sx + 0.5, sy + 0.5, x0, y0, x1, y1, r);
        const a = Math.max(0, Math.min(1, t / 2 - Math.abs(sd)));
        if (a > 0) setP(sx, sy, col, a);
      }
  };

  const fillCircle = (cx, cy, r, col) => {
    const minx = Math.floor(cx - r - 1);
    const maxx = Math.ceil(cx + r + 1);
    const miny = Math.floor(cy - r - 1);
    const maxy = Math.ceil(cy + r + 1);
    for (let sy = miny; sy <= maxy; sy++)
      for (let sx = minx; sx <= maxx; sx++) {
        const d = Math.hypot(sx + 0.5 - cx, sy + 0.5 - cy);
        const a = Math.max(0, Math.min(1, r - d));
        if (a > 0) setP(sx, sy, col, a);
      }
  };

  const distToSeg = (px, py, x0, y0, x1, y1) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - x0) * dx + (py - y0) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
  };

  const line = (x0, y0, x1, y1, t, col, alpha = 1) => {
    const minx = Math.floor(Math.min(x0, x1) - t - 1);
    const maxx = Math.ceil(Math.max(x0, x1) + t + 1);
    const miny = Math.floor(Math.min(y0, y1) - t - 1);
    const maxy = Math.ceil(Math.max(y0, y1) + t + 1);
    for (let sy = miny; sy <= maxy; sy++)
      for (let sx = minx; sx <= maxx; sx++) {
        const d = distToSeg(sx + 0.5, sy + 0.5, x0, y0, x1, y1);
        const a = Math.max(0, Math.min(1, t / 2 - d)) * alpha;
        if (a > 0) setP(sx, sy, col, a);
      }
  };

  // Bottle body
  fillRR(24 * f, 26 * f, 40 * f, 54 * f, 4 * f, BOTTLE);
  strokeRR(24 * f, 26 * f, 40 * f, 54 * f, 4 * f, 2.4 * f, GOLD);
  // Cap
  fillRR(28 * f, 14 * f, 36 * f, 26 * f, 2 * f, CAP);
  strokeRR(28 * f, 14 * f, 36 * f, 26 * f, 2 * f, 2.4 * f, GOLD);
  // Spray / atomizer
  fillCircle(32 * f, 9 * f, 2.2 * f, GOLD);
  // Mist lines
  line(22 * f, 40 * f, 26 * f, 32 * f, 1.6 * f, GOLD, 0.7);
  line(42 * f, 40 * f, 38 * f, 32 * f, 1.6 * f, GOLD, 0.7);

  // Downscale 2x -> N with averaging
  const out = new Uint8Array(N * N * 3);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const hx = x * 2 + dx;
          const hy = y * 2 + dy;
          const i = (hy * S + hx) * 3;
          r += hr[i];
          g += hr[i + 1];
          b += hr[i + 2];
        }
      const o = (y * N + x) * 3;
      out[o] = Math.round(r / 4);
      out[o + 1] = Math.round(g / 4);
      out[o + 2] = Math.round(b / 4);
    }
  }

  // Encode PNG (RGBA, 8-bit)
  const raw = Buffer.alloc(N * N * 4 + N);
  let p = 0;
  for (let y = 0; y < N; y++) {
    raw[p++] = 0;
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 3;
      raw[p++] = out[i];
      raw[p++] = out[i + 1];
      raw[p++] = out[i + 2];
      raw[p++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(N, 0);
  ihdr.writeUInt32BE(N, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = path.join(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const png = makeIcon(size);
  const file = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`wrote ${file} (${png.length} bytes)`);
}
console.log('done');
