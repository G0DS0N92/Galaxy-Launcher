import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Shield,
  Zap,
  Eye,
  RotateCw,
  Palette,
  Layers,
  Crown,
  Flame,
  Star,
  CheckCircle2,
  X
} from 'lucide-react';
import { Account, GalaxyCosmetics } from '../../types';
import { sounds } from '../../services/soundEngine';
import { CosmeticPreviewVisual } from '../../services/cosmeticsArt';

export interface CosmeticItem {
  id: string;
  name: string;
  type: 'cape' | 'wings' | 'halo';
  rarity: 'epic' | 'legendary' | 'cosmic';
  description: string;
  gradient: string;
  primaryColor: string;
  accentColor: string;
  badge: string;
}

export const GALAXY_COSMETICS: CosmeticItem[] = [
  // 🌌 CAPES
  {
    id: 'cape-starlight',
    name: 'Starlight Nebula Cape',
    type: 'cape',
    rarity: 'cosmic',
    description: 'Swirling deep violet cosmic dust with shimmering starlight constellations.',
    gradient: 'from-purple-600 via-indigo-600 to-cyan-400',
    primaryColor: '#7c3aed',
    accentColor: '#22d3ee',
    badge: '🌌 Animated Cosmic'
  },
  {
    id: 'cape-deep-void',
    name: 'Deep Void Cape',
    type: 'cape',
    rarity: 'legendary',
    description: 'Dark matter singularity surrounded by an electric-cyan photon accretion disk.',
    gradient: 'from-slate-950 via-cyan-950 to-cyan-500',
    primaryColor: '#0f172a',
    accentColor: '#06b6d4',
    badge: '🕳️ Void Energy'
  },
  {
    id: 'cape-solar-flare',
    name: 'Solar Flare Cape',
    type: 'cape',
    rarity: 'legendary',
    description: 'Thermonuclear golden coronal mass ejection burning with solar plasma.',
    gradient: 'from-amber-600 via-orange-500 to-yellow-400',
    primaryColor: '#d97706',
    accentColor: '#facc15',
    badge: '☀️ Solar Plasma'
  },
  {
    id: 'cape-quantum-matrix',
    name: 'Quantum Emerald Cape',
    type: 'cape',
    rarity: 'epic',
    description: 'High-tech neon emerald cyber matrix with streaming quantum particle streams.',
    gradient: 'from-emerald-700 via-teal-600 to-emerald-400',
    primaryColor: '#059669',
    accentColor: '#34d399',
    badge: '🟢 Quantum Matrix'
  },
  {
    id: 'cape-end-portal',
    name: 'End Portal Dimension Cape',
    type: 'cape',
    rarity: 'legendary',
    description: 'Starry ender void window looking straight into the infinite End dimension.',
    gradient: 'from-purple-950 via-slate-900 to-emerald-400',
    primaryColor: '#581c87',
    accentColor: '#10b981',
    badge: '🔮 Ender Dimension'
  },
  {
    id: 'cape-stargazer-prism',
    name: 'Stargazer Prism Cape',
    type: 'cape',
    rarity: 'cosmic',
    description: 'Holographic chromatic dispersion reflecting every color of the cosmic spectrum.',
    gradient: 'from-pink-500 via-purple-500 to-cyan-400',
    primaryColor: '#ec4899',
    accentColor: '#38bdf8',
    badge: '🌈 Prismatic Glow'
  },
  {
    id: 'cape-galactic-champion',
    name: 'Galactic Champion Cape',
    type: 'cape',
    rarity: 'cosmic',
    description: 'Imperial cosmic gold winged insignia for the elite players of Galaxy Launcher.',
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    primaryColor: '#f59e0b',
    accentColor: '#fbbf24',
    badge: '👑 Galaxy Elite'
  },
  {
    id: 'cape-cyber-synthwave',
    name: 'Cyber Synthwave Cape',
    type: 'cape',
    rarity: 'epic',
    description: 'Retro 80s neon magenta sunset wireframe over infinite deep space.',
    gradient: 'from-fuchsia-600 via-purple-600 to-cyan-400',
    primaryColor: '#c026d3',
    accentColor: '#22d3ee',
    badge: '🌆 Synthwave'
  },

  // 🪽 WINGS
  {
    id: 'wings-void-angel',
    name: 'Void Angel Wings',
    type: 'wings',
    rarity: 'cosmic',
    description: 'Ethereal cyan glowing energy wings with continuous particle trails.',
    gradient: 'from-cyan-500 to-blue-600',
    primaryColor: '#06b6d4',
    accentColor: '#3b82f6',
    badge: '🪽 Energy Wings'
  },
  {
    id: 'wings-phoenix',
    name: 'Cosmic Phoenix Wings',
    type: 'wings',
    rarity: 'cosmic',
    description: 'Blazing flame wings forged in the heart of a stellar supernova.',
    gradient: 'from-orange-500 via-red-500 to-yellow-400',
    primaryColor: '#ef4444',
    accentColor: '#f59e0b',
    badge: '🔥 Solar Supernova'
  },
  {
    id: 'wings-dark-matter',
    name: 'Dark Matter Tendrils',
    type: 'wings',
    rarity: 'legendary',
    description: 'Shadowy obsidian void wings pulsating with dark cosmic energy.',
    gradient: 'from-purple-900 to-slate-950',
    primaryColor: '#3b0764',
    accentColor: '#a855f7',
    badge: '🌑 Dark Matter'
  },
  {
    id: 'wings-mech',
    name: 'Cyber Mech Thrusters',
    type: 'wings',
    rarity: 'epic',
    description: 'Futuristic carbon-titanium jet thrusters with plasma exhaust plumes.',
    gradient: 'from-slate-700 via-cyan-600 to-cyan-400',
    primaryColor: '#334155',
    accentColor: '#06b6d4',
    badge: '⚙️ Cyber Thrusters'
  },

  // 👑 HALOS
  {
    id: 'halo-celestial',
    name: 'Celestial Runed Halo',
    type: 'halo',
    rarity: 'cosmic',
    description: 'Floating golden energy torus inscribed with ancient celestial glyphs.',
    gradient: 'from-amber-400 to-yellow-300',
    primaryColor: '#fbbf24',
    accentColor: '#fef08a',
    badge: '👑 Celestial Ring'
  },
  {
    id: 'halo-void-ring',
    name: 'Void Singularity Ring',
    type: 'halo',
    rarity: 'legendary',
    description: 'Orbiting dark matter ring with purple event horizon photon sparks.',
    gradient: 'from-purple-600 to-indigo-500',
    primaryColor: '#9333ea',
    accentColor: '#6366f1',
    badge: '🌀 Event Horizon'
  },
  {
    id: 'halo-cyber-ring',
    name: 'Neon Cyber Hex-Ring',
    type: 'halo',
    rarity: 'epic',
    description: 'Spinning electric-cyan holographic polygon energy forcefield.',
    gradient: 'from-cyan-400 to-teal-400',
    primaryColor: '#22d3ee',
    accentColor: '#2dd4bf',
    badge: '💠 Hex Forcefield'
  },
  {
    id: 'halo-starlight',
    name: 'Starlight Corona',
    type: 'halo',
    rarity: 'cosmic',
    description: 'Pulsing stellar corona with shimmering stardust flares.',
    gradient: 'from-pink-400 via-purple-400 to-cyan-300',
    primaryColor: '#f472b6',
    accentColor: '#38bdf8',
    badge: '✨ Star Flare'
  }
];

