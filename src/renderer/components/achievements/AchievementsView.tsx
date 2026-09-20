import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Star,
  Award,
  Zap,
  Layers,
  RotateCcw,
  Clock,
  Cloud,
  Users,
  Compass,
  Boxes,
  Flame
} from 'lucide-react';
import { Achievement, AchievementCategory, AchievementRarity, AchievementStats, LauncherSettings, Account } from '../../types';
import { sounds } from '../../services/soundEngine';
import { ConfirmModal } from '../common/ConfirmModal';

interface AchievementsViewProps {
  onShowToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
  settings?: LauncherSettings;
  onSaveSettings?: (settings: LauncherSettings) => Promise<void>;
  activeAccount?: Account | null;
}

const categoryIcons: Record<string, React.FC<{ className?: string }>> = {
  all: Layers,
  exploration: Compass,
  instance: Boxes,
  playtime: Clock,
  modding: Zap,
  social: Users,
  cloud: Cloud,
  mastery: Award
};

const categoryLabels: Record<string, string> = {
  all: 'All Galaxies',
  exploration: 'Exploration',
  instance: 'Instances',
  playtime: 'Playtime',
  modding: 'Modding',
  social: 'Social',
  cloud: 'Cloud Sync',
  mastery: 'Mastery'
};

const rarityColors: Record<AchievementRarity, { border: string; bg: string; text: string; badge: string; glow: string }> = {
  common: {
    border: 'border-cyan-500/30 group-hover:border-cyan-400/60',
    bg: 'bg-cyan-950/20 hover:bg-cyan-950/30',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]'
  },
  uncommon: {
    border: 'border-emerald-500/30 group-hover:border-emerald-400/60',
    bg: 'bg-emerald-950/20 hover:bg-emerald-950/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
  },
  rare: {
    border: 'border-blue-500/30 group-hover:border-blue-400/60',
    bg: 'bg-blue-950/20 hover:bg-blue-950/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    glow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]'
  },
  epic: {
    border: 'border-purple-500/40 group-hover:border-purple-400/70',
    bg: 'bg-purple-950/25 hover:bg-purple-950/35',
    text: 'text-purple-400',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]'
  },
  legendary: {
    border: 'border-amber-500/50 group-hover:border-amber-400/80',
    bg: 'bg-amber-950/30 hover:bg-amber-950/40',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    glow: 'hover:shadow-[0_0_35px_rgba(245,158,11,0.35)]'
  },
  cosmic: {
    border: 'border-fuchsia-400/60 group-hover:border-fuchsia-300/90 shadow-[0_0_30px_rgba(217,70,239,0.3)]',
    bg: 'bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-pink-950/40',
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 font-bold',
    badge: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40 animate-pulse',
    glow: 'hover:shadow-[0_0_40px_rgba(217,70,239,0.5)]'
  }
};

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  onShowToast,
  settings,
  onSaveSettings,
  activeAccount
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterUnlocked, setFilterUnlocked] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<LauncherSettings | undefined>(settings);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  const fetchAchievements = async () => {
    try {
      if (window.galaxy) {
        const [list, currentStats] = await Promise.all([
          window.galaxy.getAchievements(),
          window.galaxy.getAchievementStats()
        ]);
        setAchievements(list || []);
        setStats(currentStats || null);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();

    if (window.galaxy) {
      const unsub1 = window.galaxy.onAchievementUnlocked(() => {
        fetchAchievements();
      });
      const unsub2 = window.galaxy.onAchievementStatsUpdated?.((data) => {
        if (data) {
          setAchievements(data.achievements || []);
          setStats(data.stats || null);
        } else {
          fetchAchievements();
        }
      });
      return () => {
        unsub1();
        if (unsub2) unsub2();
      };
    }
  }, [activeAccount?.id]);

  const handleReset = () => {
    sounds.playClick();
    setShowResetModal(true);
  };

  const handleConfirmReset = async () => {
    setShowResetModal(false);
    if (window.galaxy) {
      await window.galaxy.resetAchievements();
      await fetchAchievements();
      sounds.playSuccess();
      onShowToast({
        type: 'info',
        title: 'Achievements Reset',
        message: 'All launcher achievements have been reset.'
      });
    }
  };

  const filteredAchievements = achievements.filter((ach) => {
    // Category filter
    if (selectedCategory !== 'all' && ach.category !== selectedCategory) {
      return false;
    }
    // Unlocked status filter
    if (filterUnlocked === 'unlocked' && !ach.unlocked) return false;
    if (filterUnlocked === 'locked' && ach.unlocked) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ach.title.toLowerCase().includes(q) ||
        ach.description.toLowerCase().includes(q) ||
        ach.rarity.toLowerCase().includes(q)
      );
    }

    return true;
  });

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 select-none custom-scrollbar animate-in fade-in duration-200">
      {/* Hero Stats Card */}
      <div className="relative rounded-3xl p-6 overflow-hidden border border-white/10 bg-gradient-to-r from-galaxy-950/90 via-purple-950/40 to-slate-950/90 backdrop-blur-2xl shadow-2xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Title & Level */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-glow-sm">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-black text-white tracking-wide">
                    Galaxy Achievements
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-theme-accent/20 text-theme-accent border border-theme-accent/40">
                    Chronicle
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Earn Cosmic XP, unlock milestones, and conquer the Minecraft universe.
                </p>
              </div>
            </div>

            {/* Level & XP Progress */}
            <div className="flex items-center space-x-4 pt-1">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white/[0.06] border border-white/10">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-white">
                  Level {stats?.level || 1} Voyager
                </span>
              </div>
              <div className="w-48">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{stats?.totalXp || 0} XP</span>
                  <span>Level { (stats?.level || 1) + 1 }</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-700"
                    style={{ width: `${stats?.levelProgress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Metrics & Reset */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-black/40 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md">
              <div className="text-center px-3 border-r border-white/10">
                <div className="text-xl font-black text-white">
                  {stats?.totalUnlocked || 0}
                  <span className="text-xs text-slate-500 font-normal"> / {stats?.totalAchievements || 12}</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Unlocked
                </div>
              </div>

              <div className="text-center px-3 border-r border-white/10">
                <div className="text-xl font-black text-amber-400">
                  {stats?.totalXp || 0}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total XP
                </div>
              </div>

              <div className="text-center px-3">
                <div className="text-xl font-black text-emerald-400">
                  {stats ? Math.round((stats.totalUnlocked / Math.max(1, stats.totalAchievements)) * 100) : 0}%
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Complete
                </div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset Achievements (Testing)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Achievement Pop-up Toast Notifications Toggle */}
      {currentSettings && onSaveSettings && (
        <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 backdrop-blur-md flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-200">Achievement Pop-up Toast Notifications</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Display celebratory bottom-right toasts when milestone achievements are unlocked
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playSwitch();
              const isEnabled = currentSettings.enableAchievementPopups !== false;
              const updated = {
                ...currentSettings,
                enableAchievementPopups: !isEnabled
              };
              setCurrentSettings(updated);
              onSaveSettings(updated);
              onShowToast({
                type: 'info',
                title: updated.enableAchievementPopups !== false ? 'Achievement Popups Enabled' : 'Achievement Popups Disabled',
                message: updated.enableAchievementPopups !== false
                  ? 'Popups will appear at the bottom-right.'
                  : 'Achievements will unlock silently in your chronicle.'
              });
            }}
            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
              currentSettings.enableAchievementPopups !== false ? 'bg-amber-500 shadow-glow-sm' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              currentSettings.enableAchievementPopups !== false ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      )}

      {/* Categories Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full">
          {Object.keys(categoryLabels).map((catKey) => {
            const Icon = categoryIcons[catKey] || Layers;
            const isSelected = selectedCategory === catKey;
            const count = catKey === 'all'
              ? achievements.length
              : achievements.filter(a => a.category === catKey).length;

            return (
              <button
                key={catKey}
                onClick={() => {
                  sounds.playSwitch();
                  setSelectedCategory(catKey);
                }}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-theme-accent text-white shadow-glow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{categoryLabels[catKey]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-theme-accent w-48 transition-all"
            />
          </div>

          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setFilterUnlocked('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                filterUnlocked === 'all' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterUnlocked('unlocked')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                filterUnlocked === 'unlocked' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unlocked
            </button>
            <button
              onClick={() => setFilterUnlocked('locked')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                filterUnlocked === 'locked' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Locked
            </button>
          </div>
        </div>
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((ach) => {
          const style = rarityColors[ach.rarity] || rarityColors.common;
          const isMeta = ach.id === 'galaxies_conquered';
          const isSecret = Boolean(ach.secret);
          const isHiddenSecret = isSecret && !ach.unlocked;

          const displayIcon = isHiddenSecret ? '🔮' : ach.icon;
          const displayTitle = isHiddenSecret ? '??? Secret Discovery' : ach.title;
          const displayDesc = isHiddenSecret
            ? 'Classified cosmic achievement. Explore Galaxy Launcher and in-game moments to uncover its mystery!'
            : ach.description;

          return (
            <div
              key={ach.id}
              className={`group relative rounded-2xl p-4 border backdrop-blur-xl transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                ach.unlocked
                  ? `${style.border} ${style.bg} ${style.glow}`
                  : isHiddenSecret
                  ? 'border-purple-500/20 bg-purple-950/20 hover:border-purple-500/40 opacity-80 hover:opacity-100 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]'
                  : 'border-white/[0.06] bg-black/30 hover:border-white/15 opacity-75 hover:opacity-90'
              }`}
            >
              {/* Meta Cosmic Shimmer */}
              {isMeta && ach.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 animate-pulse pointer-events-none" />
              )}

              {/* Secret Achievement Mystery Ambient Glow */}
              {isHiddenSecret && (
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/20 transition-all" />
              )}

              {/* Card Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  {/* Icon Frame */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative border shadow-inner ${
                      ach.unlocked
                        ? 'bg-black/50 border-white/20'
                        : isHiddenSecret
                        ? 'bg-purple-950/40 border-purple-500/30'
                        : 'bg-black/30 border-white/5 grayscale'
                    }`}
                  >
                    <span className={isHiddenSecret ? 'animate-pulse' : ''}>{displayIcon}</span>
                    {ach.unlocked ? (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border border-emerald-300 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border flex items-center justify-center ${
                        isHiddenSecret ? 'bg-purple-900 border-purple-400' : 'bg-black/80 border-white/20'
                      }`}>
                        <Lock className={`w-2.5 h-2.5 ${isHiddenSecret ? 'text-purple-300' : 'text-slate-400'}`} />
                      </div>
                    )}
                  </div>

                  {/* Rarity & XP */}
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                      isHiddenSecret ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse' : style.badge
                    }`}>
                      {isHiddenSecret ? 'Secret' : ach.rarity}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      +{ach.xp} XP
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className={`text-sm font-bold tracking-wide ${
                  ach.unlocked ? 'text-white' : isHiddenSecret ? 'text-purple-200' : 'text-slate-300'
                }`}>
                  {displayTitle}
                </h3>
                <p className={`text-xs leading-relaxed mt-1 ${
                  isHiddenSecret ? 'text-purple-300/70 italic' : 'text-slate-400'
                }`}>
                  {displayDesc}
                </p>
              </div>

              {/* Card Bottom / Progress / Unlocked Stamp */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-col space-y-2">
                {ach.progress && !ach.unlocked && !isHiddenSecret && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="font-mono">
                        {ach.progress.current} / {ach.progress.max} {ach.progress.unit || ''}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-theme-accent to-purple-400"
                        style={{ width: `${Math.min(100, (ach.progress.current / ach.progress.max) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {isHiddenSecret ? 'Secret Classified' : (categoryLabels[ach.category] || ach.category)}
                  </span>
                  {ach.unlocked ? (
                    <span className="text-emerald-400 font-medium text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : 'Unlocked'}
                    </span>
                  ) : (
                    <span className={`${isHiddenSecret ? 'text-purple-400' : 'text-slate-500'} text-[10px] flex items-center gap-1`}>
                      <Lock className="w-2.5 h-2.5" /> {isHiddenSecret ? 'Undiscovered' : 'Locked'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && !loading && (
        <div className="text-center py-16 space-y-3 bg-white/[0.02] rounded-3xl border border-white/5">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
            <Trophy className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-400 font-medium">No achievements match your search or filter.</p>
        </div>
      )}

      {/* Custom Reset Achievements Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset All Achievements"
        subtitle="Cosmic Progression Wipe"
        type="danger"
        confirmText="Reset All Progress"
        cancelText="Cancel"
        icon={<RotateCcw className="w-4 h-4 text-rose-300" />}
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to reset all achievements? This will wipe your unlocked milestones, Cosmic XP, and level progression back to Level 1.
            </p>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] text-[11px] text-amber-300">
              ⚠️ This action will reset all your unlocked achievements and badges.
            </div>
          </div>
        }
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};
