import * as THREE from 'three';
import { STEVE_SKIN_BASE64, ALEX_SKIN_BASE64 } from '../assets/skins/defaultSkins';

export interface SkinResolutionResult {
  skinUrl: string;
  modelType: 'classic' | 'slim';
  isOfficial: boolean;
  uuid?: string;
}

// Memory cache for fetched skins
const skinCache = new Map<string, SkinResolutionResult>();

/**
 * Resolves skin texture URL and model type from Mojang, PlayerDB, or Ely.by (cracked skin system)
 */
export async function resolvePlayerSkin(username: string): Promise<SkinResolutionResult> {
  const trimmed = username.trim();
  if (!trimmed) {
    return {
      skinUrl: STEVE_SKIN_BASE64,
      modelType: 'classic',
      isOfficial: false
    };
  }

  const cached = skinCache.get(trimmed.toLowerCase());
  if (cached) return cached;

  // 1. Try official Mojang / PlayerDB API
  try {
    const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(trimmed)}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'player.found' && data.data?.player) {
        const player = data.data.player;
        const skinUrl = player.skin_texture || `https://crafatar.com/skins/${player.id}`;
        // Determine model: PlayerDB or custom
        const isSlim = player.meta?.model === 'slim' || player.model === 'slim';
        const result: SkinResolutionResult = {
          skinUrl,
          modelType: isSlim ? 'slim' : 'classic',
          isOfficial: true,
          uuid: player.id
        };
        skinCache.set(trimmed.toLowerCase(), result);
        return result;
      }
    }
  } catch (err) {
    // Continue to next resolver
  }

  // 2. Try Ely.by Skinsystem (the largest cracked Minecraft skin network)
  try {
    const elyUrl = `https://skinsystem.ely.by/textures/${encodeURIComponent(trimmed)}`;
    const elyRes = await fetch(elyUrl, { method: 'HEAD' });
    if (elyRes.ok && elyRes.headers.get('content-type')?.includes('image')) {
      const result: SkinResolutionResult = {
        skinUrl: elyUrl,
        modelType: 'classic',
        isOfficial: false
      };
      skinCache.set(trimmed.toLowerCase(), result);
      return result;
    }
  } catch (err) {
    // Continue
  }

  // 3. Fallback: Minotar proxy or deterministic Steve/Alex
  const hash = trimmed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isSlim = hash % 2 === 1;
  const fallbackUrl = `https://minotar.net/skin/${encodeURIComponent(trimmed)}`;

  const result: SkinResolutionResult = {
    skinUrl: fallbackUrl,
    modelType: isSlim ? 'slim' : 'classic',
    isOfficial: false
  };
  skinCache.set(trimmed.toLowerCase(), result);
  return result;
}

/**
 * Helper to copy and flip a region horizontally from src to dst context
 */
function copyMirrored(
  src: CanvasImageSource,
  dstCtx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  w: number,
  h: number
) {
  dstCtx.save();
  dstCtx.translate(dx + w, dy);
  dstCtx.scale(-1, 1);
  dstCtx.drawImage(src, sx, sy, w, h, 0, 0, w, h);
  dstCtx.restore();
}

/**
 * Normalizes any Minecraft skin (including legacy 64x32 skins) into a standard 64x64 texture
 * by copying and mirroring right limbs to left limbs according to Minecraft 1.8 specifications.
 */
export function normalizeMinecraftSkinCanvas(img: CanvasImageSource, srcWidth: number, srcHeight: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Clear transparent
  ctx.clearRect(0, 0, 64, 64);

  if (srcHeight === 32) {
    // Draw base top 64x32 as-is (Head, Torso, Right Arm, Right Leg)
    ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);

    // Convert Right Arm [40, 16] -> Left Arm [32, 48] (Mirrored)
    // Top: [44, 16, 4, 4] -> [36, 48, 4, 4]
    copyMirrored(img, ctx, 44, 16, 36, 48, 4, 4);
    // Bottom: [48, 16, 4, 4] -> [40, 48, 4, 4]
    copyMirrored(img, ctx, 48, 16, 40, 48, 4, 4);
    // Right (outer) -> Left (outer): [40, 20, 4, 12] -> [40, 52, 4, 12]
    copyMirrored(img, ctx, 40, 20, 40, 52, 4, 12);
    // Front: [44, 20, 4, 12] -> [36, 52, 4, 12]
    copyMirrored(img, ctx, 44, 20, 36, 52, 4, 12);
    // Left (inner) -> Right (inner): [48, 20, 4, 12] -> [32, 52, 4, 12]
    copyMirrored(img, ctx, 48, 20, 32, 52, 4, 12);
    // Back: [52, 20, 4, 12] -> [44, 52, 4, 12]
    copyMirrored(img, ctx, 52, 20, 44, 52, 4, 12);

    // Convert Right Leg [0, 16] -> Left Leg [16, 48] (Mirrored)
    // Top: [4, 16, 4, 4] -> [20, 48, 4, 4]
    copyMirrored(img, ctx, 4, 16, 20, 48, 4, 4);
    // Bottom: [8, 16, 4, 4] -> [24, 48, 4, 4]
    copyMirrored(img, ctx, 8, 16, 24, 48, 4, 4);
    // Right (outer) -> Left (outer): [0, 20, 4, 12] -> [24, 52, 4, 12]
    copyMirrored(img, ctx, 0, 20, 24, 52, 4, 12);
    // Front: [4, 20, 4, 12] -> [20, 52, 4, 12]
    copyMirrored(img, ctx, 4, 20, 20, 52, 4, 12);
    // Left (inner) -> Right (inner): [8, 20, 4, 12] -> [16, 52, 4, 12]
    copyMirrored(img, ctx, 8, 20, 16, 52, 4, 12);
    // Back: [12, 20, 4, 12] -> [28, 52, 4, 12]
    copyMirrored(img, ctx, 12, 20, 28, 52, 4, 12);
  } else {
    // 64x64 standard skin: Draw entire canvas
    ctx.drawImage(img, 0, 0, 64, 64, 0, 0, 64, 64);
  }

  return canvas;
}

/**
 * Loads and normalizes any Minecraft skin URL or base64 into a Three.js CanvasTexture
 */
export function loadNormalizedSkinTexture(urlOrBase64: string): Promise<THREE.CanvasTexture> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const normalizedCanvas = normalizeMinecraftSkinCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
        const texture = new THREE.CanvasTexture(normalizedCanvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        resolve(texture);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = urlOrBase64;
  });
}