interface CosmeticsWardrobeProps {
  activeAccount: Account | null;
  onUpdateCosmetics: (cosmetics: GalaxyCosmetics) => Promise<void>;
  onShowToast: (toast: any) => void;
}

export const CosmeticsWardrobe: React.FC<CosmeticsWardrobeProps> = ({
  activeAccount,
  onUpdateCosmetics,
  onShowToast
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cape' | 'wings' | 'halo'>('all');

  const cosmetics = activeAccount?.cosmetics || {};

  const handleToggleEquip = async (item: CosmeticItem) => {
    if (!activeAccount) {
      sounds.playError();
      onShowToast({
        title: 'Account Required',
        message: 'Please connect or select an account to equip cosmetics.',
        type: 'warning'
      });
      return;
    }

    const currentEquipped =
      item.type === 'cape'
        ? cosmetics.equippedCape
        : item.type === 'wings'
        ? cosmetics.equippedWings
        : cosmetics.equippedHalo;

    const isAlreadyEquipped = currentEquipped === item.id;
    const nextCosmetics: GalaxyCosmetics = { ...cosmetics };

    if (item.type === 'cape') {
      nextCosmetics.equippedCape = isAlreadyEquipped ? undefined : item.id;
    } else if (item.type === 'wings') {
      nextCosmetics.equippedWings = isAlreadyEquipped ? undefined : item.id;
    } else if (item.type === 'halo') {
      nextCosmetics.equippedHalo = isAlreadyEquipped ? undefined : item.id;
    }

    if (isAlreadyEquipped) {
      sounds.playSwitch();
    } else {
      sounds.playSuccess();
    }

    await onUpdateCosmetics(nextCosmetics);

    onShowToast({
      title: isAlreadyEquipped ? `Unequipped ${item.name}` : `Equipped ${item.name}!`,
      message: isAlreadyEquipped
        ? 'Cosmetic removed from character.'
        : `${item.rarity.toUpperCase()} ${item.type} equipped to ${activeAccount.username}.`,
      type: isAlreadyEquipped ? 'info' : 'success'
    });
  };

  const handleUnequipAll = async () => {
    if (!activeAccount) return;
    sounds.playClick();
    const emptyCosmetics: GalaxyCosmetics = {
      equippedCape: undefined,
      equippedWings: undefined,
      equippedHalo: undefined
    };
    await onUpdateCosmetics(emptyCosmetics);
    onShowToast({
      title: 'Unequipped All Cosmetics',
      message: 'All capes, wings, and halos have been cleared.',
      type: 'info'
    });
  };

  const filteredCosmetics = GALAXY_COSMETICS.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.type === selectedCategory;
  });

  const getRarityBadge = (rarity: 'epic' | 'legendary' | 'cosmic') => {
    switch (rarity) {
      case 'cosmic':
        return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border-pink-500/30';
      case 'legendary':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'epic':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  const hasAnyEquipped = Boolean(
    cosmetics.equippedCape || cosmetics.equippedWings || cosmetics.equippedHalo
  );

  return (
    <div className="space-y-6">
      {/* Wardrobe Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/60 via-galaxy-900/80 to-cyan-950/60 border border-white/[0.1] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-glow-sm">
                Cosmic Collection
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">Exclusive Visuals</span>
            </div>
            <h3 className="text-lg font-display font-black text-white tracking-wide flex items-center gap-2">
              ✨ Galaxy Capes & Cosmetics Wardrobe
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Equip exclusive animated Cosmic Capes, Void Wings, and Starlight Halos. All Galaxy players can see each other's cosmetics in-game!
            </p>
          </div>

          {hasAnyEquipped && (
            <button
              onClick={handleUnequipAll}
              className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-red-500/20 border border-white/[0.1] hover:border-red-500/30 text-xs font-semibold text-slate-300 hover:text-red-300 transition-all flex items-center space-x-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Unequip All</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-3 overflow-x-auto">
        <button
          onClick={() => {
            sounds.playSwitch();
            setSelectedCategory('all');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-purple-600 text-white shadow-glow-sm'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          All Cosmetics ({GALAXY_COSMETICS.length})
        </button>
        <button
          onClick={() => {
            sounds.playSwitch();
            setSelectedCategory('cape');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'cape'
              ? 'bg-cyan-600 text-white shadow-glow-cyan'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          🌌 Cosmic Capes (8)
        </button>
        <button
          onClick={() => {
            sounds.playSwitch();
            setSelectedCategory('wings');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'wings'
              ? 'bg-pink-600 text-white shadow-glow-sm'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          🪽 Void Wings (4)
        </button>
        <button
          onClick={() => {
            sounds.playSwitch();
            setSelectedCategory('halo');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedCategory === 'halo'
              ? 'bg-amber-600 text-white shadow-glow-sm'
              : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
        >
          👑 Starlight Halos (4)
        </button>
      </div>

      {/* Cosmetics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCosmetics.map((item) => {
          const isEquipped =
            item.type === 'cape'
              ? cosmetics.equippedCape === item.id
              : item.type === 'wings'
              ? cosmetics.equippedWings === item.id
              : cosmetics.equippedHalo === item.id;

          return (
            <div
              key={item.id}
              onClick={() => handleToggleEquip(item)}
              className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isEquipped
                  ? 'bg-galaxy-800/90 border-cyan-400/60 shadow-glow-sm scale-[1.02]'
                  : 'bg-galaxy-900/60 hover:bg-galaxy-850/80 border-white/[0.08] hover:border-white/[0.2] hover:scale-[1.01]'
              }`}
            >
              {/* Glow accent */}
              <div
                className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br ${item.gradient}`}
              />

              <div className="space-y-3 relative z-10">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${getRarityBadge(
                      item.rarity
                    )}`}
                  >
                    {item.rarity}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-400">
                    {item.badge}
                  </span>
                </div>

                {/* Visual Artwork Thumbnail */}
                <div
                  className="rounded-2xl bg-black/40 border border-white/[0.08] p-2 flex flex-col justify-between shadow-inner relative overflow-hidden group-hover:border-white/[0.18] transition-colors"
                >
                  <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-[10px] font-black tracking-wider text-slate-300 uppercase">
                      {item.type === 'cape' ? '🌌 COSMIC CAPE' : item.type === 'wings' ? '🪽 VOID WINGS' : '👑 STARLIGHT HALO'}
                    </span>
                    {isEquipped && (
                      <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>ACTIVE</span>
                      </span>
                    )}
                  </div>

                  <CosmeticPreviewVisual item={item} isEquipped={isEquipped} />

                  <div className="text-xs font-bold text-white text-center drop-shadow-md truncate pt-1">
                    {item.name}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-4 relative z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleEquip(item);
                  }}
                  className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                    isEquipped
                      ? 'bg-emerald-500 text-black shadow-glow-emerald hover:bg-emerald-400'
                      : 'bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 border border-white/[0.1]'
                  }`}
                >
                  {isEquipped ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Equipped</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Equip</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
