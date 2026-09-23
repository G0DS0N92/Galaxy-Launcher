import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as https from 'https';
import * as http from 'http';
import AdmZip from 'adm-zip';
import { Account } from '../preload/types';

/**
 * Creates a valid RGBA PNG Buffer from raw pixel data.
 */
function createPngBuffer(width: number, height: number, rgbaData: Uint8Array | Buffer): Buffer {
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }

  function crc32(buf: Buffer): number {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(typeStr: string, data: Buffer): Buffer {
    const typeBuf = Buffer.from(typeStr, 'ascii');
    const lengthBuf = Buffer.alloc(4);
    lengthBuf.writeUInt32BE(data.length, 0);

    const crcBuf = Buffer.alloc(4);
    const typeAndData = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);

    return Buffer.concat([lengthBuf, typeAndData, crcBuf]);
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR: 13 bytes
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // color type RGBA (6)
  ihdrData.writeUInt8(0, 10); // compression deflate
  ihdrData.writeUInt8(0, 11); // filter adaptive
  ihdrData.writeUInt8(0, 12); // interlace none
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const stride = width * 4;
  const rawScanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawScanlines[rowOffset] = 0; // Filter: None
    const srcOffset = y * stride;
    for (let x = 0; x < stride; x++) {
      rawScanlines[rowOffset + 1 + x] = rgbaData[srcOffset + x] ?? 0;
    }
  }

  // IDAT Chunk
  const compressed = zlib.deflateSync(rawScanlines);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Generates cape textures (64x32) for Galaxy Cosmic Capes.
 */
function generateCapeTexture(capeId: string): Buffer {
  const width = 64;
  const height = 32;
  const pixels = new Uint8Array(width * height * 4);

  function setPixel(x: number, y: number, r: number, g: number, b: number, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = a;
  }

  // Parse color themes
  let baseColor = [24, 18, 43];
  let accent1 = [124, 58, 237]; // Purple
  let accent2 = [34, 211, 238]; // Cyan

  if (capeId === 'cape-deep-void') {
    baseColor = [10, 15, 30];
    accent1 = [6, 182, 212];
    accent2 = [56, 189, 248];
  } else if (capeId === 'cape-solar-flare') {
    baseColor = [40, 20, 5];
    accent1 = [245, 158, 11];
    accent2 = [250, 204, 21];
  } else if (capeId === 'cape-quantum-matrix') {
    baseColor = [5, 30, 20];
    accent1 = [16, 185, 129];
    accent2 = [52, 211, 153];
  } else if (capeId === 'cape-end-portal') {
    baseColor = [20, 10, 35];
    accent1 = [88, 28, 135];
    accent2 = [16, 185, 129];
  } else if (capeId === 'cape-stargazer-prism') {
    baseColor = [25, 15, 35];
    accent1 = [236, 72, 153];
    accent2 = [56, 189, 248];
  } else if (capeId === 'cape-cyber-matrix') {
    baseColor = [8, 20, 45];
    accent1 = [59, 130, 246];
    accent2 = [6, 182, 212];
  } else if (capeId === 'cape-blood-nebula') {
    baseColor = [35, 10, 15];
    accent1 = [244, 63, 94];
    accent2 = [251, 146, 60];
  }

  // Fill Background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const grad = y / height;
      const r = Math.round(baseColor[0] * (1 - grad) + accent1[0] * grad * 0.4);
      const g = Math.round(baseColor[1] * (1 - grad) + accent1[1] * grad * 0.4);
      const b = Math.round(baseColor[2] * (1 - grad) + accent1[2] * grad * 0.4);
      setPixel(x, y, r, g, b, 255);
    }
  }

  // Draw Cape Face (Main Back Side: x: 1..10, y: 1..16 for standard cape UV)
  for (let y = 1; y < 17; y++) {
    for (let x = 1; x < 11; x++) {
      const isBorder = x === 1 || x === 10 || y === 1 || y === 16;
      if (isBorder) {
        setPixel(x, y, accent2[0], accent2[1], accent2[2], 255);
      } else {
        const isStar = (x * 7 + y * 13) % 9 === 0;
        if (isStar) {
          setPixel(x, y, 255, 255, 255, 255);
        } else {
          const mix = (y - 1) / 15;
          const r = Math.round(accent1[0] * (1 - mix) + accent2[0] * mix);
          const g = Math.round(accent1[1] * (1 - mix) + accent2[1] * mix);
          const b = Math.round(accent1[2] * (1 - mix) + accent2[2] * mix);
          setPixel(x, y, r, g, b, 255);
        }
      }
    }
  }

  // Front face (x: 12..21, y: 1..16)
  for (let y = 1; y < 17; y++) {
    for (let x = 12; x < 22; x++) {
      setPixel(x, y, Math.round(accent1[0] * 0.7), Math.round(accent1[1] * 0.7), Math.round(accent1[2] * 0.7), 255);
    }
  }

  return createPngBuffer(width, height, pixels);
}

