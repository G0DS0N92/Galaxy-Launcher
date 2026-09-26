import bgPortalHero from '../assets/instance_backgrounds/bg_portal_hero.jpg';
import iconEndIsland from '../assets/instance_backgrounds/icon_end_island.jpg';
import iconLushCave from '../assets/instance_backgrounds/icon_lush_cave.jpg';
import iconCherryGrove from '../assets/instance_backgrounds/icon_cherry_grove.jpg';
import iconCrimsonNether from '../assets/instance_backgrounds/icon_crimson_nether.jpg';
import bgVanilla from '../assets/instance_backgrounds/bg_vanilla.jpg';
import bgSunset from '../assets/instance_backgrounds/bg_sunset.jpg';
import bgGalaxy from '../assets/instance_backgrounds/bg_galaxy.jpg';
import bgNether from '../assets/instance_backgrounds/bg_nether.jpg';
import bgCampfireFriends from '../assets/instance_backgrounds/bg_campfire_friends.jpg';
import bgCloudSync from '../assets/instance_backgrounds/bg_cloud_sync.jpg';
import { Instance } from '../../preload/types';

export interface PresetArtwork {
  id: string;
  name: string;
  src: string;
}

export const PRESET_ARTWORKS: PresetArtwork[] = [
  { id: 'portal', name: 'Lush Portal Island', src: bgPortalHero },
  { id: 'end_island', name: 'End Crystal Island', src: iconEndIsland },
  { id: 'lush_cave', name: 'Lush Cave Waterfall', src: iconLushCave },
  { id: 'cherry_grove', name: 'Cherry Blossom Peak', src: iconCherryGrove },
  { id: 'crimson_nether', name: 'Crimson Nether Castle', src: iconCrimsonNether },
  { id: 'vanilla', name: 'Overworld Plains', src: bgVanilla },
  { id: 'sunset', name: 'Sunset Mountain', src: bgSunset },
  { id: 'galaxy', name: 'Cosmic Nebula', src: bgGalaxy },
  { id: 'nether', name: 'Nether Portal Citadel', src: bgNether }
];

export const ARTWORK_LOOKUP: Record<string, string> = {
  portal: bgPortalHero,
  end_island: iconEndIsland,
  lush_cave: iconLushCave,
  cherry_grove: iconCherryGrove,
  crimson_nether: iconCrimsonNether,
  vanilla: bgVanilla,
  sunset: bgSunset,
  galaxy: bgGalaxy,
  nether: bgNether,
  campfire_friends: bgCampfireFriends,
  cloud_sync: bgCloudSync,
  end: iconEndIsland,
  lush: iconLushCave,
  cherry: iconCherryGrove,
  crimson: iconCrimsonNether
};

// Fallback palette matching the layout in Image 2:
// Card 1: crimson nether, Card 2: portal hero, Card 3: sunset, Card 4: nether
export const INSTANCE_BG_PALETTE: string[] = [
  iconCrimsonNether,
  bgPortalHero,
  bgSunset,
  bgNether,
  iconLushCave,
  iconCherryGrove,
  iconEndIsland,
  bgGalaxy,
  bgVanilla
];

export function normalizeImageSource(src?: string): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (ARTWORK_LOOKUP[trimmed]) {
    return ARTWORK_LOOKUP[trimmed];
  }

  const foundPreset = PRESET_ARTWORKS.find((p) => p.id === trimmed || p.src === trimmed);
  if (foundPreset) {
    return foundPreset.src;
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('atom://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed;
  }

  // Windows absolute path e.g. C:\...
  if (/^[a-zA-Z]:[/\\]/.test(trimmed)) {
    return `file:///${trimmed.replace(/\\/g, '/')}`;
  }

  // Check if it ends with standard image extensions
  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Single source of truth for resolving an instance's displayed icon or artwork banner.
 * Used everywhere across Home, Instances grid, Selected Instance Details panel,
 * and Instance Settings / Header.
 */
export function resolveInstanceArtwork(instance?: Instance | null, fallbackIndex?: number): string {
  if (!instance) {
    const idx = typeof fallbackIndex === 'number' && fallbackIndex >= 0 ? fallbackIndex : 0;
    return INSTANCE_BG_PALETTE[idx % INSTANCE_BG_PALETTE.length];
  }

  // 1. Check instance.icon
  const fromIcon = normalizeImageSource(instance.icon);
  if (fromIcon) return fromIcon;

  // 2. Check instance.banner
  const fromBanner = normalizeImageSource(instance.banner);
  if (fromBanner) return fromBanner;

  // 3. Check instance.iconBackground (often set to preset id e.g. 'portal', 'cherry_grove', etc.)
  const fromIconBg = normalizeImageSource(instance.iconBackground);
  if (fromIconBg) return fromIconBg;

  // 4. Deterministic fallback based on index or instance ID/name
  if (typeof fallbackIndex === 'number' && fallbackIndex >= 0) {
    return INSTANCE_BG_PALETTE[fallbackIndex % INSTANCE_BG_PALETTE.length];
  }

  const hash = (instance.id || instance.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return INSTANCE_BG_PALETTE[Math.abs(hash) % INSTANCE_BG_PALETTE.length];
}
