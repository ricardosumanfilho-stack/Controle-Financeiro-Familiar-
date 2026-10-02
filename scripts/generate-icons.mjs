import fs from 'node:fs';
import zlib from 'node:zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer: height rows, each row has 1 filter byte (0) + width * 4 bytes
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter method
  ihdrData[12] = 0; // Interlace: None

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcTarget = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcVal = crc32(crcTarget);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

// CRC32 table & implementation
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    crcTable[n] = c;
  }
  return crcTable;
}

function crc32(buf) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function drawFinanceIcon(isMaskable) {
  return (x, y, w, h) => {
    const nx = x / w;
    const ny = y / h;

    // Gradient background: from Blue #2563eb through Indigo #4f46e5 to Emerald #059669
    const gradT = (nx + ny) / 2;
    let bgR, bgG, bgB;
    if (gradT < 0.5) {
      const t = gradT / 0.5;
      bgR = Math.round(37 * (1 - t) + 79 * t);
      bgG = Math.round(99 * (1 - t) + 70 * t);
      bgB = Math.round(235 * (1 - t) + 229 * t);
    } else {
      const t = (gradT - 0.5) / 0.5;
      bgR = Math.round(79 * (1 - t) + 5 * t);
      bgG = Math.round(70 * (1 - t) + 150 * t);
      bgB = Math.round(229 * (1 - t) + 105 * t);
    }

    if (!isMaskable) {
      // Rounded corners
      const cornerRadius = w * 0.22;
      const dx = Math.min(x, w - 1 - x);
      const dy = Math.min(y, h - 1 - y);
      if (dx < cornerRadius && dy < cornerRadius) {
        const dist = Math.hypot(cornerRadius - dx, cornerRadius - dy);
        if (dist > cornerRadius) {
          return [0, 0, 0, 0]; // Transparent outside rounded corner
        }
      }
    }

    // Centered Wallet Graphic
    // Center point: (0.5, 0.52)
    const scale = isMaskable ? 0.72 : 0.85; // Extra padding for maskable safe-zone (80% circle)
    const cx = 0.5;
    const cy = 0.52;

    const wx = (nx - cx) / scale;
    const wy = (ny - cy) / scale;

    // Check Wallet Card peaking from top (wx between -0.22 and 0.22, wy between -0.32 and -0.15)
    if (wx >= -0.22 && wx <= 0.22 && wy >= -0.32 && wy <= -0.15) {
      return [56, 189, 248, 255]; // Sky blue card
    }

    // Main wallet body: wx [-0.38, 0.38], wy [-0.18, 0.32] with rounded corners
    const wWidth = 0.76;
    const wHeight = 0.50;
    const rx = 0.08;
    if (Math.abs(wx) <= wWidth / 2 && Math.abs(wy - 0.07) <= wHeight / 2) {
      // Check rounded corners of wallet
      const edgX = wWidth / 2 - Math.abs(wx);
      const edgY = wHeight / 2 - Math.abs(wy - 0.07);
      if (edgX < rx && edgY < rx) {
        const cornerDist = Math.hypot(rx - edgX, rx - edgY);
        if (cornerDist > rx) {
          return [bgR, bgG, bgB, 255];
        }
      }

      // Wallet pocket flap clasp: wx [0.12, 0.38], wy [-0.02, 0.16]
      if (wx >= 0.12 && wx <= 0.38 && wy >= -0.02 && wy <= 0.16) {
        // Clasp gold circle: center at (0.24, 0.07), radius 0.045
        const claspDist = Math.hypot(wx - 0.24, wy - 0.07);
        if (claspDist <= 0.045) {
          if (claspDist <= 0.015) {
            return [255, 255, 255, 255]; // White inner pip
          }
          return [251, 191, 36, 255]; // Amber gold button
        }
        return [30, 41, 59, 255]; // Slate-800 dark pocket flap
      }

      // Trend line or wallet body fill
      // Trend upward graph in emerald
      const isTrend = (
        (wx >= -0.28 && wx <= -0.16 && Math.abs(wy - (0.20 - (wx + 0.28) * 0.8)) < 0.02) ||
        (wx >= -0.16 && wx <= -0.04 && Math.abs(wy - (0.10 + (wx + 0.16) * 0.4)) < 0.02) ||
        (wx >= -0.04 && wx <= 0.08 && Math.abs(wy - (0.15 - (wx + 0.04) * 1.0)) < 0.02)
      );
      if (isTrend) {
        return [16, 185, 129, 255]; // Emerald graph line
      }

      // Wallet body color: off-white
      return [248, 250, 252, 255];
    }

    return [bgR, bgG, bgB, 255];
  };
}

fs.mkdirSync('./public', { recursive: true });

console.log('Generating PNG icons...');
const png192 = createPNG(192, 192, drawFinanceIcon(false));
fs.writeFileSync('./public/pwa-192x192.png', png192);

const png512 = createPNG(512, 512, drawFinanceIcon(false));
fs.writeFileSync('./public/pwa-512x512.png', png512);

const pngMaskable512 = createPNG(512, 512, drawFinanceIcon(true));
fs.writeFileSync('./public/pwa-maskable-512x512.png', pngMaskable512);

const appleTouchIcon = createPNG(180, 180, drawFinanceIcon(false));
fs.writeFileSync('./public/apple-touch-icon.png', appleTouchIcon);

const favicon32 = createPNG(32, 32, drawFinanceIcon(false));
fs.writeFileSync('./public/favicon.ico', favicon32);

console.log('Icons generated successfully in public/');
