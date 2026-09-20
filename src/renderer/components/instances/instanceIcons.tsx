import React, { useState, useMemo } from 'react';
import {
  X,
  RefreshCw,
  Check,
  Info,
  Save,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react';
import { sounds } from '../../services/soundEngine';

export interface InstanceBackground {
  id: string;
  name: string;
  gradientClass: string;
  previewColor: string;
}

export interface InstanceSymbol {
  id: string;
  name: string;
  category: 'blocks' | 'items' | 'mobs' | 'modded' | 'special';
}

export const INSTANCE_BACKGROUNDS: InstanceBackground[] = [
  { id: 'blue', name: 'Cobalt Blue', gradientClass: 'from-[#4F6AFE] to-[#3742FA]', previewColor: '#4F6AFE' },
  { id: 'cyan', name: 'Diamond Sky', gradientClass: 'from-[#22D3EE] to-[#0284C7]', previewColor: '#22D3EE' },
  { id: 'green', name: 'Emerald Grass', gradientClass: 'from-[#22C55E] to-[#15803D]', previewColor: '#22C55E' },
  { id: 'lime', name: 'Slime Lime', gradientClass: 'from-[#A8E635] to-[#84CC16]', previewColor: '#A8E635' },
  { id: 'purple', name: 'Amethyst Purple', gradientClass: 'from-[#A855F7] to-[#7C3AED]', previewColor: '#A855F7' },
  { id: 'obsidian', name: 'Obsidian Slate', gradientClass: 'from-[#2D3139] to-[#181B20]', previewColor: '#2D3139' },
  { id: 'nebula', name: 'Cosmic Nebula', gradientClass: 'from-[#8B5CF6] via-[#EC4899] to-[#3B82F6]', previewColor: '#8B5CF6' },
  { id: 'red', name: 'TNT Red', gradientClass: 'from-[#FF4E64] to-[#E6194B]', previewColor: '#FF4E64' },
  { id: 'orange', name: 'Lava Orange', gradientClass: 'from-[#FF8C38] to-[#FF5E00]', previewColor: '#FF8C38' },
  { id: 'yellow', name: 'Sun Gold', gradientClass: 'from-[#FFD034] to-[#F59E0B]', previewColor: '#FFD034' },
  { id: 'teal', name: 'Prismarine Teal', gradientClass: 'from-[#06B6D4] to-[#10B981]', previewColor: '#06B6D4' },
  { id: 'pink', name: 'Axolotl Pink', gradientClass: 'from-[#F472B6] to-[#DB2777]', previewColor: '#F472B6' },
  { id: 'crimson', name: 'Deep Nether', gradientClass: 'from-[#991B1B] to-[#450A0A]', previewColor: '#991B1B' },
  { id: 'sunset', name: 'Sunset Glow', gradientClass: 'from-[#F97316] via-[#EC4899] to-[#8B5CF6]', previewColor: '#F97316' },
  { id: 'electric', name: 'Electric Cyber', gradientClass: 'from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6]', previewColor: '#06B6D4' },
  { id: 'aurora', name: 'Northern Aurora', gradientClass: 'from-[#10B981] via-[#06B6D4] to-[#6366F1]', previewColor: '#10B981' }
];

export const INSTANCE_SYMBOLS: InstanceSymbol[] = [
  // --- MODRINTH APP CORE SUITE (Matching Reference Screenshot 1) ---
  { id: 'backpack', name: 'Traveler Backpack', category: 'modded' },
  { id: 'anvil', name: 'Iron Anvil', category: 'blocks' },
  { id: 'fox', name: 'Fox Head', category: 'mobs' },
  { id: 'enchanted_block', name: 'Enchanted Cube', category: 'modded' },
  { id: 'pokeball', name: 'Pixel Ball', category: 'modded' },
  { id: 'ender_pearl', name: 'Ender Pearl', category: 'items' },
  { id: 'cauldron', name: 'Iron Cauldron', category: 'blocks' },
  { id: 'frying_pan', name: 'Frying Pan', category: 'modded' },
  { id: 'globe', name: 'Planetary Globe', category: 'modded' },
  { id: 'honey_block', name: 'Honey Block', category: 'blocks' },
  { id: 'armchair', name: 'Cozy Armchair', category: 'modded' },
  { id: 'pig', name: 'Pig Head', category: 'mobs' },
  { id: 'shark', name: 'Ocean Shark', category: 'mobs' },
  { id: 'bear', name: 'Grizzly Bear', category: 'mobs' },
  { id: 'moobloom', name: 'Moobloom', category: 'mobs' },
  { id: 'mace', name: 'Heavy Mace', category: 'items' },
  { id: 'cogwheel', name: 'Create Cogwheel', category: 'modded' },
  { id: 'train_engine', name: 'Locomotive Engine', category: 'modded' },
  { id: 'fan_turbine', name: 'Industrial Turbine', category: 'modded' },
  { id: 'heater', name: 'Kinetic Heater', category: 'modded' },
  { id: 'wood_cube', name: 'Oak Wood Cube', category: 'blocks' },
  { id: 'axes_gizmo', name: 'Coordinate Axes', category: 'modded' },
  { id: 'retro_pc', name: 'Terminal PC', category: 'modded' },
  { id: 'wrench', name: 'Engineer Wrench', category: 'modded' },
  { id: 'frog', name: 'Frog Head', category: 'mobs' },

  // --- MINECRAFT ISOMETRIC BLOCKS (Matching Reference Screenshot 2) ---
  { id: 'grass_block', name: 'Grass Block', category: 'blocks' },
  { id: 'crafting_table', name: 'Crafting Table', category: 'blocks' },
  { id: 'furnace', name: 'Furnace', category: 'blocks' },
  { id: 'chest', name: 'Wooden Chest', category: 'blocks' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'blocks' },
  { id: 'redstone_block', name: 'Redstone Block', category: 'blocks' },
  { id: 'piston', name: 'Sticky Piston', category: 'blocks' },
  { id: 'slime_block', name: 'Slime Block', category: 'blocks' },
  { id: 'cake', name: 'Celebration Cake', category: 'blocks' },
  { id: 'campfire', name: 'Campfire', category: 'blocks' },
  { id: 'diamond_pickaxe', name: 'Diamond Pickaxe', category: 'items' },
  { id: 'diamond_sword', name: 'Diamond Sword', category: 'items' },
  { id: 'zombie', name: 'Zombie Head', category: 'mobs' },
  { id: 'creeper', name: 'Creeper Head', category: 'mobs' },
  { id: 'skeleton', name: 'Skeleton Skull', category: 'mobs' },
  { id: 'ender_dragon', name: 'Ender Dragon Head', category: 'mobs' },
  { id: 'ender_chest', name: 'Ender Chest', category: 'blocks' },
  { id: 'sculk_catalyst', name: 'Sculk Catalyst', category: 'blocks' },
  { id: 'beacon', name: 'Active Beacon', category: 'blocks' },
  { id: 'enchanting_table', name: 'Enchanting Table', category: 'blocks' },
  { id: 'lantern', name: 'Soul Lantern', category: 'blocks' },
  { id: 'tnt', name: 'TNT Block', category: 'blocks' },
  { id: 'command_block', name: 'Command Block', category: 'blocks' },

  // --- 3D EXTRUDED TOOLS & WEAPONS ---
  { id: 'netherite_sword', name: 'Netherite Sword', category: 'items' },
  { id: 'golden_sword', name: 'Golden Sword', category: 'items' },
  { id: 'iron_sword', name: 'Iron Sword', category: 'items' },
  { id: 'netherite_pickaxe', name: 'Netherite Pickaxe', category: 'items' },
  { id: 'diamond_axe', name: 'Diamond Axe', category: 'items' },
  { id: 'netherite_axe', name: 'Netherite Axe', category: 'items' },
  { id: 'diamond_shovel', name: 'Diamond Shovel', category: 'items' },
  { id: 'diamond_hoe', name: 'Diamond Hoe', category: 'items' },
  { id: 'trident', name: 'Sea Trident', category: 'items' },
  { id: 'bow', name: 'Hunter Bow', category: 'items' },
  { id: 'crossbow', name: 'Loaded Crossbow', category: 'items' },
  { id: 'shield', name: 'Knight Shield', category: 'items' },

  // --- 3D ISOMETRIC ITEMS & ARTIFACTS ---
  { id: 'potion', name: 'Healing Potion', category: 'items' },
  { id: 'potion_speed', name: 'Speed Potion', category: 'items' },
  { id: 'potion_dragon', name: "Dragon's Breath", category: 'items' },
  { id: 'totem', name: 'Totem of Undying', category: 'items' },
  { id: 'golden_apple', name: 'Golden Apple', category: 'items' },
  { id: 'enchanted_apple', name: 'Enchanted Apple', category: 'items' },
  { id: 'nether_star', name: 'Nether Star', category: 'items' },
  { id: 'eye_of_ender', name: 'Eye of Ender', category: 'items' },
  { id: 'elytra', name: 'Elytra Wings', category: 'items' },
  { id: 'diamond_gem', name: 'Faceted Diamond', category: 'items' },
  { id: 'emerald_gem', name: 'Cut Emerald', category: 'items' },
  { id: 'netherite_ingot', name: 'Netherite Ingot', category: 'items' },
  { id: 'gold_ingot', name: 'Gold Ingot', category: 'items' },
  { id: 'clock', name: 'Gold Clock', category: 'items' },
  { id: 'compass', name: 'Lodestone Compass', category: 'items' },
  { id: 'spyglass', name: 'Copper Spyglass', category: 'items' },
  { id: 'firework', name: 'Firework Rocket', category: 'items' },
  { id: 'music_disc', name: 'Music Disc (Pigstep)', category: 'items' },
  { id: 'heart_of_sea', name: 'Heart of the Sea', category: 'items' },
  { id: 'map', name: 'Explorer Map', category: 'items' },

  // --- MORE 3D ISOMETRIC BLOCKS ---
  { id: 'dirt', name: 'Dirt Block', category: 'blocks' },
  { id: 'stone', name: 'Stone Block', category: 'blocks' },
  { id: 'cobblestone', name: 'Cobblestone', category: 'blocks' },
  { id: 'mossy_cobblestone', name: 'Mossy Stone', category: 'blocks' },
  { id: 'oak_log', name: 'Oak Wood Log', category: 'blocks' },
  { id: 'birch_planks', name: 'Birch Planks', category: 'blocks' },
  { id: 'crimson_planks', name: 'Crimson Planks', category: 'blocks' },
  { id: 'blast_furnace', name: 'Blast Furnace', category: 'blocks' },
  { id: 'smoker', name: 'Smoker', category: 'blocks' },
  { id: 'barrel', name: 'Storage Barrel', category: 'blocks' },
  { id: 'diamond_block', name: 'Diamond Block', category: 'blocks' },
  { id: 'diamond_ore', name: 'Diamond Ore', category: 'blocks' },
  { id: 'gold_block', name: 'Gold Block', category: 'blocks' },
  { id: 'emerald_block', name: 'Emerald Block', category: 'blocks' },
  { id: 'netherite_block', name: 'Netherite Block', category: 'blocks' },
  { id: 'ancient_debris', name: 'Ancient Debris', category: 'blocks' },
  { id: 'obsidian', name: 'Obsidian Block', category: 'blocks' },
  { id: 'crying_obsidian', name: 'Crying Obsidian', category: 'blocks' },
  { id: 'redstone_lamp', name: 'Lit Redstone Lamp', category: 'blocks' },
  { id: 'amethyst_block', name: 'Amethyst Geode', category: 'blocks' },
  { id: 'magma_block', name: 'Magma Block', category: 'blocks' },
  { id: 'sponge', name: 'Sponge Block', category: 'blocks' },
  { id: 'purpur_block', name: 'Purpur Block', category: 'blocks' },
  { id: 'prismarine', name: 'Prismarine Block', category: 'blocks' },
  { id: 'sea_lantern', name: 'Sea Lantern', category: 'blocks' },
  { id: 'target_block', name: 'Target Block', category: 'blocks' },

  // --- MORE 3D ISOMETRIC MOBS ---
  { id: 'steve', name: 'Steve Head', category: 'mobs' },
  { id: 'alex', name: 'Alex Head', category: 'mobs' },
  { id: 'enderman', name: 'Enderman Head', category: 'mobs' },
  { id: 'wither_skeleton', name: 'Wither Skull', category: 'mobs' },
  { id: 'drowned', name: 'Drowned Head', category: 'mobs' },
  { id: 'warden', name: 'Warden Head', category: 'mobs' },
  { id: 'iron_golem', name: 'Iron Golem', category: 'mobs' },
  { id: 'allay', name: 'Allay Fairy', category: 'mobs' },
  { id: 'axolotl', name: 'Lucy Axolotl', category: 'mobs' },
  { id: 'wolf', name: 'Tamed Wolf', category: 'mobs' },
  { id: 'bee', name: 'Honey Bee', category: 'mobs' },
  { id: 'cow', name: 'Cow Head', category: 'mobs' },
  { id: 'sheep', name: 'Sheep Head', category: 'mobs' },
  { id: 'chicken', name: 'Chicken Head', category: 'mobs' },
  { id: 'mooshroom', name: 'Mooshroom', category: 'mobs' },
  { id: 'breeze', name: 'Breeze Cyclone', category: 'mobs' },
  { id: 'sniffer', name: 'Sniffer Head', category: 'mobs' },
  { id: 'ghast', name: 'Nether Ghast', category: 'mobs' },
  { id: 'blaze', name: 'Blaze Rods', category: 'mobs' },
  { id: 'slime', name: 'Bouncy Slime', category: 'mobs' },
  { id: 'magma_cube', name: 'Magma Cube', category: 'mobs' },
  { id: 'piglin', name: 'Piglin Warrior', category: 'mobs' },

  // --- COSMIC, TECH & SPECIAL ---
  { id: 'nether_portal', name: 'Nether Portal', category: 'special' },
  { id: 'end_portal', name: 'End Portal', category: 'special' },
  { id: 'dragon_egg', name: 'Dragon Egg', category: 'special' },
  { id: 'quantum_tesseract', name: 'Quantum Core', category: 'special' },
  { id: 'nebula_star', name: 'Cosmic Nebula', category: 'special' },
  { id: 'warp_drive', name: 'Warp Reactor', category: 'special' },
  { id: 'redstone_core', name: 'Flux Core', category: 'special' },
  { id: 'waystone', name: 'Teleport Waystone', category: 'special' },
  { id: 'arcane_book', name: 'Arcane Grimoire', category: 'special' },
  { id: 'space_helmet', name: 'Astronaut Visor', category: 'special' },
  { id: 'celestial_moon', name: 'Celestial Moon', category: 'special' },
  { id: 'supernova', name: 'Supernova Burst', category: 'special' },
  { id: 'infinity_relic', name: 'Infinity Relic', category: 'special' },
  { id: 'cyber_cube', name: 'Cyber Matrix', category: 'special' },
  { id: 'dimensional_rift', name: 'Spacetime Rift', category: 'special' },
  { id: 'wireframe', name: 'Wireframe Cube', category: 'special' }
];

export const POPULAR_COMBOS = [
  { icon: 'backpack', bg: 'blue' },
  { icon: 'diamond_sword', bg: 'cyan' },
  { icon: 'tnt', bg: 'red' },
  { icon: 'fox', bg: 'orange' },
  { icon: 'grass_block', bg: 'green' },
  { icon: 'creeper', bg: 'lime' },
  { icon: 'ender_pearl', bg: 'teal' },
  { icon: 'enchanted_apple', bg: 'purple' },
  { icon: 'beacon', bg: 'aurora' },
  { icon: 'cogwheel', bg: 'sunset' },
  { icon: 'dragon_egg', bg: 'nebula' },
  { icon: 'netherite_pickaxe', bg: 'obsidian' }
];

/**
 * 3D Isometric Ground Shadow Component
 */
const GroundShadow: React.FC<{ cx?: number; cy?: number; rx?: number; ry?: number }> = ({
  cx = 50,
  cy = 85,
  rx = 28,
  ry = 9
}) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="rgba(0, 0, 0, 0.28)" />
);