/**
 * Generates custom Elytra / Wings texture (64x32).
 */
function generateWingsTexture(wingsId: string, capeId?: string): Buffer {
  const width = 64;
  const height = 32;
  const pixels = new Uint8Array(width * height * 4);

  function setPixel(x: number, y: number, r: number, g: number, b: number, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    pixels[idx] = r;
    pixels[idx + 1] = g;
    pixels[idx + 2] = b;
    pixels[idx + 3] = a;
  }

  let wingColor = [124, 58, 237]; // Purple default
  let highlight = [34, 211, 238]; // Cyan default

  if (wingsId.includes('dark-matter') || wingsId.includes('void')) {
    wingColor = [16, 24, 48];
    highlight = [6, 182, 212];
  } else if (wingsId.includes('butterfly')) {
    wingColor = [192, 38, 211];
    highlight = [244, 114, 182];
  } else if (wingsId.includes('angel') || wingsId.includes('cyber')) {
    wingColor = [59, 130, 246];
    highlight = [255, 255, 255];
  } else if (wingsId.includes('dragon') || wingsId.includes('solar')) {
    wingColor = [220, 38, 38];
    highlight = [251, 146, 60];
  }

  // Elytra UV layout: Wing 1 (top left / right)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const grad = (x + y) / (width + height);
      const isWingEdge = x === 22 || x === 34 || y === 0 || y === 31;
      if (isWingEdge) {
        setPixel(x, y, highlight[0], highlight[1], highlight[2], 255);
      } else {
        const r = Math.round(wingColor[0] * (1 - grad * 0.5));
        const g = Math.round(wingColor[1] * (1 - grad * 0.5));
        const b = Math.round(wingColor[2] * (1 - grad * 0.5));
        setPixel(x, y, r, g, b, 240);
      }
    }
  }

  return createPngBuffer(width, height, pixels);
}

/**
 * Downloads a binary file to Buffer.
 */
