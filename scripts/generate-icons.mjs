import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate a valid RGBA PNG buffer with custom dimensions and drawing
function createCosmicGalaxyPng(width = 64, height = 64) {
  // Raw uncompressed scanlines (each row starts with 0 for filter type None)
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2 - 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter byte 0 (None)

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxR) {
        // Transparent outside circle
        rawData[pixelOffset + 0] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      } else {
        const norm = dist / maxR;
        // Cosmic gradient: Outer deep purple/indigo -> Inner electric cyan / white core
        const angle = Math.atan2(dy, dx);
        const spiral = Math.sin(angle * 3 - dist * 0.4);

        let r = Math.floor(130 * (1 - norm) + 60 * (1 + spiral * 0.3));
        let g = Math.floor(60 * (1 - norm) + 180 * (1 - norm) + 30);
        let b = Math.floor(250 * (1 - norm * 0.5) + 40);
        let a = 255;

        // Soft outer anti-aliased edge
        if (dist > maxR - 1.5) {
          a = Math.floor(255 * (maxR - dist) / 1.5);
        }

        // Inner glowing core
        if (dist < maxR * 0.3) {
          const coreNorm = dist / (maxR * 0.3);
          r = Math.floor(255 * (1 - coreNorm) + r * coreNorm);
          g = Math.floor(255 * (1 - coreNorm) + g * coreNorm);
          b = 255;
        }

        // Outer ring accent (orbit ring)
        const ringDist = Math.abs(dist - maxR * 0.7);
        if (ringDist < 2.5) {
          const ringAlpha = (2.5 - ringDist) / 2.5;
          r = Math.min(255, r + Math.floor(80 * ringAlpha));
          g = Math.min(255, g + Math.floor(200 * ringAlpha));
          b = Math.min(255, b + Math.floor(255 * ringAlpha));
        }

        rawData[pixelOffset + 0] = Math.max(0, Math.min(255, r));
        rawData[pixelOffset + 1] = Math.max(0, Math.min(255, g));
        rawData[pixelOffset + 2] = Math.max(0, Math.min(255, b));
        rawData[pixelOffset + 3] = Math.max(0, Math.min(255, a));
      }
    }
  }

  // Deflate raw scanlines
  const compressed = zlib.deflateSync(rawData);

  // Helper to calculate CRC32
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }
  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);

    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);

    return Buffer.concat([lenBuf, combined, crcBuf]);
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: 0
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: 0
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Function to assemble a valid Windows .ico file containing multiple PNG resolutions
function createIcoFromPngs(pngList) {
  const count = pngList.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + (16 * count);
  const dirEntries = [];
  const imageBuffers = [];

  for (const img of pngList) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data

    dirEntries.push(entry);
    imageBuffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

// Generate icons
const buildDir = path.join(process.cwd(), 'build');
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const png512 = createCosmicGalaxyPng(512, 512);
const png256 = createCosmicGalaxyPng(256, 256);
const png64 = createCosmicGalaxyPng(64, 64);
const png32 = createCosmicGalaxyPng(32, 32);
const png16 = createCosmicGalaxyPng(16, 16);

// Build multi-res Windows ICO
const icoBuffer = createIcoFromPngs([
  { width: 256, height: 256, buffer: png256 },
  { width: 64, height: 64, buffer: png64 },
  { width: 32, height: 32, buffer: png32 },
  { width: 16, height: 16, buffer: png16 }
]);

fs.writeFileSync(path.join(buildDir, 'icon.png'), png512);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(publicDir, 'icon.png'), png64);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

console.log('✅ Generated crisp 512x512 PNG, multi-resolution Windows ICO in build/ and public/');