/**
 * Master 3D Isometric Voxel Renderer
 * Faithfully matches Modrinth App's clean voxel art, lighting, depth & ground shadows.
 */
export const IsometricSymbolSVG: React.FC<{ symbolId?: string; className?: string }> = ({
  symbolId = 'backpack',
  className = 'w-full h-full'
}) => {
  switch (symbolId) {
    // =========================================================================
    // MODRINTH APP CORE SUITE (Matching Reference Screenshot 1)
    // =========================================================================
    case 'backpack':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={54} cy={82} rx={26} ry={9} />
          {/* Main Leather Body */}
          <polygon points="48,22 76,38 48,54 20,38" fill="#D97706" />
          <polygon points="20,38 48,54 48,78 20,62" fill="#B45309" />
          <polygon points="48,54 76,38 76,62 48,78" fill="#92400E" />
          {/* Top Flap Highlight */}
          <polygon points="48,22 76,38 48,46 20,38" fill="#F59E0B" />
          {/* Cyan Straps & Brass Buckles */}
          <polygon points="32,29 36,31 36,70 32,68" fill="#06B6D4" />
          <polygon points="58,31 62,29 62,68 58,70" fill="#0891B2" />
          <rect x="31" y="48" width="6" height="5" rx="1" fill="#FBBF24" />
          <rect x="57" y="48" width="6" height="5" rx="1" fill="#F59E0B" />
          {/* Front Pocket */}
          <polygon points="36,56 60,56 60,76 36,76" fill="#92400E" />
          <polygon points="36,56 60,56 48,63" fill="#D97706" />
          <rect x="45" y="65" width="6" height="4" rx="1" fill="#FBBF24" />
          {/* Top Carry Handle */}
          <path d="M40 24 Q48 14 56 24" stroke="#78350F" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'anvil':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          {/* Base */}
          <polygon points="50,68 76,80 50,92 24,80" fill="#475569" />
          <polygon points="24,80 50,92 50,96 24,84" fill="#334155" />
          <polygon points="50,92 76,80 76,84 50,96" fill="#1E293B" />
          {/* Waist */}
          <polygon points="40,52 60,52 60,70 40,70" fill="#334155" />
          {/* Anvil Horn & Top */}
          <polygon points="50,22 84,38 50,54 16,38" fill="#64748B" />
          <polygon points="16,38 50,54 50,62 16,46" fill="#475569" />
          <polygon points="50,54 84,38 84,46 50,62" fill="#334155" />
          <polygon points="16,38 28,26 50,22 38,34" fill="#94A3B8" />
        </svg>
      );

    case 'fox':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={82} rx={26} ry={8} />
          {/* 3D Fox Ears */}
          <polygon points="24,20 34,10 40,26" fill="#F97316" />
          <polygon points="28,18 34,14 38,24" fill="#1E293B" />
          <polygon points="76,20 66,10 60,26" fill="#EA580C" />
          <polygon points="72,18 66,14 62,24" fill="#1E293B" />
          {/* Fox Head Cube */}
          <polygon points="50,24 82,40 50,58 18,40" fill="#FB923C" />
          <polygon points="18,40 50,58 50,82 18,64" fill="#EA580C" />
          <polygon points="50,58 82,40 82,64 50,82" fill="#C2410C" />
          {/* White Snout & Nose */}
          <polygon points="34,50 66,50 50,68" fill="#FFFFFF" />
          <circle cx="50" cy="62" r="3" fill="#18181B" />
          <circle cx="34" cy="48" r="2.5" fill="#18181B" />
          <circle cx="66" cy="48" r="2.5" fill="#18181B" />
        </svg>
      );

    case 'enchanted_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,16 82,34 50,52 18,34" fill="#C084FC" />
          <polygon points="18,34 50,52 50,82 18,64" fill="#9333EA" />
          <polygon points="50,52 82,34 82,64 50,82" fill="#7E22CE" />
          {/* Glitch Facets */}
          <polygon points="40,24 60,24 50,38" fill="#38BDF8" opacity="0.8" />
          <polygon points="26,46 44,56 36,70" fill="#EC4899" opacity="0.8" />
          <polygon points="58,56 74,44 68,68" fill="#06B6D4" opacity="0.8" />
        </svg>
      );

    case 'pokeball':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={82} rx={24} ry={8} />
          {/* Top Red Dome */}
          <path d="M22 48 A28 28 0 0 1 78 48 Z" fill="#EF4444" />
          <ellipse cx="50" cy="48" rx="28" ry="10" fill="#B91C1C" />
          {/* Bottom White Dome */}
          <path d="M22 48 A28 28 0 0 0 78 48 Z" fill="#F8FAFC" />
          <ellipse cx="50" cy="48" rx="28" ry="6" fill="#0F172A" />
          {/* Center Button */}
          <circle cx="50" cy="48" r="9" fill="#0F172A" />
          <circle cx="50" cy="48" r="6" fill="#F8FAFC" />
          <circle cx="50" cy="48" r="3" fill="#E2E8F0" />
        </svg>
      );

    case 'cauldron':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Rim */}
          <ellipse cx="50" cy="38" rx="30" ry="14" fill="#475569" />
          <ellipse cx="50" cy="38" rx="24" ry="10" fill="#0F172A" />
          {/* Cauldron Body */}
          <path d="M20 38 Q20 74 50 78 Q80 74 80 38 Z" fill="#334155" />
          {/* Gold Handle */}
          <path d="M50 38 Q88 38 88 56 Q88 70 50 70" stroke="#F59E0B" strokeWidth="4" fill="none" />
          {/* Legs */}
          <rect x="28" y="74" width="8" height="10" rx="2" fill="#1E293B" />
          <rect x="64" y="74" width="8" height="10" rx="2" fill="#1E293B" />
        </svg>
      );

    case 'frying_pan':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={44} cy={76} rx={28} ry={9} />
          <ellipse cx="44" cy="48" rx="26" ry="18" fill="#475569" />
          <ellipse cx="44" cy="48" rx="22" ry="14" fill="#1E293B" />
          {/* Egg Frying */}
          <ellipse cx="44" cy="48" rx="10" ry="6" fill="#FFFFFF" />
          <circle cx="44" cy="48" r="4" fill="#F59E0B" />
          {/* Wooden Angled Handle */}
          <polygon points="64,54 90,70 86,76 60,60" fill="#854D0E" />
        </svg>
      );

    case 'globe':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={22} ry={7} />
          {/* Globe Sphere */}
          <circle cx="50" cy="44" r="22" fill="#0284C7" />
          <path d="M40 34 Q50 30 56 38 Q60 48 50 52 Q42 54 36 46 Z" fill="#22C55E" />
          <path d="M56 46 Q64 50 60 58 Q50 60 48 54 Z" fill="#16A34A" />
          {/* Brass Arm & Base */}
          <path d="M26 44 A24 24 0 0 0 50 68 L50 80 M38 80 L62 80" stroke="#D97706" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'honey_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Translucent 3D Honey Cube */}
          <polygon points="50,16 82,34 50,52 18,34" fill="#FBBF24" opacity="0.9" />
          <polygon points="18,34 50,52 50,82 18,64" fill="#F59E0B" opacity="0.95" />
          <polygon points="50,52 82,34 82,64 50,82" fill="#D97706" opacity="0.95" />
          {/* Dripping Golden Syrup Strands */}
          <path d="M30 42 L30 62 Q30 66 33 66 Q36 66 36 62 L36 45" fill="#FDE68A" />
          <path d="M62 45 L62 68 Q62 72 65 72 Q68 72 68 68 L68 48" fill="#FDE68A" />
        </svg>
      );

    case 'armchair':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={28} ry={8} />
          {/* Backrest */}
          <polygon points="34,22 66,22 66,48 34,48" fill="#DC2626" />
          <polygon points="34,22 66,22 58,16 26,16" fill="#EF4444" />
          {/* Seat Cushion */}
          <polygon points="26,44 74,44 64,66 16,66" fill="#B91C1C" />
          {/* Left Armrest */}
          <polygon points="16,40 28,40 28,64 16,64" fill="#991B1B" />
          {/* Right Armrest */}
          <polygon points="72,40 84,40 84,64 72,64" fill="#7F1D1D" />
          {/* Wooden Base & Legs */}
          <rect x="22" y="66" width="56" height="8" fill="#78350F" />
          <rect x="22" y="74" width="6" height="8" rx="1" fill="#451A03" />
          <rect x="72" y="74" width="6" height="8" rx="1" fill="#451A03" />
        </svg>
      );

    case 'shark':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={76} rx={28} ry={8} />
          {/* Shark Body */}
          <polygon points="16,56 46,36 84,48 54,68" fill="#64748B" />
          <polygon points="16,56 54,68 48,74 12,62" fill="#475569" />
          {/* Dorsal Fin */}
          <polygon points="46,36 56,18 60,38" fill="#334155" />
          {/* Eye & Underbelly */}
          <circle cx="72" cy="48" r="2.5" fill="#0F172A" />
          <polygon points="54,68 84,48 78,56 48,74" fill="#F1F5F9" />
        </svg>
      );

    case 'bear':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={82} rx={24} ry={8} />
          {/* Bear Body & Head */}
          <polygon points="34,34 66,34 72,68 28,68" fill="#78350F" />
          <polygon points="40,22 60,22 64,38 36,38" fill="#92400E" />
          {/* Ears */}
          <circle cx="36" cy="22" r="5" fill="#451A03" />
          <circle cx="64" cy="22" r="5" fill="#451A03" />
          {/* Snout */}
          <ellipse cx="50" cy="34" rx="6" ry="4" fill="#FDE68A" />
          <circle cx="50" cy="33" r="2" fill="#18181B" />
        </svg>
      );

    case 'moobloom':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={82} rx={26} ry={8} />
          <polygon points="50,22 80,38 50,56 20,38" fill="#FACC15" />
          <polygon points="20,38 50,56 50,80 20,62" fill="#EAB308" />
          <polygon points="50,56 80,38 80,62 50,80" fill="#CA8A04" />
          {/* Buttercup Flower on Head */}
          <circle cx="50" cy="20" r="7" fill="#FEF08A" />
          <circle cx="50" cy="20" r="3" fill="#EA580C" />
          <rect x="30" y="52" width="6" height="4" fill="#18181B" />
          <rect x="64" y="52" width="6" height="4" fill="#18181B" />
        </svg>
      );

    case 'cogwheel':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* 3D Create Gear */}
          <circle cx="50" cy="48" r="24" fill="#B45309" stroke="#78350F" strokeWidth="3" />
          <circle cx="50" cy="48" r="16" fill="#78350F" />
          <circle cx="50" cy="48" r="8" fill="#94A3B8" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="46"
              y="18"
              width="8"
              height="8"
              rx="1.5"
              fill="#D97706"
              transform={`rotate(${deg} 50 48)`}
            />
          ))}
        </svg>
      );

    case 'train_engine':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={28} ry={8} />
          <polygon points="50,22 82,38 50,54 18,38" fill="#EF4444" />
          <polygon points="18,38 50,54 50,74 18,58" fill="#DC2626" />
          <polygon points="50,54 82,38 82,58 50,74" fill="#991B1B" />
          {/* Smokestack & Cowcatcher */}
          <rect x="44" y="12" width="12" height="12" fill="#334155" rx="2" />
          <polygon points="14,64 50,82 50,76 14,58" fill="#64748B" />
        </svg>
      );

    case 'fan_turbine':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <circle cx="50" cy="48" r="26" fill="#334155" stroke="#1E293B" strokeWidth="4" />
          <circle cx="50" cy="48" r="8" fill="#0F172A" />
          <path d="M50 24 L50 48 M50 48 L72 38 M50 48 L64 68 M50 48 L36 68 M50 48 L28 38" stroke="#64748B" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'heater':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,22 78,36 50,50 22,36" fill="#EA580C" />
          <polygon points="22,36 50,50 50,74 22,60" fill="#C2410C" />
          <polygon points="50,50 78,36 78,60 50,74" fill="#9A3412" />
          {/* Glowing Blaze Core */}
          <circle cx="50" cy="48" r="10" fill="#FACC15" />
          <circle cx="50" cy="48" r="5" fill="#FFFFFF" />
        </svg>
      );

    case 'axes_gizmo':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={82} rx={22} ry={7} />
          {/* 3D Coordinate Axes */}
          <line x1="50" y1="50" x2="80" y2="35" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
          <line x1="50" y1="50" x2="50" y2="16" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
          <line x1="50" y1="50" x2="20" y2="65" stroke="#3B82F6" strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
        </svg>
      );

    case 'retro_pc':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,20 80,36 50,52 20,36" fill="#E2E8F0" />
          <polygon points="20,36 50,52 50,76 20,60" fill="#CBD5E1" />
          <polygon points="50,52 80,36 80,60 50,76" fill="#94A3B8" />
          {/* CRT Screen with Green Prompt */}
          <polygon points="28,42 48,52 48,68 28,58" fill="#0F172A" />
          <line x1="32" y1="50" x2="38" y2="53" stroke="#22C55E" strokeWidth="2" />
        </svg>
      );

    case 'wrench':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={80} rx={26} ry={8} />
          <path
            d="M32 20 Q44 14 52 24 L74 68 Q68 76 60 72 L38 28 Q30 32 32 20 Z"
            fill="#06B6D4"
            stroke="#0891B2"
            strokeWidth="3"
          />
          <circle cx="66" cy="68" r="4" fill="#0E7490" />
        </svg>
      );

    case 'frog':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={82} rx={26} ry={8} />
          {/* Frog Head */}
          <polygon points="50,28 82,44 50,60 18,44" fill="#84CC16" />
          <polygon points="18,44 50,60 50,78 18,62" fill="#65A30D" />
          <polygon points="50,60 82,44 82,62 50,78" fill="#4D7C0F" />
          {/* Big Bulbous Eyes */}
          <circle cx="34" cy="26" r="8" fill="#A3E635" />
          <circle cx="34" cy="26" r="4" fill="#18181B" />
          <circle cx="66" cy="26" r="8" fill="#A3E635" />
          <circle cx="66" cy="26" r="4" fill="#18181B" />
          {/* Cute Mouth */}
          <path d="M36 56 Q50 64 64 56" stroke="#365314" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );

    // =========================================================================
    // MINECRAFT ISOMETRIC BLOCKS (Matching Reference Screenshot 2)
    // =========================================================================
    case 'grass_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#5B8C32" />
          <polygon points="50,17 80,33 50,49 20,33" fill="#71A83E" />
          {/* Left Dirt Face with Stepped Grass Overhang */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#866043" />
          <polygon points="16,33 50,52 50,60 44,56 40,62 34,54 28,60 22,53 16,58" fill="#5B8C32" />
          {/* Right Dirt Face with Stepped Grass Overhang */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#6A4B32" />
          <polygon points="50,52 84,33 84,58 78,53 72,60 66,54 60,62 56,56 50,60" fill="#4D762B" />
        </svg>
      );

    case 'crafting_table':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#D4AF37" />
          <line x1="28" y1="27" x2="62" y2="45" stroke="#7A5418" strokeWidth="1.5" />
          <line x1="38" y1="21" x2="72" y2="39" stroke="#7A5418" strokeWidth="1.5" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#9C6B38" />
          <rect x="22" y="44" width="22" height="18" fill="#4B3016" rx="2" transform="skewY(30) scale(0.9, 1)" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#7D5226" />
          <rect x="42" y="72" width="22" height="18" fill="#3D240E" rx="2" transform="skewY(-30) scale(0.9, 1)" />
        </svg>
      );

    case 'furnace':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#8A8A8A" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#737373" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#585858" />
          {/* Lit Furnace Opening */}
          <polygon points="58,58 76,48 76,70 58,80" fill="#202020" />
          <polygon points="60,65 74,57 74,68 60,76" fill="#FF6D00" />
          <circle cx="67" cy="66" r="2.5" fill="#FFD600" />
        </svg>
      );

    case 'chest':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={28} ry={8} />
          <polygon points="50,18 80,35 50,52 20,35" fill="#BC883F" />
          <polygon points="20,35 50,52 50,82 20,65" fill="#885A20" />
          <polygon points="50,52 80,35 80,65 50,82" fill="#6A4414" />
          <line x1="20" y1="46" x2="50" y2="63" stroke="#2B1D0E" strokeWidth="2" />
          <line x1="50" y1="63" x2="80" y2="46" stroke="#2B1D0E" strokeWidth="2" />
          {/* Lock */}
          <polygon points="46,50 54,45 54,58 46,63" fill="#ECEFF1" />
        </svg>
      );

    case 'bookshelf':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#C4A066" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#8B673A" />
          <rect x="20" y="44" width="7" height="16" fill="#E53935" transform="skewY(30) scale(0.9, 1)" />
          <rect x="28" y="44" width="6" height="16" fill="#43A047" transform="skewY(30) scale(0.9, 1)" />
          <rect x="35" y="44" width="8" height="16" fill="#1E88E5" transform="skewY(30) scale(0.9, 1)" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#6E4F27" />
          <rect x="52" y="70" width="7" height="16" fill="#8E24AA" transform="skewY(-30) scale(0.9, 1)" />
          <rect x="60" y="70" width="7" height="16" fill="#FDD835" transform="skewY(-30) scale(0.9, 1)" />
        </svg>
      );

    case 'redstone_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#FF1744" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#C62828" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#B71C1C" />
          <circle cx="50" cy="33" r="8" fill="#FF8A80" opacity="0.6" />
        </svg>
      );

    case 'piston':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          {/* Slime Wooden Top */}
          <polygon points="50,16 82,34 50,52 18,34" fill="#84CC16" />
          {/* Stone Base */}
          <polygon points="18,34 50,52 50,84 18,66" fill="#64748B" />
          <polygon points="50,52 82,34 82,66 50,84" fill="#475569" />
          <line x1="18" y1="46" x2="50" y2="64" stroke="#78350F" strokeWidth="3" />
        </svg>
      );

    case 'slime_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#76FF03" opacity="0.85" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#64DD17" opacity="0.85" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#43A047" opacity="0.85" />
          {/* Inner Core */}
          <polygon points="50,30 68,40 50,50 32,40" fill="#33691E" />
          <polygon points="32,40 50,50 50,66 32,56" fill="#1B5E20" />
          <polygon points="50,50 68,40 68,56 50,66" fill="#0D3311" />
        </svg>
      );

    case 'cake':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={28} ry={8} />
          {/* Frosting Top */}
          <polygon points="50,32 80,48 50,64 20,48" fill="#FFFFFF" />
          <rect x="36" y="44" width="4" height="4" fill="#EF4444" />
          <rect x="48" y="40" width="4" height="4" fill="#EF4444" />
          <rect x="60" y="48" width="4" height="4" fill="#EF4444" />
          {/* Sponge Cake Base */}
          <polygon points="20,48 50,64 50,78 20,62" fill="#D97706" />
          <polygon points="50,64 80,48 80,62 50,78" fill="#B45309" />
        </svg>
      );

    case 'campfire':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Crossed Logs */}
          <line x1="24" y1="62" x2="76" y2="76" stroke="#78350F" strokeWidth="8" strokeLinecap="round" />
          <line x1="24" y1="76" x2="76" y2="62" stroke="#451A03" strokeWidth="8" strokeLinecap="round" />
          {/* Glowing Fire Flame */}
          <polygon points="50,20 66,48 56,66 44,66 34,48" fill="#F59E0B" />
          <polygon points="50,30 60,48 54,60 46,60 40,48" fill="#FEF08A" />
        </svg>
      );

    case 'diamond_pickaxe':
    case 'netherite_pickaxe':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={82} rx={28} ry={8} />
          {/* 3D Extruded Wooden Handle */}
          <polygon points="22,76 28,70 70,28 64,34" fill="#854D0E" />
          <polygon points="22,76 24,78 66,36 64,34" fill="#451A03" />
          {/* 3D Extruded Diamond / Netherite Pickaxe Head */}
          <path
            d="M34 22 Q58 14 80 36 L72 44 Q54 26 42 30 Z"
            fill={symbolId === 'netherite_pickaxe' ? '#475569' : '#06B6D4'}
          />
          <path
            d="M42 30 Q54 26 72 44 L66 50 Q50 34 36 32 Z"
            fill={symbolId === 'netherite_pickaxe' ? '#1E293B' : '#0891B2'}
          />
          <polygon points="62,24 70,18 76,24 68,30" fill={symbolId === 'netherite_pickaxe' ? '#F59E0B' : '#E0F2FE'} />
        </svg>
      );

    case 'diamond_sword':
    case 'netherite_sword':
    case 'golden_sword':
    case 'iron_sword':
      const isNetherite = symbolId === 'netherite_sword';
      const isGold = symbolId === 'golden_sword';
      const isIron = symbolId === 'iron_sword';
      const primaryColor = isNetherite ? '#334155' : isGold ? '#FACC15' : isIron ? '#F1F5F9' : '#06B6D4';
      const shadeColor = isNetherite ? '#0F172A' : isGold ? '#CA8A04' : isIron ? '#94A3B8' : '#0891B2';
      const shineColor = isNetherite ? '#F59E0B' : isGold ? '#FEF08A' : isIron ? '#FFFFFF' : '#E0F2FE';

      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={82} rx={26} ry={8} />
          {/* 3D Extruded Blade Top */}
          <polygon points="68,14 82,28 48,62 40,54" fill={primaryColor} />
          <polygon points="68,14 74,20 48,62 40,54" fill={shineColor} />
          <polygon points="68,14 82,28 76,34 48,62" fill={shadeColor} />
          {/* 3D Crossguard */}
          <polygon points="34,52 48,38 54,44 40,58" fill={isNetherite ? '#F59E0B' : shadeColor} />
          <polygon points="26,60 36,50 42,56 32,66" fill={isNetherite ? '#D97706' : shadeColor} />
          {/* Handle & Pommel */}
          <polygon points="28,66 34,60 18,76 12,82" fill="#78350F" />
          <circle cx="14" cy="84" r="5" fill={primaryColor} stroke={shadeColor} strokeWidth="1.5" />
        </svg>
      );

    case 'diamond_axe':
    case 'netherite_axe':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={82} rx={28} ry={8} />
          <polygon points="22,76 28,70 70,28 64,34" fill="#854D0E" />
          <polygon points="50,18 78,16 82,42 62,38 58,26" fill={symbolId === 'netherite_axe' ? '#475569' : '#06B6D4'} />
          <polygon points="62,38 82,42 78,48 58,42" fill={symbolId === 'netherite_axe' ? '#1E293B' : '#0891B2'} />
        </svg>
      );

    case 'diamond_shovel':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={82} rx={26} ry={8} />
          <polygon points="22,76 28,70 64,34 58,40" fill="#854D0E" />
          <polygon points="60,34 76,18 84,26 68,42" fill="#06B6D4" />
          <polygon points="68,42 84,26 80,34 66,46" fill="#0891B2" />
        </svg>
      );

    case 'diamond_hoe':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={82} rx={26} ry={8} />
          <polygon points="22,76 28,70 70,28 64,34" fill="#854D0E" />
          <polygon points="46,20 74,18 68,32 56,30" fill="#06B6D4" />
          <polygon points="56,30 68,32 64,36 52,34" fill="#0891B2" />
        </svg>
      );

    case 'trident':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={82} rx={26} ry={8} />
          <polygon points="20,78 26,72 60,38 54,44" fill="#0891B2" />
          <polygon points="54,34 66,22 72,28 60,40" fill="#22D3EE" />
          <polygon points="62,18 78,6 82,10 66,22" fill="#06B6D4" />
          <polygon points="72,28 84,16 88,20 76,32" fill="#22D3EE" />
        </svg>
      );

    case 'bow':
    case 'crossbow':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={82} rx={28} ry={8} />
          <path d="M26 74 Q65 65 74 26" stroke="#854D0E" strokeWidth="6" fill="none" strokeLinecap="round" />
          <line x1="26" y1="74" x2="74" y2="26" stroke="#F1F5F9" strokeWidth="2.5" />
          <line x1="32" y1="68" x2="68" y2="32" stroke="#F59E0B" strokeWidth="2.5" />
        </svg>
      );

    case 'shield':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <path d="M28 24 L72 24 L72 54 Q72 78 50 86 Q28 78 28 54 Z" fill="#854D0E" stroke="#CBD5E1" strokeWidth="4" />
          <polygon points="46,30 54,30 54,72 46,72" fill="#06B6D4" />
          <polygon points="34,44 66,44 66,52 34,52" fill="#06B6D4" />
        </svg>
      );

    case 'zombie':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,18 80,34 50,50 20,34" fill="#15803D" />
          <polygon points="20,34 50,50 50,78 20,62" fill="#166534" />
          <polygon points="50,50 80,34 80,62 50,78" fill="#14532D" />
          <rect x="28" y="44" width="8" height="6" fill="#052E16" />
          <rect x="64" y="44" width="8" height="6" fill="#052E16" />
        </svg>
      );

    case 'creeper':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,18 80,34 50,50 20,34" fill="#22C55E" />
          <polygon points="20,34 50,50 50,78 20,62" fill="#16A34A" />
          <polygon points="50,50 80,34 80,62 50,78" fill="#15803D" />
          {/* Creeper Face on Center/Left */}
          <rect x="28" y="42" width="8" height="8" fill="#052E16" />
          <rect x="64" y="42" width="8" height="8" fill="#052E16" />
          <polygon points="44,50 56,50 56,66 52,66 52,58 48,58 48,66 44,66" fill="#052E16" />
        </svg>
      );

    case 'skeleton':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,18 80,34 50,50 20,34" fill="#F1F5F9" />
          <polygon points="20,34 50,50 50,78 20,62" fill="#E2E8F0" />
          <polygon points="50,50 80,34 80,62 50,78" fill="#CBD5E1" />
          <rect x="28" y="44" width="8" height="8" fill="#334155" />
          <rect x="64" y="44" width="8" height="8" fill="#334155" />
        </svg>
      );

    case 'ender_dragon':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={28} ry={8} />
          {/* Dragon Head with Snout & Horns */}
          <polygon points="50,22 80,36 50,50 20,36" fill="#18181B" />
          <polygon points="20,36 50,50 50,76 20,62" fill="#09090B" />
          <polygon points="50,50 80,36 80,62 50,76" fill="#000000" />
          {/* Glowing Purple Eyes */}
          <rect x="28" y="44" width="6" height="3" fill="#E879F9" />
          <rect x="66" y="44" width="6" height="3" fill="#E879F9" />
          {/* Horns */}
          <polygon points="20,36 12,20 26,30" fill="#3F3F46" />
          <polygon points="80,36 88,20 74,30" fill="#3F3F46" />
        </svg>
      );

    case 'ender_chest':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={28} ry={8} />
          <polygon points="50,18 80,35 50,52 20,35" fill="#1E293B" />
          <polygon points="20,35 50,52 50,82 20,65" fill="#0F172A" />
          <polygon points="50,52 80,35 80,65 50,82" fill="#020617" />
          {/* Eye of Ender Latch */}
          <circle cx="50" cy="54" r="5" fill="#22C55E" />
          <ellipse cx="50" cy="54" rx="2" ry="4" fill="#06B6D4" />
        </svg>
      );

    case 'sculk_catalyst':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#083344" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#04202C" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#02141C" />
          {/* Soul Flame Bubbles */}
          <circle cx="50" cy="33" r="8" fill="#06B6D4" opacity="0.8" />
          <polygon points="46,14 50,4 54,14" fill="#F1F5F9" />
        </svg>
      );

    case 'beacon':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={26} ry={8} />
          <polygon points="50,22 80,39 50,56 20,39" fill="#E0F2FE" opacity="0.8" />
          <polygon points="20,39 50,56 50,80 20,63" fill="#7DD3FC" opacity="0.6" />
          <polygon points="50,56 80,39 80,63 50,80" fill="#38BDF8" opacity="0.6" />
          {/* Inner Core & Beam */}
          <circle cx="50" cy="48" r="8" fill="#06B6D4" />
          <polygon points="46,6 54,6 54,48 46,48" fill="#38BDF8" opacity="0.9" />
          <polygon points="48,6 52,6 52,48 48,48" fill="#FFFFFF" />
        </svg>
      );

    case 'enchanting_table':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={88} rx={28} ry={8} />
          {/* Obsidian Base & Crimson Cloth */}
          <polygon points="50,38 84,55 50,74 16,55" fill="#DC2626" />
          <polygon points="16,55 50,74 50,92 16,73" fill="#1E1B2E" />
          <polygon points="50,74 84,55 84,73 50,92" fill="#0F0D17" />
          {/* Floating Arcane Book */}
          <polygon points="50,14 66,24 50,34 34,24" fill="#7F1D1D" />
          <polygon points="36,25 48,20 48,30 36,32" fill="#FFFBEB" />
          <polygon points="52,20 64,25 64,32 52,30" fill="#FFFBEB" />
        </svg>
      );

    case 'lantern':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={24} ry={7} />
          <rect x="34" y="30" width="32" height="42" rx="4" fill="#1E293B" />
          <rect x="38" y="34" width="24" height="34" rx="2" fill="#FEF08A" />
          <circle cx="50" cy="50" r="8" fill="#F59E0B" />
          <path d="M42 30 Q50 16 58 30" stroke="#64748B" strokeWidth="4" fill="none" />
        </svg>
      );

    case 'tnt':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#EF4444" />
          {/* Fuse */}
          <line x1="50" y1="33" x2="50" y2="16" stroke="#F1F5F9" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="14" r="3.5" fill="#FBBF24" />
          {/* Left/Right Faces with White TNT Band */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#DC2626" />
          <polygon points="16,46 50,65 50,75 16,56" fill="#F8FAFC" />
          <text x="26" y="58" fill="#09090B" fontSize="9" fontWeight="900" fontFamily="monospace" transform="skewY(30) scale(0.9, 1)">TNT</text>
          <polygon points="50,52 84,33 84,67 50,86" fill="#991B1B" />
          <polygon points="50,65 84,46 84,56 50,75" fill="#E2E8F0" />
          <text x="36" y="93" fill="#09090B" fontSize="9" fontWeight="900" fontFamily="monospace" transform="skewY(-30) scale(0.9, 1)">TNT</text>
        </svg>
      );

    case 'command_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#D97706" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#B45309" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#92400E" />
          <circle cx="50" cy="50" r="10" fill="#22D3EE" />
          <polygon points="50,44 56,50 50,56 44,50" fill="#FFFFFF" />
        </svg>
      );

    // =========================================================================
    // CENTERED 3D ISOMETRIC POTIONS & ARTIFACTS
    // =========================================================================
    case 'potion':
    case 'potion_speed':
    case 'potion_dragon':
      const isSpeed = symbolId === 'potion_speed';
      const isDragon = symbolId === 'potion_dragon';
      const liquidColor = isSpeed ? '#06B6D4' : isDragon ? '#E879F9' : '#EF4444';
      const liquidShine = isSpeed ? '#A5F3FC' : isDragon ? '#F5D0FE' : '#FCA5A5';

      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={22} ry={7} />
          {/* Centered Cork & Glass Neck */}
          <rect x="44" y="16" width="12" height="6" rx="2" fill="#854D0E" />
          <rect x="46" y="22" width="8" height="12" fill="#CBD5E1" opacity="0.8" />
          {/* 3D Glass Flask Body */}
          <circle cx="50" cy="56" r="24" fill="#E2E8F0" opacity="0.5" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="50" cy="56" r="20" fill={liquidColor} />
          <ellipse cx="42" cy="48" rx="8" ry="4" fill={liquidShine} opacity="0.9" />
        </svg>
      );

    case 'totem':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={24} ry={7} />
          <polygon points="36,22 64,22 58,54 42,54" fill="#FACC15" />
          <polygon points="20,34 36,34 42,50 26,50" fill="#EAB308" />
          <polygon points="80,34 64,34 58,50 74,50" fill="#EAB308" />
          <rect x="38" y="54" width="24" height="26" rx="4" fill="#CA8A04" />
          {/* Glowing Emerald Eyes */}
          <circle cx="44" cy="34" r="3.5" fill="#22C55E" />
          <circle cx="56" cy="34" r="3.5" fill="#22C55E" />
        </svg>
      );

    case 'ender_pearl':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={22} ry={7} />
          <circle cx="50" cy="50" r="26" fill="#042F2E" />
          <circle cx="50" cy="50" r="22" fill="#0F766E" />
          <circle cx="50" cy="50" r="14" fill="#14B8A6" />
          <circle cx="42" cy="42" r="5" fill="#CCFBF1" />
        </svg>
      );

    case 'golden_apple':
    case 'enchanted_apple':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={24} ry={8} />
          <circle cx="50" cy="54" r="24" fill="#FACC15" />
          <circle cx="44" cy="46" rx="10" ry="6" fill="#FEF08A" />
          <path d="M50 30 Q52 16 62 12" stroke="#78350F" strokeWidth="4" fill="none" />
          <polygon points="54,24 66,20 62,28" fill="#22C55E" />
          {symbolId === 'enchanted_apple' && (
            <circle cx="50" cy="54" r="24" fill="#E879F9" opacity="0.3" />
          )}
        </svg>
      );

    case 'nether_star':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={24} ry={7} />
          <polygon points="50,14 62,38 86,50 62,62 50,86 38,62 14,50 38,38" fill="#F0FDFA" />
          <polygon points="50,24 58,42 76,50 58,58 50,76 42,58 24,50 42,42" fill="#22D3EE" />
          <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
        </svg>
      );

    case 'eye_of_ender':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={22} ry={7} />
          <circle cx="50" cy="50" r="26" fill="#14532D" />
          <circle cx="50" cy="50" r="20" fill="#22C55E" />
          <ellipse cx="50" cy="50" rx="4" ry="14" fill="#B91C1C" />
          <ellipse cx="50" cy="50" rx="2" ry="8" fill="#FACC15" />
        </svg>
      );

    case 'elytra':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <path d="M50 24 Q30 40 22 76 Q38 80 48 50 Z" fill="#475569" stroke="#1E293B" strokeWidth="2" />
          <path d="M50 24 Q70 40 78 76 Q62 80 52 50 Z" fill="#334155" stroke="#1E293B" strokeWidth="2" />
        </svg>
      );

    case 'diamond_gem':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={24} ry={7} />
          <polygon points="32,30 68,30 84,48 50,80 16,48" fill="#22D3EE" />
          <polygon points="32,30 50,48 16,48" fill="#67E8F9" />
          <polygon points="68,30 50,48 84,48" fill="#06B6D4" />
          <polygon points="50,48 84,48 50,80" fill="#0891B2" />
        </svg>
      );

    case 'emerald_gem':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={24} ry={7} />
          <polygon points="30,26 70,26 84,44 70,78 30,78 16,44" fill="#22C55E" />
          <polygon points="30,26 70,26 50,44" fill="#86EFAC" />
          <polygon points="30,78 70,78 50,44" fill="#15803D" />
        </svg>
      );

    case 'clock':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={24} ry={7} />
          <circle cx="50" cy="50" r="28" fill="#FACC15" stroke="#CA8A04" strokeWidth="4" />
          <path d="M26 50 A24 24 0 0 1 74 50 Z" fill="#38BDF8" />
          <path d="M26 50 A24 24 0 0 0 74 50 Z" fill="#1E1B4B" />
          <circle cx="50" cy="40" r="5" fill="#FEF08A" />
        </svg>
      );

    case 'compass':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={24} ry={7} />
          <circle cx="50" cy="50" r="28" fill="#475569" stroke="#94A3B8" strokeWidth="4" />
          <polygon points="50,26 55,50 50,46 45,50" fill="#EF4444" />
          <polygon points="50,74 55,50 50,54 45,50" fill="#F8FAFC" />
        </svg>
      );

    case 'spyglass':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={48} cy={80} rx={24} ry={7} />
          <polygon points="24,76 34,66 76,24 66,14" fill="#D97706" />
          <polygon points="66,14 76,24 82,18 72,8" fill="#B45309" />
          <circle cx="77" cy="13" r="4" fill="#C084FC" />
        </svg>
      );

    case 'firework':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={20} ry={6} />
          <polygon points="46,14 54,14 62,26 38,26" fill="#EF4444" />
          <rect x="42" y="26" width="16" height="42" fill="#F8FAFC" />
          <line x1="42" y1="38" x2="58" y2="38" stroke="#EF4444" strokeWidth="3" />
          <line x1="42" y1="50" x2="58" y2="50" stroke="#3B82F6" strokeWidth="3" />
          <line x1="50" y1="68" x2="50" y2="82" stroke="#78350F" strokeWidth="2.5" />
        </svg>
      );

    case 'music_disc':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={7} />
          <circle cx="50" cy="50" r="28" fill="#18181B" stroke="#3F3F46" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="#E879F9" />
          <circle cx="50" cy="50" r="3" fill="#000000" />
        </svg>
      );

    case 'heart_of_sea':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={22} ry={7} />
          <circle cx="50" cy="50" r="24" fill="#22D3EE" />
          <circle cx="50" cy="50" r="16" fill="#0284C7" />
          <circle cx="50" cy="50" r="8" fill="#E0F2FE" />
        </svg>
      );

    case 'map':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={28} ry={8} />
          <polygon points="20,24 40,16 60,24 80,16 80,76 60,84 40,76 20,84" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          <path d="M30 40 Q45 30 55 45 Q65 60 70 50" stroke="#22C55E" strokeWidth="4" fill="none" />
        </svg>
      );

    // =========================================================================
    // COSMIC, TECH & SPECIAL
    // =========================================================================
    case 'nether_portal':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#1E1B4B" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#0F0D24" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#060510" />
          {/* Swirling Portal Fluid */}
          <polygon points="26,42 50,56 50,78 26,64" fill="#C084FC" />
          <polygon points="50,56 74,42 74,64 50,78" fill="#9333EA" />
          <circle cx="50" cy="58" r="6" fill="#F5D0FE" />
        </svg>
      );

    case 'end_portal':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={28} ry={8} />
          <polygon points="50,18 82,35 50,52 18,35" fill="#15803D" />
          <polygon points="18,35 50,52 50,82 18,65" fill="#FEF3C7" />
          <polygon points="50,52 82,35 82,65 50,82" fill="#FDE68A" />
          <polygon points="30,42 50,54 70,42 50,30" fill="#000000" />
          <circle cx="50" cy="42" r="2.5" fill="#22D3EE" />
          <circle cx="42" cy="38" r="1.5" fill="#FFFFFF" />
        </svg>
      );

    case 'dragon_egg':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={22} ry={7} />
          <ellipse cx="50" cy="52" rx="22" ry="30" fill="#18181B" stroke="#6B21A8" strokeWidth="2" />
          <circle cx="40" cy="38" r="3" fill="#E879F9" />
          <circle cx="58" cy="60" r="2.5" fill="#E879F9" />
        </svg>
      );

    case 'quantum_tesseract':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#22D3EE" opacity="0.3" stroke="#22D3EE" strokeWidth="2" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#0284C7" opacity="0.2" stroke="#22D3EE" strokeWidth="2" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#0369A1" opacity="0.2" stroke="#22D3EE" strokeWidth="2" />
          <polygon points="50,30 68,40 50,50 32,40" fill="#E879F9" />
          <polygon points="32,40 50,50 50,66 32,56" fill="#C084FC" />
          <polygon points="50,50 68,40 68,56 50,66" fill="#9333EA" />
        </svg>
      );


    case 'pig':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Main Head */}
          <polygon points="50,20 82,38 50,56 18,38" fill="#F472B6" />
          <polygon points="18,38 50,56 50,82 18,64" fill="#DB2777" />
          <polygon points="50,56 82,38 82,64 50,82" fill="#BE185D" />
          {/* Protruding 3D Snout */}
          <polygon points="50,50 68,60 50,70 32,60" fill="#FBCFE8" />
          <polygon points="32,60 50,70 50,78 32,68" fill="#F472B6" />
          <polygon points="50,70 68,60 68,68 50,78" fill="#DB2777" />
          {/* Nostrils */}
          <polygon points="40,64 44,66 44,70 40,68" fill="#831843" />
          <polygon points="56,66 60,64 60,68 56,70" fill="#831843" />
          {/* Eyes (Black & White Voxel) */}
          <polygon points="26,44 32,47 32,53 26,50" fill="#FFFFFF" />
          <polygon points="28,47 32,49 32,53 28,51" fill="#18181B" />
          <polygon points="68,47 74,44 74,50 68,53" fill="#FFFFFF" />
          <polygon points="68,49 72,47 72,51 68,53" fill="#18181B" />
        </svg>
      );

    case 'mace':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={52} cy={85} rx={24} ry={8} />
          {/* Handle / Breeze Rod shaft */}
          <polygon points="30,76 34,74 68,36 64,38" fill="#F59E0B" />
          <polygon points="64,38 68,36 72,40 68,42" fill="#FBBF24" />
          <polygon points="26,80 30,76 34,80 30,84" fill="#D97706" />
          {/* Wind Swirl around handle */}
          <path d="M42,62 Q50,56 46,50 Q42,44 54,42" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
          {/* Heavy 3D Heavy Stone Head */}
          <polygon points="68,16 88,28 72,42 52,30" fill="#94A3B8" />
          <polygon points="52,30 72,42 72,56 52,44" fill="#64748B" />
          <polygon points="72,42 88,28 88,42 72,56" fill="#475569" />
          {/* Studs / Flanges */}
          <polygon points="68,12 76,17 76,21 68,16" fill="#CBD5E1" />
          <polygon points="88,28 92,34 88,38 84,32" fill="#334155" />
          <polygon points="52,30 48,36 52,40 56,34" fill="#64748B" />
        </svg>
      );

    case 'wood_cube':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Face - Wood End Grain with Annual Ring */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#D97706" />
          <polygon points="50,22 72,34 50,46 28,34" fill="#B45309" />
          <polygon points="50,28 62,35 50,41 38,35" fill="#D97706" />
          <polygon points="50,33 54,35 50,37 46,35" fill="#78350F" />
          {/* Left Face - Oak Bark */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#92400E" />
          <path d="M26,45 L26,75 M38,48 L38,80" stroke="#78350F" strokeWidth="2.5" strokeDasharray="4 3" />
          {/* Right Face - Bark in Shadow */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#78350F" />
          <path d="M62,48 L62,80 M74,45 L74,75" stroke="#451A03" strokeWidth="2.5" strokeDasharray="4 3" />
        </svg>
      );

    case 'netherite_ingot':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={80} rx={28} ry={8} />
          {/* Ingot Top Face */}
          <polygon points="46,30 76,46 54,58 24,42" fill="#4B4B52" />
          <polygon points="46,30 76,46 72,48 42,32" fill="#6B6B76" />
          {/* Left Face */}
          <polygon points="24,42 54,58 50,70 20,54" fill="#313136" />
          {/* Right Face */}
          <polygon points="54,58 76,46 72,58 50,70" fill="#202024" />
          {/* Metallic Lustre / Netherite Streak */}
          <polygon points="34,39 60,53 58,55 32,41" fill="#7E7E8A" opacity="0.6" />
          <polygon points="22,48 48,62 48,64 22,50" fill="#585862" />
        </svg>
      );

    case 'gold_ingot':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={80} rx={28} ry={8} />
          {/* Top Beveled Face */}
          <polygon points="46,30 76,46 54,58 24,42" fill="#FDE047" />
          <polygon points="46,30 76,46 72,48 42,32" fill="#FEF08A" />
          {/* Left Face */}
          <polygon points="24,42 54,58 50,70 20,54" fill="#EAB308" />
          {/* Right Face */}
          <polygon points="54,58 76,46 72,58 50,70" fill="#CA8A04" />
          {/* Golden Glint Streak */}
          <polygon points="34,39 60,53 58,55 32,41" fill="#FFFFFF" opacity="0.85" />
          <polygon points="22,48 48,62 48,64 22,50" fill="#FEF08A" />
        </svg>
      );

    case 'dirt':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#A16207" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#854D0E" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#713F12" />
          {/* Soil specks */}
          <polygon points="46,24 52,27 48,31 42,28" fill="#713F12" />
          <polygon points="60,34 66,37 62,41 56,38" fill="#CA8A04" />
          <polygon points="28,48 34,51 34,57 28,54" fill="#713F12" />
          <polygon points="38,62 44,65 44,71 38,68" fill="#CA8A04" />
          <polygon points="62,56 68,53 68,59 62,62" fill="#582F0E" />
        </svg>
      );

    case 'stone':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#94A3B8" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#64748B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#475569" />
          {/* Subtle natural mineral variations */}
          <polygon points="36,25 48,32 44,36 32,29" fill="#CBD5E1" opacity="0.4" />
          <polygon points="24,46 38,54 38,62 24,54" fill="#475569" opacity="0.3" />
          <polygon points="58,56 72,48 72,58 58,66" fill="#334155" opacity="0.3" />
        </svg>
      );

    case 'cobblestone':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Base */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#94A3B8" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#64748B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#475569" />
          {/* Mortared Stone Cells on Top */}
          <polygon points="46,20 62,29 54,35 38,26" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          <polygon points="26,30 40,38 34,44 20,36" fill="#64748B" stroke="#334155" strokeWidth="1.5" />
          <polygon points="58,34 76,43 68,49 50,40" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          {/* Left Mortar Stones */}
          <polygon points="22,42 36,49 36,60 22,53" fill="#94A3B8" stroke="#334155" strokeWidth="1.5" />
          <polygon points="34,56 48,63 48,74 34,67" fill="#64748B" stroke="#334155" strokeWidth="1.5" />
          {/* Right Mortar Stones */}
          <polygon points="54,58 68,50 68,62 54,70" fill="#64748B" stroke="#1E293B" strokeWidth="1.5" />
          <polygon points="68,52 80,45 80,57 68,64" fill="#475569" stroke="#1E293B" strokeWidth="1.5" />
        </svg>
      );

    case 'mossy_cobblestone':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Cobble base */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#94A3B8" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#64748B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#475569" />
          {/* Stones */}
          <polygon points="46,20 62,29 54,35 38,26" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          {/* Vibrant Green Moss patches */}
          <polygon points="24,28 50,42 42,48 16,33" fill="#22C55E" />
          <polygon points="16,33 34,43 34,58 16,48" fill="#16A34A" />
          <polygon points="52,38 72,48 64,54 44,44" fill="#4ADE80" />
          <polygon points="50,52 64,44 64,66 50,74" fill="#15803D" />
        </svg>
      );

    case 'oak_log':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top rings */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#D97706" />
          <polygon points="50,20 74,33 50,46 26,33" fill="#B45309" />
          <polygon points="50,26 66,35 50,44 34,35" fill="#D97706" />
          <polygon points="50,32 58,36 50,40 42,36" fill="#92400E" />
          {/* Bark sides */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#92400E" />
          <path d="M24,42 L24,76 M36,46 L36,80 M44,50 L44,84" stroke="#78350F" strokeWidth="2" strokeDasharray="4 3" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#78350F" />
          <path d="M58,54 L58,84 M66,50 L66,80 M76,46 L76,76" stroke="#451A03" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      );

    case 'birch_planks':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Planks (Pale cream wood) */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#FEF08A" />
          <path d="M28,21 L62,40 M40,27 L74,46" stroke="#CA8A04" strokeWidth="1.5" opacity="0.6" />
          {/* Left Planks */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#FDE047" />
          <path d="M16,44 L50,63 M16,56 L50,75" stroke="#CA8A04" strokeWidth="1.5" />
          {/* Right Planks */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#EAB308" />
          <path d="M50,63 L84,44 M50,75 L84,56" stroke="#A16207" strokeWidth="1.5" />
        </svg>
      );

    case 'crimson_planks':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Planks (Deep Crimson Magenta) */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#BE185D" />
          <path d="M28,21 L62,40 M40,27 L74,46" stroke="#831843" strokeWidth="1.5" />
          {/* Left Planks */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#9D174D" />
          <path d="M16,44 L50,63 M16,56 L50,75" stroke="#700735" strokeWidth="1.5" />
          {/* Right Planks */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#831843" />
          <path d="M50,63 L84,44 M50,75 L84,56" stroke="#500724" strokeWidth="1.5" />
        </svg>
      );

    case 'blast_furnace':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Reinforced Smooth Stone & Iron Body */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#94A3B8" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#64748B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#475569" />
          {/* Top Iron Rivets */}
          <polygon points="50,22 72,34 50,46 28,34" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          {/* Left Face - Blast Grate & Molten Fire */}
          <polygon points="26,45 44,55 44,77 26,67" fill="#0F172A" />
          {/* Inner Flame animation */}
          <polygon points="30,55 40,61 40,73 30,67" fill="#F97316" className="animate-pulse" />
          <polygon points="33,60 38,63 38,70 33,67" fill="#FDE047" />
          {/* Iron Grille Bars */}
          <line x1="30" y1="52" x2="30" y2="70" stroke="#334155" strokeWidth="2" />
          <line x1="36" y1="56" x2="36" y2="74" stroke="#334155" strokeWidth="2" />
          <line x1="42" y1="59" x2="42" y2="77" stroke="#334155" strokeWidth="2" />
          {/* Bottom Smoothstone Pedestal trim */}
          <polygon points="16,67 50,86 50,83 16,64" fill="#334155" />
          <polygon points="50,86 84,67 84,64 50,83" fill="#1E293B" />
        </svg>
      );

    case 'smoker':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Face - Metal Chimney Flue */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#78350F" />
          <polygon points="50,24 66,33 50,42 34,33" fill="#1E293B" />
          {/* Left Face - Wood Framed Chamber with Burning Coals */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#92400E" />
          <polygon points="24,46 44,57 44,77 24,66" fill="#18181B" />
          <polygon points="28,56 40,63 40,73 28,66" fill="#EA580C" className="animate-pulse" />
          <polygon points="32,62 38,66 38,70 32,67" fill="#FBBF24" />
          {/* Right Face - Oak Plank Sides with Metal Brackets */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#78350F" />
          <line x1="50" y1="64" x2="84" y2="45" stroke="#451A03" strokeWidth="2" />
          <line x1="50" y1="76" x2="84" y2="57" stroke="#451A03" strokeWidth="2" />
        </svg>
      );

    case 'barrel':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Lid with Circle Inset */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#D97706" />
          <polygon points="50,22 72,34 50,46 28,34" fill="#B45309" />
          {/* Left Wood Staves */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#B45309" />
          {/* Metal Bands on Left */}
          <polygon points="16,42 50,61 50,65 16,46" fill="#334155" />
          <polygon points="16,58 50,77 50,81 16,62" fill="#334155" />
          {/* Right Wood Staves */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#92400E" />
          {/* Metal Bands on Right */}
          <polygon points="50,61 84,42 84,46 50,65" fill="#1E293B" />
          <polygon points="50,77 84,58 84,62 50,81" fill="#1E293B" />
        </svg>
      );

    case 'diamond_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* High Shimmer Cyan Diamond Block */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#67E8F9" />
          <polygon points="50,22 72,34 50,46 28,34" fill="#A5F3FC" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#06B6D4" />
          <polygon points="24,44 44,55 44,77 24,66" fill="#0891B2" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#0891B2" />
          <polygon points="56,55 76,44 76,66 56,77" fill="#0E7490" />
          {/* Glint Cross */}
          <polygon points="50,24 53,30 59,33 53,36 50,42 47,36 41,33 47,30" fill="#FFFFFF" opacity="0.9" />
        </svg>
      );

    case 'diamond_ore':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Stone block base */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#94A3B8" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#64748B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#475569" />
          {/* Sparkling Diamond Crystals on Top Face */}
          <polygon points="46,24 58,31 52,36 40,29" fill="#22D3EE" stroke="#0891B2" strokeWidth="1" />
          <polygon points="48,27 52,29 50,33 46,31" fill="#A5F3FC" />
          {/* Crystals on Left Face */}
          <polygon points="28,45 40,52 40,62 28,55" fill="#06B6D4" stroke="#0891B2" strokeWidth="1" />
          <polygon points="32,49 36,52 36,57 32,54" fill="#67E8F9" />
          {/* Crystals on Right Face */}
          <polygon points="58,58 72,50 72,60 58,68" fill="#0891B2" stroke="#0E7490" strokeWidth="1" />
          <polygon points="62,56 68,52 68,57 62,61" fill="#22D3EE" />
        </svg>
      );

    case 'gold_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Face */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#FDE047" />
          <polygon points="50,22 72,34 50,46 28,34" fill="#FEF08A" />
          {/* Left Face */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#EAB308" />
          <polygon points="24,44 44,55 44,77 24,66" fill="#CA8A04" />
          {/* Right Face */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#CA8A04" />
          <polygon points="56,55 76,44 76,66 56,77" fill="#A16207" />
          {/* Gold Sparkle */}
          <polygon points="50,24 53,30 59,33 53,36 50,42 47,36 41,33 47,30" fill="#FFFFFF" opacity="0.85" />
        </svg>
      );

    case 'emerald_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Face */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#4ADE80" />
          <polygon points="50,22 72,34 50,46 28,34" fill="#86EFAC" />
          {/* Left Face */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#16A34A" />
          <polygon points="24,44 44,55 44,77 24,66" fill="#15803D" />
          {/* Right Face */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#15803D" />
          <polygon points="56,55 76,44 76,66 56,77" fill="#14532D" />
          {/* Facet Sheen */}
          <polygon points="50,24 53,30 59,33 53,36 50,42 47,36 41,33 47,30" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );

    case 'netherite_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Heavy Dark Metallic Block */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#474750" />
          <polygon points="50,22 72,34 50,46 28,34" fill="#60606B" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#2E2E33" />
          <polygon points="24,44 44,55 44,77 24,66" fill="#222226" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#1E1E22" />
          <polygon points="56,55 76,44 76,66 56,77" fill="#141417" />
          {/* Metallic Lustre Plate Edges */}
          <path d="M50,14 L84,33 M50,14 L16,33" stroke="#8E8E9E" strokeWidth="1.5" />
        </svg>
      );

    case 'ancient_debris':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top End Grain with Metallic Swirl */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#5A473E" />
          <polygon points="50,20 74,33 50,46 26,33" fill="#3D302A" />
          <polygon points="50,26 64,34 50,42 36,34" fill="#886E5E" />
          {/* Left Banded Netherite Scrap */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#43352F" />
          <polygon points="16,44 50,63 50,69 16,50" fill="#786053" />
          <polygon points="16,60 50,79 50,83 16,64" fill="#281F1B" />
          {/* Right Banded Netherite Scrap */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#2E2420" />
          <polygon points="50,63 84,44 84,50 50,69" fill="#5A473E" />
          <polygon points="50,79 84,60 84,64 50,83" fill="#1C1512" />
        </svg>
      );

    case 'obsidian':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Obsidian Body */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#2A1B40" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#1B102B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#120A1E" />
          {/* Deep Violet Crystal Specks */}
          <polygon points="44,22 56,29 50,34 38,27" fill="#7C3AED" />
          <polygon points="26,45 36,51 36,58 26,52" fill="#9333EA" />
          <polygon points="62,56 74,49 74,56 62,63" fill="#6B21A8" />
        </svg>
      );

    case 'crying_obsidian':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Obsidian base */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#2A1B40" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#1B102B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#120A1E" />
          {/* Neon Purple Crying Veins & Drops */}
          <polygon points="46,22 62,31 54,37 38,28" fill="#C084FC" className="animate-pulse" />
          <polygon points="30,42 42,49 42,68 30,61" fill="#A855F7" />
          <polygon points="34,48 38,50 38,62 34,60" fill="#F0ABFC" />
          <polygon points="60,54 74,46 74,68 60,76" fill="#C084FC" />
          <polygon points="64,56 68,54 68,64 64,66" fill="#F5D0FE" />
          {/* Droplet on ground */}
          <circle cx="28" cy="78" r="2.5" fill="#E879F9" className="animate-ping" />
        </svg>
      );

    case 'redstone_lamp':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Glowing Redstone Bulb */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#FBBF24" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#F59E0B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#D97706" />
          {/* Dark Wooden Grid Frame */}
          <line x1="16" y1="33" x2="84" y2="33" stroke="#451A03" strokeWidth="2" />
          <line x1="50" y1="14" x2="50" y2="86" stroke="#451A03" strokeWidth="2.5" />
          <line x1="16" y1="67" x2="84" y2="67" stroke="#451A03" strokeWidth="2" />
          <line x1="33" y1="23" x2="33" y2="76" stroke="#451A03" strokeWidth="2" />
          <line x1="67" y1="23" x2="67" y2="76" stroke="#451A03" strokeWidth="2" />
        </svg>
      );

    case 'amethyst_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Geometric Crystals */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#C084FC" />
          <polygon points="50,22 72,34 50,46 28,34" fill="#E9D5FF" />
          {/* Left Facets */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#9333EA" />
          <polygon points="24,44 44,55 44,77 24,66" fill="#7E22CE" />
          {/* Right Facets */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#7E22CE" />
          <polygon points="56,55 76,44 76,66 56,77" fill="#6B21A8" />
          {/* Crystal Sparkle */}
          <polygon points="50,26 53,31 58,34 53,37 50,42 47,37 42,34 47,31" fill="#FFFFFF" opacity="0.9" />
        </svg>
      );

    case 'magma_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Dark basalt crust */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#27272A" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#18181B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#09090B" />
          {/* Glowing Lava Cracks (Top) */}
          <path d="M30,28 L50,36 L44,46 M50,36 L70,30" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
          <path d="M46,34 L54,38" stroke="#FDE047" strokeWidth="2" />
          {/* Glowing Cracks (Left) */}
          <path d="M26,45 L40,58 L32,76" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <path d="M38,56 L42,68" stroke="#FBBF24" strokeWidth="2" />
          {/* Glowing Cracks (Right) */}
          <path d="M58,58 L72,48 L76,66" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
          <path d="M64,55 L70,52" stroke="#FDE047" strokeWidth="2" />
        </svg>
      );

    case 'sponge':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" fill="#FDE047" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#EAB308" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#CA8A04" />
          {/* Sponge pores */}
          <circle cx="44" cy="28" r="3" fill="#A16207" />
          <circle cx="62" cy="36" r="3.5" fill="#A16207" />
          <circle cx="34" cy="40" r="2.5" fill="#A16207" />
          <circle cx="32" cy="54" r="3.5" fill="#854D0E" />
          <circle cx="44" cy="68" r="3" fill="#854D0E" />
          <circle cx="66" cy="52" r="3" fill="#713F12" />
          <circle cx="74" cy="66" r="3.5" fill="#713F12" />
        </svg>
      );

    case 'purpur_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Tile */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#D946EF" />
          <polygon points="50,22 72,34 50,46 28,34" fill="#E879F9" stroke="#A21CAF" strokeWidth="1.5" />
          {/* Left Tile */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#C026D3" />
          <polygon points="24,44 44,55 44,77 24,66" fill="#A21CAF" stroke="#701A75" strokeWidth="1.5" />
          {/* Right Tile */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#A21CAF" />
          <polygon points="56,55 76,44 76,66 56,77" fill="#86198F" stroke="#4A044E" strokeWidth="1.5" />
        </svg>
      );

    case 'prismarine':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Teal Ocean Brick Pattern */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#2DD4BF" />
          <path d="M28,21 L62,40 M40,27 L74,46" stroke="#0F766E" strokeWidth="1.5" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#14B8A6" />
          <path d="M16,44 L50,63 M16,56 L50,75" stroke="#0F766E" strokeWidth="1.5" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#0D9488" />
          <path d="M50,63 L84,44 M50,75 L84,56" stroke="#115E59" strokeWidth="1.5" />
        </svg>
      );

    case 'sea_lantern':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Glowing Cyan Center */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#CCFBF1" />
          <polygon points="50,20 74,33 50,46 26,33" fill="#99F6E4" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#5EEAD4" />
          <polygon points="22,42 44,54 44,78 22,66" fill="#2DD4BF" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#2DD4BF" />
          <polygon points="56,54 78,42 78,66 56,78" fill="#14B8A6" />
          {/* Prismatic Corner Caps */}
          <polygon points="50,14 56,17 50,21 44,17" fill="#0F766E" />
          <polygon points="16,33 22,36 16,40 10,36" fill="#0F766E" />
          <polygon points="84,33 90,36 84,40 78,36" fill="#0F766E" />
        </svg>
      );

    case 'target_block':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Hay bale / Target top */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#FDE047" />
          {/* Bullseye Rings (Top) */}
          <ellipse cx="50" cy="33" rx="20" ry="11" fill="#EF4444" />
          <ellipse cx="50" cy="33" rx="13" ry="7" fill="#F8FAFC" />
          <ellipse cx="50" cy="33" rx="6" ry="3.2" fill="#DC2626" />
          {/* Left Hay Side */}
          <polygon points="16,33 50,52 50,86 16,67" fill="#EAB308" />
          {/* Right Hay Side */}
          <polygon points="50,52 84,33 84,67 50,86" fill="#CA8A04" />
        </svg>
      );

    case 'steve':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Steve Hair Top */}
          <polygon points="50,18 80,35 50,52 20,35" fill="#451A03" />
          {/* Left Face - Skin & Beard */}
          <polygon points="20,35 50,52 50,80 20,63" fill="#D97706" />
          {/* Hair Side Fringe */}
          <polygon points="20,35 50,52 50,44 20,27" fill="#3D1A08" />
          <polygon points="20,35 28,39 28,52 20,48" fill="#3D1A08" />
          {/* Eyes (Left Face) */}
          <polygon points="30,48 36,51 36,56 30,53" fill="#FFFFFF" />
          <polygon points="33,49 36,51 36,56 33,54" fill="#38BDF8" />
          {/* Nose & Mouth */}
          <polygon points="40,54 48,58 48,64 40,60" fill="#B45309" />
          <polygon points="36,63 50,70 50,76 36,69" fill="#582F0E" />
          {/* Right Face in Shadow */}
          <polygon points="50,52 80,35 80,63 50,80" fill="#B45309" />
          <polygon points="50,52 80,35 80,44 50,61" fill="#2E1306" />
          {/* Right Eye */}
          <polygon points="64,48 70,45 70,50 64,53" fill="#FFFFFF" />
          <polygon points="64,48 67,46 67,51 64,53" fill="#0284C7" />
        </svg>
      );

    case 'alex':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Alex Bright Orange Hair Top */}
          <polygon points="50,18 80,35 50,52 20,35" fill="#EA580C" />
          {/* Left Face - Skin */}
          <polygon points="20,35 50,52 50,80 20,63" fill="#FDBA74" />
          {/* Hair Fringe on Left */}
          <polygon points="20,35 50,52 50,44 20,27" fill="#C2410C" />
          <polygon points="20,35 26,38 26,56 20,53" fill="#C2410C" />
          {/* Emerald Green Eye */}
          <polygon points="30,48 36,51 36,56 30,53" fill="#FFFFFF" />
          <polygon points="33,49 36,51 36,56 33,54" fill="#10B981" />
          {/* Right Face with Braided Hair */}
          <polygon points="50,52 80,35 80,63 50,80" fill="#FB923C" />
          <polygon points="50,52 80,35 80,50 50,67" fill="#9A3412" />
          {/* Right Eye */}
          <polygon points="64,48 70,45 70,50 64,53" fill="#FFFFFF" />
          <polygon points="64,48 67,46 67,51 64,53" fill="#059669" />
        </svg>
      );

    case 'enderman':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={24} ry={7} />
          {/* Dark Charcoal Head */}
          <polygon points="50,16 78,33 50,50 22,33" fill="#1E1B2E" />
          <polygon points="22,33 50,50 50,82 22,65" fill="#13111E" />
          <polygon points="50,50 78,33 78,65 50,82" fill="#0C0A14" />
          {/* Glowing Purple Voxel Eyes */}
          <polygon points="28,47 38,53 38,58 28,52" fill="#E879F9" className="animate-pulse" />
          <polygon points="31,49 35,51 35,56 31,54" fill="#C026D3" />
          <polygon points="62,53 72,47 72,52 62,58" fill="#E879F9" className="animate-pulse" />
          <polygon points="65,51 69,49 69,54 65,56" fill="#C026D3" />
          {/* Ender Particles */}
          <circle cx="36" cy="30" r="1.5" fill="#E879F9" />
          <circle cx="68" cy="26" r="1.5" fill="#C084FC" />
        </svg>
      );

    case 'wither_skeleton':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Charred Dark Skull */}
          <polygon points="50,18 80,35 50,52 20,35" fill="#3F3F46" />
          <polygon points="20,35 50,52 50,80 20,63" fill="#27272A" />
          <polygon points="50,52 80,35 80,63 50,80" fill="#18181B" />
          {/* Hollow Eye Sockets */}
          <polygon points="28,44 38,50 38,58 28,52" fill="#09090B" />
          <polygon points="62,50 72,44 72,52 62,58" fill="#000000" />
          {/* Nose Cavity */}
          <polygon points="46,55 54,60 54,65 46,60" fill="#09090B" />
          {/* Skeletal Teeth Grid */}
          <polygon points="32,66 48,74 48,78 32,70" fill="#71717A" />
          <line x1="36" y1="68" x2="36" y2="72" stroke="#18181B" strokeWidth="2" />
          <line x1="42" y1="71" x2="42" y2="75" stroke="#18181B" strokeWidth="2" />
        </svg>
      );

    case 'drowned':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Turquoise Rotting Flesh */}
          <polygon points="50,18 80,35 50,52 20,35" fill="#2DD4BF" />
          <polygon points="20,35 50,52 50,80 20,63" fill="#0F766E" />
          <polygon points="50,52 80,35 80,63 50,80" fill="#115E59" />
          {/* Dark Green Moss patches */}
          <polygon points="20,35 34,42 28,48 20,44" fill="#064E3B" />
          <polygon points="50,18 64,26 58,32 44,24" fill="#064E3B" />
          {/* Glowing Aqua Eyes */}
          <polygon points="28,46 36,51 36,57 28,52" fill="#A7F3D0" className="animate-pulse" />
          <polygon points="64,51 72,46 72,52 64,57" fill="#A7F3D0" className="animate-pulse" />
        </svg>
      );

    case 'warden':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={85} rx={28} ry={8} />
          {/* Sculk Horns / Antennas */}
          <path d="M22,30 L10,18 L16,14 L28,26" fill="#06B6D4" />
          <path d="M78,30 L90,18 L84,14 L72,26" fill="#0891B2" />
          {/* Deep Dark Warden Head */}
          <polygon points="50,18 80,35 50,52 20,35" fill="#0F172A" />
          <polygon points="20,35 50,52 50,80 20,63" fill="#020617" />
          <polygon points="50,52 80,35 80,63 50,80" fill="#020617" />
          {/* Sculk Spotting on Top */}
          <circle cx="44" cy="30" r="3" fill="#06B6D4" />
          <circle cx="58" cy="36" r="2.5" fill="#22D3EE" />
          {/* Blind Mouth / Soul Cavity */}
          <polygon points="34,58 50,66 50,76 34,68" fill="#0891B2" className="animate-pulse" />
          <polygon points="50,66 66,58 66,68 50,76" fill="#0E7490" />
          {/* Teeth */}
          <polygon points="38,58 42,60 40,64 36,62" fill="#F8FAFC" />
          <polygon points="46,62 50,64 48,68 44,66" fill="#F8FAFC" />
          <polygon points="54,64 58,62 56,66 52,68" fill="#F8FAFC" />
        </svg>
      );

    case 'iron_golem':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Iron Head */}
          <polygon points="50,18 80,35 50,52 20,35" fill="#E2E8F0" />
          <polygon points="20,35 50,52 50,80 20,63" fill="#CBD5E1" />
          <polygon points="50,52 80,35 80,63 50,80" fill="#94A3B8" />
          {/* Protruding 3D Long Nose */}
          <polygon points="50,48 58,53 50,58 42,53" fill="#E2E8F0" />
          <polygon points="42,53 50,58 50,74 42,69" fill="#94A3B8" />
          <polygon points="50,58 58,53 58,69 50,74" fill="#64748B" />
          {/* Red Eyes */}
          <polygon points="28,45 34,48 34,54 28,51" fill="#DC2626" />
          <polygon points="66,48 72,45 72,51 66,54" fill="#B91C1C" />
          {/* Moss Vines on Forehead */}
          <polygon points="34,26 44,32 40,36 30,30" fill="#16A34A" />
        </svg>
      );

    case 'allay':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={18} ry={6} />
          {/* Translucent Wings */}
          <ellipse cx="30" cy="32" rx="14" ry="7" transform="rotate(-30 30 32)" fill="#BAE6FD" fillOpacity="0.6" stroke="#38BDF8" strokeWidth="1" />
          <ellipse cx="70" cy="32" rx="14" ry="7" transform="rotate(30 70 32)" fill="#BAE6FD" fillOpacity="0.6" stroke="#38BDF8" strokeWidth="1" />
          {/* Tiny 3D Cyan Head */}
          <polygon points="50,22 68,32 50,42 32,32" fill="#38BDF8" />
          <polygon points="32,32 50,42 50,56 32,46" fill="#0284C7" />
          <polygon points="50,42 68,32 68,46 50,56" fill="#0369A1" />
          {/* Cute Eyes */}
          <circle cx="40" cy="40" r="2" fill="#0C4A6E" />
          <circle cx="60" cy="40" r="2" fill="#0C4A6E" />
          {/* Floating Cookie / Gem */}
          <polygon points="50,58 58,63 50,68 42,63" fill="#FBBF24" />
          <polygon points="42,63 50,68 50,74 42,69" fill="#D97706" />
          <polygon points="50,68 58,63 58,69 50,74" fill="#B45309" />
        </svg>
      );

    case 'axolotl':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* External Gills (Coral Pink) */}
          <polygon points="14,24 24,30 20,38 10,32" fill="#F43F5E" />
          <polygon points="10,40 22,44 18,50 8,46" fill="#E11D48" />
          <polygon points="86,24 76,30 80,38 90,32" fill="#FB7185" />
          <polygon points="90,40 78,44 82,50 92,46" fill="#F43F5E" />
          {/* Pink Axolotl Head */}
          <polygon points="50,22 80,38 50,54 20,38" fill="#FBCFE8" />
          <polygon points="20,38 50,54 50,78 20,62" fill="#F472B6" />
          <polygon points="50,54 80,38 80,62 50,78" fill="#DB2777" />
          {/* Cute Beady Eyes */}
          <circle cx="34" cy="50" r="3" fill="#18181B" />
          <circle cx="66" cy="50" r="3" fill="#18181B" />
          {/* Happy Smile */}
          <path d="M44,66 Q50,70 56,66" stroke="#9D174D" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'wolf':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Ears */}
          <polygon points="26,18 34,22 30,30 22,26" fill="#94A3B8" />
          <polygon points="74,18 66,22 70,30 78,26" fill="#64748B" />
          {/* Wolf Head */}
          <polygon points="50,22 78,38 50,54 22,38" fill="#CBD5E1" />
          <polygon points="22,38 50,54 50,78 22,62" fill="#94A3B8" />
          <polygon points="50,54 78,38 78,62 50,78" fill="#64748B" />
          {/* Snout */}
          <polygon points="50,50 64,58 50,66 36,58" fill="#F1F5F9" />
          <polygon points="36,58 50,66 50,74 36,66" fill="#CBD5E1" />
          <polygon points="50,66 64,58 64,66 50,74" fill="#94A3B8" />
          {/* Black Nose */}
          <polygon points="46,55 54,60 50,63 42,58" fill="#0F172A" />
          {/* Eyes */}
          <circle cx="32" cy="46" r="2.5" fill="#0F172A" />
          <circle cx="68" cy="46" r="2.5" fill="#0F172A" />
          {/* Red Tamed Collar */}
          <polygon points="22,62 50,78 50,84 22,68" fill="#EF4444" />
          <polygon points="50,78 78,62 78,68 50,84" fill="#B91C1C" />
        </svg>
      );

    case 'bee':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Translucent Wings */}
          <ellipse cx="32" cy="22" rx="14" ry="6" transform="rotate(-20 32 22)" fill="#BAE6FD" fillOpacity="0.7" stroke="#38BDF8" strokeWidth="1" />
          <ellipse cx="68" cy="22" rx="14" ry="6" transform="rotate(20 68 22)" fill="#BAE6FD" fillOpacity="0.7" stroke="#38BDF8" strokeWidth="1" />
          {/* Yellow Fur Top Face */}
          <polygon points="50,22 80,38 50,54 20,38" fill="#FBBF24" />
          {/* Black Stripes on Top */}
          <polygon points="36,30 46,35 38,40 28,34" fill="#18181B" />
          <polygon points="58,42 68,36 74,40 64,45" fill="#18181B" />
          {/* Left Face - Stripes */}
          <polygon points="20,38 50,54 50,80 20,64" fill="#F59E0B" />
          <polygon points="20,46 50,62 50,70 20,54" fill="#18181B" />
          {/* Right Face - Stripes & Stinger */}
          <polygon points="50,54 80,38 80,64 50,80" fill="#D97706" />
          <polygon points="50,62 80,46 80,54 50,70" fill="#18181B" />
          {/* Big Blue Minecraft Bee Eyes */}
          <polygon points="26,45 34,49 34,56 26,52" fill="#0284C7" />
          <polygon points="28,47 32,49 32,54 28,52" fill="#38BDF8" />
          <polygon points="40,52 48,56 48,63 40,59" fill="#0284C7" />
        </svg>
      );

    case 'cow':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Horns */}
          <polygon points="22,24 28,27 26,34 20,31" fill="#CBD5E1" />
          <polygon points="78,24 72,27 74,34 80,31" fill="#94A3B8" />
          {/* Cow Head Base */}
          <polygon points="50,22 78,38 50,54 22,38" fill="#78350F" />
          <polygon points="22,38 50,54 50,80 22,64" fill="#582F0E" />
          <polygon points="50,54 78,38 78,64 50,80" fill="#451A03" />
          {/* White Fur Patch on Forehead */}
          <polygon points="40,28 60,39 50,44 30,33" fill="#F8FAFC" />
          {/* Pink Snout */}
          <polygon points="50,54 66,62 50,70 34,62" fill="#FBCFE8" />
          <polygon points="34,62 50,70 50,78 34,70" fill="#F472B6" />
          <polygon points="50,70 66,62 66,70 50,78" fill="#DB2777" />
          {/* Nostrils */}
          <circle cx="42" cy="70" r="2" fill="#831843" />
          <circle cx="58" cy="70" r="2" fill="#831843" />
        </svg>
      );

    case 'sheep':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Fluffy Wool Top */}
          <polygon points="50,16 82,34 50,52 18,34" fill="#F8FAFC" />
          <polygon points="18,34 50,52 50,68 18,50" fill="#E2E8F0" />
          <polygon points="50,52 82,34 82,50 50,68" fill="#CBD5E1" />
          {/* Inner Pink Skin Face */}
          <polygon points="50,44 68,54 50,64 32,54" fill="#FBCFE8" />
          <polygon points="32,54 50,64 50,80 32,70" fill="#F472B6" />
          <polygon points="50,64 68,54 68,70 50,80" fill="#DB2777" />
          {/* Eyes */}
          <circle cx="38" cy="58" r="2" fill="#0F172A" />
          <circle cx="62" cy="58" r="2" fill="#0F172A" />
        </svg>
      );

    case 'chicken':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={24} ry={7} />
          {/* White Head */}
          <polygon points="50,22 76,37 50,52 24,37" fill="#F8FAFC" />
          <polygon points="24,37 50,52 50,76 24,61" fill="#E2E8F0" />
          <polygon points="50,52 76,37 76,61 50,76" fill="#CBD5E1" />
          {/* Yellow Beak */}
          <polygon points="50,46 64,54 50,62 36,54" fill="#FDE047" />
          <polygon points="36,54 50,62 50,68 36,60" fill="#EAB308" />
          <polygon points="50,62 64,54 64,60 50,68" fill="#CA8A04" />
          {/* Red Wattle below Beak */}
          <polygon points="46,65 54,70 54,78 46,73" fill="#EF4444" />
          {/* Eyes */}
          <circle cx="34" cy="46" r="2" fill="#0F172A" />
          <circle cx="66" cy="46" r="2" fill="#0F172A" />
        </svg>
      );

    case 'mooshroom':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Red Mushroom Cap Sprouting on Top */}
          <polygon points="50,10 66,19 50,28 34,19" fill="#EF4444" />
          <circle cx="50" cy="18" r="3" fill="#FFFFFF" />
          {/* Red Mooshroom Head */}
          <polygon points="50,24 78,40 50,56 22,40" fill="#DC2626" />
          <polygon points="22,40 50,56 50,80 22,64" fill="#B91C1C" />
          <polygon points="50,56 78,40 78,64 50,80" fill="#991B1B" />
          {/* White Mooshroom Spots */}
          <polygon points="32,46 40,50 36,56 28,52" fill="#FFFFFF" />
          <polygon points="60,46 68,42 72,48 64,52" fill="#FFFFFF" />
          {/* Snout */}
          <polygon points="50,56 66,64 50,72 34,64" fill="#FBCFE8" />
          <polygon points="34,64 50,72 50,78 34,70" fill="#F472B6" />
          <polygon points="50,72 66,64 66,70 50,78" fill="#DB2777" />
        </svg>
      );

    case 'breeze':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={85} rx={22} ry={7} />
          {/* Swirling Wind Vortex Clouds */}
          <ellipse cx="50" cy="74" rx="26" ry="8" fill="#93C5FD" fillOpacity="0.4" className="animate-pulse" />
          <ellipse cx="50" cy="62" rx="22" ry="7" fill="#60A5FA" fillOpacity="0.6" />
          <ellipse cx="50" cy="50" rx="18" ry="6" fill="#3B82F6" fillOpacity="0.8" />
          {/* Inner Breeze Rod Core */}
          <polygon points="50,20 66,30 50,40 34,30" fill="#818CF8" />
          <polygon points="34,30 50,40 50,58 34,48" fill="#6366F1" />
          <polygon points="50,40 66,30 66,48 50,58" fill="#4F46E5" />
          {/* Glowing White/Cyan Eyes */}
          <polygon points="38,36 44,40 44,46 38,42" fill="#FFFFFF" />
          <polygon points="56,40 62,36 62,42 56,46" fill="#FFFFFF" />
        </svg>
      );

    case 'sniffer':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={28} ry={8} />
          {/* Mossy Green Back */}
          <polygon points="50,18 82,35 50,52 18,35" fill="#15803D" />
          {/* Rust Red Sniffer Head */}
          <polygon points="18,35 50,52 50,78 18,61" fill="#991B1B" />
          <polygon points="50,52 82,35 82,61 50,78" fill="#7F1D1D" />
          {/* Yellow Wide Snout */}
          <polygon points="50,48 72,59 50,70 28,59" fill="#FBBF24" />
          <polygon points="28,59 50,70 50,78 28,67" fill="#D97706" />
          <polygon points="50,70 72,59 72,67 50,78" fill="#B45309" />
          {/* Nostrils */}
          <circle cx="42" cy="64" r="2.5" fill="#78350F" />
          <circle cx="58" cy="64" r="2.5" fill="#78350F" />
        </svg>
      );

    case 'ghast':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={22} ry={6} />
          {/* Ghostly White Cube Head */}
          <polygon points="50,16 80,33 50,50 20,33" fill="#FFFFFF" />
          <polygon points="20,33 50,50 50,74 20,57" fill="#E2E8F0" />
          <polygon points="50,50 80,33 80,57 50,74" fill="#CBD5E1" />
          {/* Crying Red / Grey Closed Eyes */}
          <polygon points="28,42 36,46 36,52 28,48" fill="#64748B" />
          <polygon points="30,48 34,50 34,58 30,56" fill="#DC2626" />
          <polygon points="64,46 72,42 72,48 64,52" fill="#64748B" />
          <polygon points="66,50 70,48 70,56 66,58" fill="#DC2626" />
          {/* Mouth */}
          <polygon points="46,56 54,60 54,65 46,61" fill="#475569" />
          {/* Tentacles */}
          <rect x="24" y="66" width="4" height="14" rx="2" fill="#E2E8F0" />
          <rect x="36" y="70" width="4" height="12" rx="2" fill="#CBD5E1" />
          <rect x="48" y="72" width="4" height="15" rx="2" fill="#94A3B8" />
          <rect x="60" y="68" width="4" height="13" rx="2" fill="#CBD5E1" />
          <rect x="72" y="64" width="4" height="12" rx="2" fill="#E2E8F0" />
        </svg>
      );

    case 'blaze':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={22} ry={6} />
          {/* Spinning Golden Fire Rods */}
          <rect x="18" y="24" width="6" height="26" rx="3" fill="#F59E0B" transform="rotate(-15 18 24)" />
          <rect x="76" y="24" width="6" height="26" rx="3" fill="#FBBF24" transform="rotate(15 76 24)" />
          <rect x="47" y="62" width="6" height="22" rx="3" fill="#D97706" />
          {/* Blaze Head */}
          <polygon points="50,22 72,34 50,46 28,34" fill="#FDE047" />
          <polygon points="28,34 50,46 50,64 28,52" fill="#F59E0B" />
          <polygon points="50,46 72,34 72,52 50,64" fill="#D97706" />
          {/* Glowing Eyes */}
          <circle cx="38" cy="45" r="2.5" fill="#7C2D12" />
          <circle cx="62" cy="45" r="2.5" fill="#7C2D12" />
        </svg>
      );

    case 'slime':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Outer Translucent Slime Layer */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#86EFAC" fillOpacity="0.75" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#4ADE80" fillOpacity="0.75" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#22C55E" fillOpacity="0.75" />
          {/* Inner Darker Slime Core */}
          <polygon points="50,30 68,40 50,50 32,40" fill="#16A34A" />
          <polygon points="32,40 50,50 50,68 32,58" fill="#15803D" />
          <polygon points="50,50 68,40 68,58 50,68" fill="#166534" />
          {/* Slime Eyes */}
          <polygon points="34,44 40,47 40,53 34,50" fill="#052E16" />
          <polygon points="60,47 66,44 66,50 60,53" fill="#052E16" />
          <polygon points="48,54 52,56 52,60 48,58" fill="#052E16" />
        </svg>
      );

    case 'magma_cube':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Top Basalt Plate */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#3F3F46" />
          <polygon points="16,33 50,52 50,62 16,43" fill="#27272A" />
          <polygon points="50,52 84,33 84,43 50,62" fill="#18181B" />
          {/* Glowing Molten Magma Core Layer */}
          <polygon points="20,45 50,61 50,67 20,51" fill="#F97316" className="animate-pulse" />
          <polygon points="50,61 80,45 80,51 50,67" fill="#EA580C" />
          {/* Bottom Basalt Layer */}
          <polygon points="16,56 50,75 50,86 16,67" fill="#27272A" />
          <polygon points="50,75 84,56 84,67 50,86" fill="#18181B" />
          {/* Glowing Orange Eyes */}
          <polygon points="30,42 38,46 38,52 30,48" fill="#FDE047" />
          <polygon points="62,46 70,42 70,48 62,52" fill="#FDE047" />
        </svg>
      );

    case 'piglin':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Floppy Long Nether Ears */}
          <polygon points="12,30 22,35 18,55 8,50" fill="#D97706" />
          <polygon points="88,30 78,35 82,55 92,50" fill="#B45309" />
          {/* Piglin Head */}
          <polygon points="50,20 80,36 50,52 20,36" fill="#F59E0B" />
          <polygon points="20,36 50,52 50,78 20,62" fill="#D97706" />
          <polygon points="50,52 80,36 80,62 50,78" fill="#B45309" />
          {/* Netherite Tusks */}
          <polygon points="28,52 34,55 32,65 26,62" fill="#F8FAFC" />
          <polygon points="72,55 66,52 68,62 74,65" fill="#F8FAFC" />
          {/* Snout */}
          <polygon points="50,50 66,58 50,66 34,58" fill="#FDE68A" />
          <polygon points="34,58 50,66 50,74 34,66" fill="#F59E0B" />
          <polygon points="50,66 66,58 66,66 50,74" fill="#D97706" />
          {/* Eyes */}
          <circle cx="32" cy="46" r="2.5" fill="#78350F" />
          <circle cx="68" cy="46" r="2.5" fill="#78350F" />
        </svg>
      );

    case 'nebula_star':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={26} ry={8} />
          {/* Swirling Galactic Nebula Halo */}
          <ellipse cx="50" cy="50" rx="38" ry="16" transform="rotate(-25 50 50)" stroke="#A855F7" strokeWidth="2.5" fill="none" opacity="0.8" />
          <ellipse cx="50" cy="50" rx="32" ry="12" transform="rotate(35 50 50)" stroke="#06B6D4" strokeWidth="2" fill="none" opacity="0.8" />
          {/* 3D Shining Isometric Star */}
          <polygon points="50,14 62,38 88,50 62,62 50,86 38,62 12,50 38,38" fill="#EC4899" className="animate-pulse" />
          <polygon points="50,22 58,42 78,50 58,58 50,78 42,58 22,50 42,42" fill="#F472B6" />
          <polygon points="50,30 54,44 68,50 54,56 50,70 46,56 32,50 46,44" fill="#FFFFFF" />
        </svg>
      );

    case 'warp_drive':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Reactor Chamber Frame */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#1E293B" stroke="#06B6D4" strokeWidth="1.5" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#0F172A" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#020617" />
          {/* Glowing Sub-space Singularity Core */}
          <polygon points="50,28 68,38 50,48 32,38" fill="#22D3EE" className="animate-pulse" />
          <polygon points="32,38 50,48 50,66 32,56" fill="#0891B2" />
          <polygon points="50,48 68,38 68,56 50,66" fill="#0E7490" />
          {/* Magnetic Confinement Beams */}
          <line x1="50" y1="14" x2="50" y2="86" stroke="#67E8F9" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );

    case 'redstone_core':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* High Tech Capacitor Enclosure */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#334155" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#1E293B" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#0F172A" />
          {/* Pulsing Redstone Plasma Center */}
          <polygon points="50,24 72,36 50,48 28,36" fill="#EF4444" className="animate-pulse" />
          <polygon points="28,36 50,48 50,70 28,58" fill="#DC2626" />
          <polygon points="50,48 72,36 72,58 50,70" fill="#B91C1C" />
          {/* High Voltage Energy Traces */}
          <path d="M50,24 L50,48 M28,36 L50,48 M72,36 L50,48" stroke="#FDE047" strokeWidth="1.5" />
        </svg>
      );

    case 'waystone':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={85} rx={26} ry={8} />
          {/* Carved Stone Waystone Pillar */}
          <polygon points="50,16 74,30 50,44 26,30" fill="#64748B" />
          <polygon points="26,30 50,44 50,82 26,68" fill="#475569" />
          <polygon points="50,44 74,30 74,68 50,82" fill="#334155" />
          {/* Glowing Turquoise Ancient Runes */}
          <polygon points="50,24 64,32 50,40 36,32" fill="#22D3EE" className="animate-pulse" />
          <path d="M38,48 L44,52 L38,62 M44,68 L38,72" stroke="#67E8F9" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M62,48 L56,52 L62,62 M56,68 L62,72" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'arcane_book':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Floating Grimoire / Tome */}
          <polygon points="50,22 84,38 50,54 16,38" fill="#7E22CE" />
          {/* Golden Rune Filigree */}
          <polygon points="50,28 72,38 50,48 28,38" fill="#F59E0B" />
          <polygon points="50,33 62,38 50,43 38,38" fill="#7E22CE" />
          {/* Parchment Leaves Edge */}
          <polygon points="16,38 50,54 50,62 16,46" fill="#FEF08A" />
          <polygon points="50,54 84,38 84,46 50,62" fill="#FDE047" />
          {/* Bottom Velvet Leather Cover */}
          <polygon points="16,46 50,62 50,74 16,58" fill="#581C87" />
          <polygon points="50,62 84,46 84,58 50,74" fill="#3B0764" />
          {/* Glowing Arcane Ribbon Bookmark */}
          <path d="M50,54 L50,84 L46,78 L42,84 L42,50" fill="#06B6D4" />
        </svg>
      );

    case 'space_helmet':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Titanium Outer Helmet */}
          <polygon points="50,16 80,33 50,50 20,33" fill="#F8FAFC" />
          <polygon points="20,33 50,50 50,78 20,61" fill="#E2E8F0" />
          <polygon points="50,50 80,33 80,61 50,78" fill="#CBD5E1" />
          {/* Reflective Gold Solar Visor */}
          <polygon points="30,36 70,36 64,60 36,60" rx="4" fill="#FBBF24" />
          <polygon points="34,40 50,40 44,56 38,56" fill="#FEF08A" opacity="0.8" />
          {/* Oxygen Neck Ring Collar */}
          <polygon points="20,61 50,78 50,84 20,67" fill="#0284C7" />
          <polygon points="50,78 80,61 80,67 50,84" fill="#0369A1" />
        </svg>
      );

    case 'celestial_moon':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={26} ry={8} />
          {/* Crescent Moon Cradling Celestial Orb */}
          <path d="M60,18 A32,32 0 1,0 76,68 A26,26 0 1,1 60,18 Z" fill="#FDE047" stroke="#EAB308" strokeWidth="1.5" />
          {/* Glowing Night Orb */}
          <circle cx="50" cy="50" r="16" fill="#6366F1" className="animate-pulse" />
          <circle cx="50" cy="50" r="12" fill="#818CF8" />
          <circle cx="46" cy="46" r="4" fill="#C7D2FE" />
          {/* Sparkles */}
          <polygon points="76,28 78,32 82,34 78,36 76,40 74,36 70,34 74,32" fill="#FFFFFF" />
        </svg>
      );

    case 'supernova':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={26} ry={8} />
          {/* Explosive Flare Burst */}
          <polygon points="50,10 56,36 82,20 64,44 90,50 64,56 82,80 56,64 50,90 44,64 18,80 36,56 10,50 36,44 18,20 44,36" fill="#F97316" />
          <polygon points="50,22 54,40 72,28 60,46 78,50 60,54 72,72 54,60 50,78 46,60 28,72 40,54 22,50 40,46 28,28 46,40" fill="#FDE047" className="animate-pulse" />
          <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
        </svg>
      );

    case 'infinity_relic':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={26} ry={8} />
          {/* Golden Gyro Ring */}
          <ellipse cx="50" cy="50" rx="34" ry="14" transform="rotate(-30 50 50)" stroke="#F59E0B" strokeWidth="3" fill="none" />
          {/* 3D Cosmic Octahedron Core */}
          <polygon points="50,18 72,46 50,56 28,46" fill="#C084FC" />
          <polygon points="28,46 50,56 50,82 28,46" fill="#9333EA" />
          <polygon points="50,56 72,46 50,82 50,56" fill="#7E22CE" />
          {/* Inner Light */}
          <polygon points="50,26 64,46 50,52 36,46" fill="#F5D0FE" className="animate-pulse" />
        </svg>
      );

    case 'cyber_cube':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          {/* Dark Glass Base */}
          <polygon points="50,14 84,33 50,52 16,33" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
          <polygon points="16,33 50,52 50,86 16,67" fill="#020617" stroke="#38BDF8" strokeWidth="1.5" />
          <polygon points="50,52 84,33 84,67 50,86" fill="#020617" stroke="#38BDF8" strokeWidth="1.5" />
          {/* Neon Cyber Circuit Traces */}
          <path d="M30,22 L50,33 L40,39 M50,33 L70,22" stroke="#22D3EE" strokeWidth="2" fill="none" />
          <path d="M26,45 L38,52 L38,72 M44,60 L26,60" stroke="#00F0FF" strokeWidth="2" fill="none" />
          <path d="M58,58 L72,50 L72,70" stroke="#A855F7" strokeWidth="2" fill="none" />
          {/* Central Hologram Node */}
          <circle cx="50" cy="52" r="3.5" fill="#38BDF8" className="animate-ping" />
        </svg>
      );

    case 'dimensional_rift':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={86} rx={26} ry={8} />
          {/* Spacetime Distortion Swirls */}
          <ellipse cx="50" cy="50" rx="36" ry="15" transform="rotate(-40 50 50)" fill="#7C3AED" fillOpacity="0.4" />
          <ellipse cx="50" cy="50" rx="30" ry="12" transform="rotate(20 50 50)" fill="#06B6D4" fillOpacity="0.5" />
          <ellipse cx="50" cy="50" rx="22" ry="9" transform="rotate(-15 50 50)" fill="#EC4899" fillOpacity="0.7" className="animate-pulse" />
          {/* Event Horizon Singularity */}
          <circle cx="50" cy="50" r="7" fill="#000000" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      );
    case 'wireframe':
    default:
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <GroundShadow cx={50} cy={84} rx={26} ry={8} />
          <polygon points="50,14 84,33 50,52 16,33" stroke="#C084FC" strokeWidth="3" fill="none" />
          <polygon points="16,33 50,52 50,86 16,67" stroke="#C084FC" strokeWidth="3" fill="none" />
          <polygon points="50,52 84,33 84,67 50,86" stroke="#C084FC" strokeWidth="3" fill="none" />
          <circle cx="50" cy="50" r="4" fill="#38BDF8" />
        </svg>
      );
  }
};

