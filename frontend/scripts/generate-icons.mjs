import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal PNG generator in pure Node.js
function createPNG(width, height, drawFn) {
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG structure
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk (raw image data with 0 filter byte per scanline)
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width * 4 + 1)] = 0; // Filter: None
    buffer.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crcBuf]);
}

// Fintech icon pixel renderer (Rounded rectangle + glowing gradient emblem)
function drawFinTrackIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background rounded rect calculation (corner radius 22%)
  const r = 0.22;
  const dx = Math.max(0, Math.max(r - nx, nx - (1 - r)));
  const dy = Math.max(0, Math.max(r - ny, ny - (1 - r)));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > r) {
    return [0, 0, 0, 0]; // transparent outside rounded corner
  }

  // Inner card background: dark slate (#0f172a to #090d16)
  let bgR = Math.round(15 - ny * 6);
  let bgG = Math.round(23 - ny * 10);
  let bgB = Math.round(42 - ny * 20);

  // Subtle border glow (indigo/cyan)
  const isBorder = (dist > r - 0.03) || (nx < 0.04 || nx > 0.96 || ny < 0.04 || ny > 0.96);
  if (isBorder) {
    const t = nx * 0.5 + ny * 0.5;
    return [
      Math.round(99 * (1 - t) + 6 * t),
      Math.round(102 * (1 - t) + 182 * t),
      Math.round(241 * (1 - t) + 212 * t),
      255
    ];
  }

  // Draw Trendline and Rupee symbol inside center (0.2 to 0.8)
  const cx = nx;
  const cy = ny;

  // Horizontal top bar for currency (y ~ 0.38, x from 0.30 to 0.52)
  if (Math.abs(cy - 0.38) < 0.02 && cx >= 0.30 && cx <= 0.52) {
    return [226, 232, 240, 255]; // light slate white
  }

  // Trend line segments: (0.28, 0.68) -> (0.45, 0.50) -> (0.58, 0.62) -> (0.76, 0.38)
  const inLine1 = distToSegment(cx, cy, 0.28, 0.68, 0.45, 0.50) < 0.025;
  const inLine2 = distToSegment(cx, cy, 0.45, 0.50, 0.58, 0.62) < 0.025;
  const inLine3 = distToSegment(cx, cy, 0.58, 0.62, 0.76, 0.38) < 0.025;
  
  // Arrowhead at (0.76, 0.38): horizontal to 0.65, vertical to 0.49
  const inArrowH = Math.abs(cy - 0.38) < 0.025 && cx >= 0.64 && cx <= 0.76;
  const inArrowV = Math.abs(cx - 0.76) < 0.025 && cy >= 0.38 && cy <= 0.50;

  if (inLine1 || inLine2 || inLine3 || inArrowH || inArrowV) {
    // Gradient from Indigo (#818cf8) to Cyan (#22d3ee)
    const t = cx;
    return [
      Math.round(129 * (1 - t) + 34 * t),
      Math.round(140 * (1 - t) + 211 * t),
      Math.round(248 * (1 - t) + 238 * t),
      255
    ];
  }

  // Center subtle ambient glow
  const centerDist = Math.hypot(cx - 0.5, cy - 0.5);
  if (centerDist < 0.35) {
    const glow = (1 - centerDist / 0.35) * 20;
    bgR = Math.min(255, bgR + Math.round(glow * 1.5));
    bgG = Math.min(255, bgG + Math.round(glow * 2.0));
    bgB = Math.min(255, bgB + Math.round(glow * 4.0));
  }

  return [bgR, bgG, bgB, 255];
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

const iconsDir = path.resolve('public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate 192x192
const png192 = createPNG(192, 192, drawFinTrackIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);

// Generate 512x512
const png512 = createPNG(512, 512, drawFinTrackIcon);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);

// Generate apple-touch-icon
const appleIcon = createPNG(180, 180, drawFinTrackIcon);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleIcon);
fs.writeFileSync(path.resolve('public', 'apple-touch-icon.png'), appleIcon);

console.log('✅ Generated 192x192, 512x512, and apple-touch-icon PNGs successfully.');