function downloadBuffer(urlStr: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const client = urlStr.startsWith('https') ? https : http;
      client.get(urlStr, { timeout: 8000 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadBuffer(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Generates default Steve 64x64 skin buffer fallback.
 */
function generateFallbackSkinBuffer(): Buffer {
  const width = 64;
  const height = 64;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      pixels[idx] = 40;     // R
      pixels[idx + 1] = 60; // G
      pixels[idx + 2] = 100;// B
      pixels[idx + 3] = 255;// A
    }
  }
  return createPngBuffer(width, height, pixels);
}

const ALL_VANILLA_DEFAULT_SKIN_NAMES = [
  'steve',
  'alex',
  'ari',
  'efe',
  'kai',
  'makena',
  'noor',
  'sunny',
  'zuri'
];

export class CosmeticsManager {
  /**
   * Resolves skin PNG Buffer for an account.
   */
  public static async resolveSkinBuffer(account: Account): Promise<Buffer> {
    let skinBuffer: Buffer | null = null;

    if (account.skinUrl && account.skinUrl.startsWith('data:image/')) {
      try {
        const base64Data = account.skinUrl.replace(/^data:image\/\w+;base64,/, '');
        skinBuffer = Buffer.from(base64Data, 'base64');
      } catch (e) {
        console.warn('[CosmeticsManager] Failed to decode base64 skin:', e);
      }
    } else if (account.skinUrl && account.skinUrl.startsWith('http')) {
      try {
        skinBuffer = await downloadBuffer(account.skinUrl);
      } catch (e) {
        console.warn('[CosmeticsManager] Failed to download skin from URL:', e);
      }
    }

    // Fallback skin fetch by username
    if (!skinBuffer && account.username) {
      try {
        skinBuffer = await downloadBuffer(`https://minotar.net/skin/${account.username}`);
      } catch {}
    }

    if (!skinBuffer) {
      skinBuffer = generateFallbackSkinBuffer();
    }

    return skinBuffer;
  }

  /**
   * Directly patches the Minecraft client version jar (e.g. versions/26.3.jar)
   * replacing all internal vanilla fallback player skin textures with the user's skin.
   * This ensures 100% skin visibility across all mod loaders and offline modes!
   */
  public static async patchClientJar(
    clientJarPath: string,
    skinBuffer: Buffer,
    capeBuffer: Buffer,
    wingsBuffer: Buffer
  ): Promise<void> {
    if (!fs.existsSync(clientJarPath)) return;

    try {
      console.log(`[CosmeticsManager] ⚡ Patching client jar textures directly at: ${clientJarPath}...`);
      const zip = new AdmZip(clientJarPath);

      for (const name of ALL_VANILLA_DEFAULT_SKIN_NAMES) {
        zip.addFile(`assets/minecraft/textures/entity/player/wide/${name}.png`, skinBuffer);
        zip.addFile(`assets/minecraft/textures/entity/player/slim/${name}.png`, skinBuffer);
      }
      zip.addFile('assets/minecraft/textures/entity/steve.png', skinBuffer);
      zip.addFile('assets/minecraft/textures/entity/alex.png', skinBuffer);
      zip.addFile('assets/minecraft/textures/entity/cape.png', capeBuffer);
      zip.addFile('assets/minecraft/textures/entity/elytra.png', wingsBuffer);
      zip.addFile('assets/minecraft/textures/models/armor/elytra.png', wingsBuffer);

      zip.writeZip(clientJarPath);
      console.log(`[CosmeticsManager] ✓ Successfully patched client jar default skin textures!`);
    } catch (err) {
      console.warn('[CosmeticsManager] Jar texture patching warning:', err);
    }
  }

  /**
   * Injects skin, capes, wings and cosmetics into the target Minecraft instance environment.
   */
  public static async injectCosmetics(
    instancePath: string,
    instanceVersion: string,
    account: Account,
    clientJarPath?: string
  ): Promise<void> {
    try {
      console.log(`[CosmeticsManager] 🌌 Injecting cosmetics for player ${account.username} into ${instancePath}...`);

      const packDir = path.join(instancePath, 'resourcepacks', 'Galaxy-Cosmetics-Pack');
      const zipPackPath = path.join(instancePath, 'resourcepacks', 'Galaxy-Cosmetics-Pack.zip');
      const assetsDir = path.join(packDir, 'assets', 'minecraft', 'textures', 'entity');
      const playerWideDir = path.join(assetsDir, 'player', 'wide');
      const playerSlimDir = path.join(assetsDir, 'player', 'slim');
      const armorModelsDir = path.join(packDir, 'assets', 'minecraft', 'textures', 'models', 'armor');
      const optifineCitDir = path.join(packDir, 'assets', 'minecraft', 'optifine', 'cit');

      await fs.promises.mkdir(playerWideDir, { recursive: true });
      await fs.promises.mkdir(playerSlimDir, { recursive: true });
      await fs.promises.mkdir(armorModelsDir, { recursive: true });
      await fs.promises.mkdir(optifineCitDir, { recursive: true });

      // 1. Resolve Buffers
      const skinBuffer = await this.resolveSkinBuffer(account);
      const equippedCape = account.cosmetics?.equippedCape || 'cape-starlight';
      const equippedWings = account.cosmetics?.equippedWings || 'wings-dark-matter';
      const capeBuffer = generateCapeTexture(equippedCape);
      const wingsBuffer = generateWingsTexture(equippedWings, equippedCape);

      // 2. Save Skin into ALL 18 Minecraft Wide/Slim Character Texture Paths
      for (const name of ALL_VANILLA_DEFAULT_SKIN_NAMES) {
        await fs.promises.writeFile(path.join(playerWideDir, `${name}.png`), skinBuffer);
        await fs.promises.writeFile(path.join(playerSlimDir, `${name}.png`), skinBuffer);
      }
      await fs.promises.writeFile(path.join(assetsDir, 'steve.png'), skinBuffer);
      await fs.promises.writeFile(path.join(assetsDir, 'alex.png'), skinBuffer);

      // 3. Save Capes & Wings into all entity & armor paths
      await fs.promises.writeFile(path.join(assetsDir, 'cape.png'), capeBuffer);
      await fs.promises.writeFile(path.join(assetsDir, 'elytra.png'), wingsBuffer);
      await fs.promises.writeFile(path.join(armorModelsDir, 'elytra.png'), wingsBuffer);

      // 4. OptiFine / Iris CIT custom textures & properties
      await fs.promises.writeFile(path.join(optifineCitDir, 'cape.png'), capeBuffer);
      await fs.promises.writeFile(path.join(optifineCitDir, 'elytra.png'), wingsBuffer);
      await fs.promises.writeFile(path.join(optifineCitDir, 'cape.properties'), 'type=elytra\nitems=elytra\ntexture=./cape.png\n');
      await fs.promises.writeFile(path.join(optifineCitDir, 'wings.properties'), 'type=elytra\nitems=elytra\ntexture=./elytra.png\n');

      // 5. Write Universal Multi-Version pack.mcmeta (compatible with 1.8 up to 1.26+)
      const mcmeta = {
        pack: {
          pack_format: 46,
          supported_formats: {
            min_inclusive: 1,
            max_inclusive: 1000
          },
          description: `Galaxy Cosmetics & Skin (${account.username})`
        }
      };
      await fs.promises.writeFile(path.join(packDir, 'pack.mcmeta'), JSON.stringify(mcmeta, null, 2), 'utf-8');

      // 6. Generate Galaxy-Cosmetics-Pack.zip for mod loaders that prefer archive resourcepacks
      try {
        const packZip = new AdmZip();
        packZip.addLocalFolder(packDir);
        packZip.writeZip(zipPackPath);
      } catch (zipErr) {
        console.warn('[CosmeticsManager] Error creating zip resource pack:', zipErr);
      }

      // 7. Ensure options.txt activates the Galaxy Cosmetics Pack at highest priority
      const optionsPath = path.join(instancePath, 'options.txt');
      let optionsContent = '';
      if (fs.existsSync(optionsPath)) {
        optionsContent = await fs.promises.readFile(optionsPath, 'utf-8');
      }

      const activePackEntries = ['file/Galaxy-Cosmetics-Pack.zip', 'file/Galaxy-Cosmetics-Pack'];
      const rpRegex = /^resourcePacks:(.*)$/m;

      if (rpRegex.test(optionsContent)) {
        optionsContent = optionsContent.replace(rpRegex, (_, packsJson) => {
          try {
            const parsed = JSON.parse(packsJson);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter(p => !activePackEntries.includes(p));
              const combined = ['vanilla', ...activePackEntries, ...filtered.filter(p => p !== 'vanilla')];
              return `resourcePacks:${JSON.stringify(combined)}`;
            }
          } catch {}
          return `resourcePacks:["vanilla","file/Galaxy-Cosmetics-Pack.zip","file/Galaxy-Cosmetics-Pack"]`;
        });
      } else {
        optionsContent += `\nresourcePacks:["vanilla","file/Galaxy-Cosmetics-Pack.zip","file/Galaxy-Cosmetics-Pack"]\n`;
      }

      // Clean from incompatible packs if it was mistakenly blacklisted
      const incompRegex = /^incompatibleResourcePacks:(.*)$/m;
      if (incompRegex.test(optionsContent)) {
        optionsContent = optionsContent.replace(incompRegex, (_, incompJson) => {
          try {
            const parsed = JSON.parse(incompJson);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter(p => !activePackEntries.includes(p));
              return `incompatibleResourcePacks:${JSON.stringify(cleaned)}`;
            }
          } catch {}
          return `incompatibleResourcePacks:[]`;
        });
      }

      await fs.promises.writeFile(optionsPath, optionsContent.trim() + '\n', 'utf-8');
      console.log(`[CosmeticsManager] ✓ Successfully activated Galaxy Cosmetics in options.txt`);

      // 8. Patch client version jar directly if available
      if (clientJarPath && fs.existsSync(clientJarPath)) {
        await this.patchClientJar(clientJarPath, skinBuffer, capeBuffer, wingsBuffer);
      }
    } catch (err) {
      console.error('[CosmeticsManager] Error injecting cosmetics:', err);
    }
  }
}