/**
 * High-performance Instance Icon Renderer
 */
export interface InstanceIconProps {
  icon?: string;
  background?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shadow?: boolean;
}

export const InstanceIconRenderer: React.FC<InstanceIconProps> = ({
  icon = 'backpack',
  background = 'blue',
  className = '',
  size = 'md',
  shadow = true
}) => {
  const bg = INSTANCE_BACKGROUNDS.find((b) => b.id === background) || INSTANCE_BACKGROUNDS[0];

  const sizeClasses = {
    xs: 'w-6 h-6 rounded-lg p-0.5',
    sm: 'w-8 h-8 rounded-xl p-1',
    md: 'w-12 h-12 rounded-2xl p-1.5',
    lg: 'w-16 h-16 rounded-2xl p-2',
    xl: 'w-24 h-24 rounded-3xl p-3',
    '2xl': 'w-36 h-36 rounded-3xl p-4'
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br ${bg.gradientClass} ${sizeClasses} ${
        shadow ? 'shadow-lg shadow-black/40' : ''
      } transition-all duration-300 overflow-hidden flex-shrink-0 group hover:scale-105 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none rounded-[inherit]" />
      <div className="relative z-10 w-full h-full flex items-center justify-center filter drop-shadow-md transition-transform duration-300 group-hover:-translate-y-0.5">
        <IsometricSymbolSVG symbolId={icon} />
      </div>
    </div>
  );
};

/**
 * Modrinth-Style 3D Icon Studio Modal
 */
export interface IconEditorModalProps {
  isOpen: boolean;
  initialIcon?: string;
  initialBackground?: string;
  onSave: (icon: string, background: string) => void;
  onClose: () => void;
}

export const IconEditorModal: React.FC<IconEditorModalProps> = ({
  isOpen,
  initialIcon = 'backpack',
  initialBackground = 'blue',
  onSave,
  onClose
}) => {
  const [selectedIcon, setSelectedIcon] = useState<string>(initialIcon);
  const [selectedBackground, setSelectedBackground] = useState<string>(initialBackground);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'modded' | 'blocks' | 'items' | 'mobs' | 'special'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSlide, setActiveSlide] = useState<number>(() => {
    const idx = INSTANCE_SYMBOLS.findIndex((s) => s.id === initialIcon);
    return idx >= 0 ? Math.floor(idx / 15) : 0;
  });

  const ICONS_PER_SLIDE = 15;

  const filteredSymbols = useMemo(() => {
    return INSTANCE_SYMBOLS.filter((sym) => {
      const matchesCategory = selectedCategory === 'all' || sym.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        sym.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        sym.id.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const totalSlides = Math.max(1, Math.ceil(filteredSymbols.length / ICONS_PER_SLIDE));
  const safeActiveSlide = Math.min(activeSlide, totalSlides - 1);
  const currentSlideIcons = filteredSymbols.slice(
    safeActiveSlide * ICONS_PER_SLIDE,
    (safeActiveSlide + 1) * ICONS_PER_SLIDE
  );

  if (!isOpen) return null;

  const handleRandomize = () => {
    sounds.playClick();
    const randomBg = INSTANCE_BACKGROUNDS[Math.floor(Math.random() * INSTANCE_BACKGROUNDS.length)].id;
    const randomIcon = INSTANCE_SYMBOLS[Math.floor(Math.random() * INSTANCE_SYMBOLS.length)].id;
    setSelectedBackground(randomBg);
    setSelectedIcon(randomIcon);
    const newIdx = filteredSymbols.findIndex((s) => s.id === randomIcon);
    if (newIdx >= 0) {
      setActiveSlide(Math.floor(newIdx / ICONS_PER_SLIDE));
    }
  };

  const handleSave = () => {
    sounds.playSuccess();
    onSave(selectedIcon, selectedBackground);
    onClose();
  };

  const handleWheelSlide = (e: React.WheelEvent) => {
    if (e.deltaY > 25 && safeActiveSlide < totalSlides - 1) {
      sounds.playClick();
      setActiveSlide((prev) => prev + 1);
    } else if (e.deltaY < -25 && safeActiveSlide > 0) {
      sounds.playClick();
      setActiveSlide((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl rounded-2xl bg-galaxy-900 border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-galaxy-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white tracking-wide">
                Icon Editor (3D Voxel Studio)
              </h3>
              <p className="text-xs text-slate-400">
                Custom isometric 3D voxel models inspired by the Modrinth art style
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Preview & Scales */}
            <div className="md:col-span-4 flex flex-col items-center space-y-4">
              <div className="p-4 rounded-2xl bg-galaxy-950/70 border border-white/[0.08] flex items-center justify-center w-full aspect-square max-w-[190px]">
                <InstanceIconRenderer
                  icon={selectedIcon}
                  background={selectedBackground}
                  size="2xl"
                  className="w-36 h-36"
                />
              </div>

              {/* Multi-Scale Previews */}
              <div className="flex items-center justify-center space-x-3">
                <InstanceIconRenderer icon={selectedIcon} background={selectedBackground} size="lg" />
                <InstanceIconRenderer icon={selectedIcon} background={selectedBackground} size="md" />
                <InstanceIconRenderer icon={selectedIcon} background={selectedBackground} size="sm" />
              </div>

              {/* Randomize Button */}
              <button
                onClick={handleRandomize}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span>Randomize Match</span>
              </button>

              {/* Presets */}
              <div className="w-full space-y-2 pt-1">
                <div className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Popular Presets</span>
                  <span className="text-[10px] text-slate-500 font-normal">{POPULAR_COMBOS.length} presets</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {POPULAR_COMBOS.slice(0, 8).map((combo, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedIcon(combo.icon);
                        setSelectedBackground(combo.bg);
                        const sIdx = filteredSymbols.findIndex((s) => s.id === combo.icon);
                        if (sIdx >= 0) {
                          setActiveSlide(Math.floor(sIdx / ICONS_PER_SLIDE));
                        }
                      }}
                      className={`transition-transform hover:scale-105 active:scale-95 rounded-xl p-1 flex items-center justify-center bg-galaxy-950/60 border border-white/[0.06] hover:border-blue-500/40 ${
                        selectedIcon === combo.icon && selectedBackground === combo.bg
                          ? 'ring-2 ring-blue-400 bg-blue-950/40 border-blue-400'
                          : ''
                      }`}
                    >
                      <InstanceIconRenderer icon={combo.icon} background={combo.bg} size="sm" shadow={false} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Background Colors & Symbol Library Grid */}
            <div className="md:col-span-8 flex flex-col space-y-4">
              {/* Background Color Swatches */}
              <div className="space-y-2">
                <div className="text-xs font-display font-bold text-white tracking-wide flex items-center justify-between">
                  <span>Background Gradient</span>
                  <span className="text-[11px] font-mono text-cyan-300 font-medium bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                    {INSTANCE_BACKGROUNDS.find((b) => b.id === selectedBackground)?.name || 'Cobalt Blue'}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-galaxy-950/60 border border-white/[0.08] shadow-inner">
                  <div className="grid grid-cols-8 gap-2">
                    {INSTANCE_BACKGROUNDS.map((bg) => {
                      const isSelected = selectedBackground === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedBackground(bg.id);
                          }}
                          className={`relative aspect-square rounded-xl bg-gradient-to-br ${bg.gradientClass} flex items-center justify-center transition-all shadow-md ${
                            isSelected
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-galaxy-950 scale-105 z-10 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                          title={bg.name}
                        >
                          {isSelected && (
                            <div className="text-white drop-shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Symbol Library with Search & Category Pills */}
              <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setActiveSlide(0);
                        }}
                        placeholder="Search 3D voxel icons (backpack, sword, creeper, tnt...)"
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-galaxy-950/90 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-blue-400 transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setActiveSlide(0);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Slide Navigation */}
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <button
                        type="button"
                        disabled={safeActiveSlide === 0}
                        onClick={() => {
                          sounds.playClick();
                          setActiveSlide((prev) => Math.max(0, prev - 1));
                        }}
                        className="p-1.5 rounded-lg bg-galaxy-950 border border-white/[0.08] hover:bg-white/[0.1] disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
                        title="Previous Page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-galaxy-950 border border-white/[0.1] text-[11px] font-mono">
                        <span className="text-cyan-300 font-bold">Page {safeActiveSlide + 1}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">{totalSlides}</span>
                      </div>
                      <button
                        type="button"
                        disabled={safeActiveSlide >= totalSlides - 1}
                        onClick={() => {
                          sounds.playClick();
                          setActiveSlide((prev) => Math.min(totalSlides - 1, prev + 1));
                        }}
                        className="p-1.5 rounded-lg bg-galaxy-950 border border-white/[0.08] hover:bg-white/[0.1] disabled:opacity-30 disabled:pointer-events-none text-slate-300 transition-colors"
                        title="Next Page"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
                    {(['all', 'modded', 'blocks', 'items', 'mobs', 'special'] as const).map((cat) => {
                      const isActive = selectedCategory === cat;
                      const count =
                        cat === 'all'
                          ? INSTANCE_SYMBOLS.length
                          : INSTANCE_SYMBOLS.filter((s) => s.category === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedCategory(cat);
                            setActiveSlide(0);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono capitalize transition-all border flex items-center space-x-1.5 ${
                            isActive
                              ? 'bg-blue-600/30 border-blue-400 text-blue-200 font-bold shadow-sm'
                              : 'bg-galaxy-950/60 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span>{cat === 'modded' ? 'Modded & Tech' : cat}</span>
                          <span
                            className={`text-[9px] px-1 rounded ${
                              isActive ? 'bg-blue-400/20 text-blue-200' : 'bg-white/[0.06] text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3x5 Grid Container */}
                <div
                  onWheel={handleWheelSlide}
                  className="relative rounded-2xl bg-galaxy-950/60 border border-white/[0.08] p-3 shadow-inner"
                >
                  {currentSlideIcons.length === 0 ? (
                    <div className="min-h-[220px] flex flex-col items-center justify-center text-slate-500 text-xs font-mono space-y-1">
                      <span>No matching icons found for "{searchQuery}"</span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-blue-400 hover:underline text-[11px]"
                      >
                        Clear search
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 content-start gap-2.5 min-h-[220px]">
                      {currentSlideIcons.map((sym) => {
                        const isSelected = selectedIcon === sym.id;
                        return (
                          <button
                            key={sym.id}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedIcon(sym.id);
                            }}
                            className={`group relative p-2 rounded-xl aspect-square flex flex-col items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-600/30 border-2 border-blue-400 shadow-glow-sm scale-105 ring-1 ring-blue-400/50'
                                : 'bg-galaxy-900/80 hover:bg-galaxy-800 border border-white/[0.06] hover:border-white/[0.2] hover:scale-105'
                            }`}
                            title={sym.name}
                          >
                            <div className="w-8 h-8 flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5">
                              <IsometricSymbolSVG symbolId={sym.id} />
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center mt-1 group-hover:text-slate-200 transition-colors">
                              {sym.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Slide Indicators */}
                  {totalSlides > 1 && (
                    <div className="flex items-center justify-center space-x-2 pt-2.5">
                      {Array.from({ length: totalSlides }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setActiveSlide(idx);
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            safeActiveSlide === idx
                              ? 'w-6 bg-gradient-to-r from-blue-400 to-cyan-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                              : 'w-1.5 bg-white/20 hover:bg-white/40'
                          }`}
                          title={`Page ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-galaxy-950/70">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Mix and match 3D isometric voxel elements to create a custom icon.</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-glow-sm hover:shadow-glow-md flex items-center space-x-1.5 transition-all transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save icon</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
