import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Clock,
  Star,
  Users,
  Sparkles,
  Shield,
  Edit3,
  Boxes,
  Play,
  Copy,
  Check,
  Camera,
  Upload,
  RefreshCw,
  Image as ImageIcon,
  UserCheck,
  CheckCircle2,
  X,
  Palette,
  Volume2,
  Radio,
  Rocket
} from 'lucide-react';
import {
  UserSocialProfile,
  GlobalGameStats,
  Instance,
  Account,
  LauncherSettings
} from '../../../preload/types';
import { sounds } from '../../services/soundEngine';

interface ProfileStatsViewProps {
  instances: Instance[];
  activeAccount: Account | null;
  settings: LauncherSettings;
  onSaveSettings: (settings: LauncherSettings) => Promise<void>;
  onLaunchInstance: (instance: Instance) => void;
  onShowToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
  onPreviewStartupAnimation?: () => void;
}

export const ProfileStatsView: React.FC<ProfileStatsViewProps> = ({
  instances: initialInstances,
  activeAccount,
  settings,
  onSaveSettings,
  onLaunchInstance,
  onShowToast,
  onPreviewStartupAnimation
}) => {
  const [profile, setProfile] = useState<UserSocialProfile | null>(null);
  const [gameStats, setGameStats] = useState<GlobalGameStats | null>(null);
  const [liveInstances, setLiveInstances] = useState<Instance[]>(initialInstances);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSettings, setCurrentSettings] = useState<LauncherSettings>(settings);

  // Sync settings when props change
  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  // Sync with prop updates
  useEffect(() => {
    if (initialInstances && initialInstances.length > 0) {
      setLiveInstances(initialInstances);
    }
  }, [initialInstances]);

  // Status message editor
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editingStatusText, setEditingStatusText] = useState('');
  const [copiedTag, setCopiedTag] = useState(false);

  // Avatar Modal State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const loadData = async () => {
    try {
      if (!window.galaxy) return;
      setIsLoading(true);
      const [userProf, statsData, fetchedInstances] = await Promise.all([
        window.galaxy.getSocialProfile().catch(() => null),
        window.galaxy.getGameStats().catch(() => null),
        window.galaxy.listInstances().catch(() => [])
      ]);
      setProfile(userProf);
      setGameStats(statsData);
      if (fetchedInstances && fetchedInstances.length > 0) {
        setLiveInstances(fetchedInstances);
      }
      if (userProf?.statusMessage) {
        setEditingStatusText(userProf.statusMessage);
      }
    } catch (err) {
      console.error('Failed to load profile stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (window.galaxy?.onProfileUpdated) {
      const unsub = window.galaxy.onProfileUpdated((data) => setProfile(data));
      return () => unsub();
    }
  }, []);

  const currentUsername = activeAccount?.username || profile?.username || 'Player';
  const currentTag = profile?.tag || `${currentUsername}#1337`;
  const currentSkinUrl = profile?.avatarUrl || activeAccount?.skinUrl || `https://minotar.net/avatar/${currentUsername}/128`;

  const totalXp = gameStats?.totalXp || 0;
  const currentLevel = gameStats?.galaxyLevel || Math.max(1, Math.floor(totalXp / 1000) + 1);
  const currentLevelXpEarned = totalXp % 1000;
  const xpSpanForCurrentLevel = 1000;
  const xpToNextLevel = xpSpanForCurrentLevel - currentLevelXpEarned;
  const levelProgressPercent = Math.min(100, Math.round((currentLevelXpEarned / xpSpanForCurrentLevel) * 100));

  const getRankTitle = (lvl: number): string => {
    if (lvl >= 50) return 'Cosmic Overlord';
    if (lvl >= 30) return 'Galaxy Grandmaster';
    if (lvl >= 20) return 'Interstellar Pioneer';
    if (lvl >= 10) return 'Starlight Voyager';
    if (lvl >= 5) return 'Planetary Explorer';
    return 'Novice Spacefarer';
  };

  const handleCopyTag = () => {
    navigator.clipboard.writeText(currentTag);
    setCopiedTag(true);
    sounds.playClick();
    onShowToast({
      type: 'success',
      title: 'Galaxy Tag Copied',
      message: `${currentTag} copied to clipboard!`
    });
    setTimeout(() => setCopiedTag(false), 2500);
  };

  const handleSaveStatusMessage = async () => {
    try {
      if (window.galaxy?.updateSocialProfile) {
        const updated = await window.galaxy.updateSocialProfile({ statusMessage: editingStatusText.trim() });
        setProfile(updated);
        setIsEditingStatus(false);
        sounds.playSuccess();
        onShowToast({
          type: 'success',
          title: 'Status Updated',
          message: 'Your custom status message has been broadcast.'
        });
      }
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        type: 'error',
        title: 'Failed to update status',
        message: err.message
      });
    }
  };

  const handleOpenAvatarModal = () => {
    sounds.playClick();
    setAvatarPreview(currentSkinUrl);
    setCustomAvatarInput('');
    setShowAvatarModal(true);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarPreview(base64);
      setCustomAvatarInput(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    const chosenUrl = avatarPreview || customAvatarInput.trim();
    if (!chosenUrl) return;

    try {
      setIsSavingAvatar(true);
      if (window.galaxy?.updateSocialProfile) {
        const updated = await window.galaxy.updateSocialProfile({ avatarUrl: chosenUrl });
        setProfile(updated);
        sounds.playSuccess();
        onShowToast({
          type: 'success',
          title: 'Avatar Updated',
          message: 'Your personalized profile icon has been saved.'
        });
        setShowAvatarModal(false);
      }
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        type: 'error',
        title: 'Failed to save avatar',
        message: err.message
      });
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleToggleInstanceFavorite = async (instanceId: string) => {
    sounds.playSwitch();
    try {
      if (window.galaxy?.toggleInstanceFavorite) {
        await window.galaxy.toggleInstanceFavorite(instanceId);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Theme & Personalization handlers
  const handleThemeChange = (theme: LauncherSettings['theme']) => {
    if (theme === currentSettings.theme) return;
    sounds.playSwitch();
    const updated = { ...currentSettings, theme };
    setCurrentSettings(updated);
    document.documentElement.className = `theme-${theme}`;
    document.documentElement.setAttribute('data-theme', theme);
    onSaveSettings(updated);
    onShowToast({
      type: 'info',
      title: `Applied Theme: ${theme.replace('-', ' ').toUpperCase()}`
    });
  };

  const handleToggleSound = (enabled: boolean) => {
    sounds.setEnabled(enabled);
    const updated = { ...currentSettings, soundEffects: enabled };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

  const handleVolumeChange = (vol: number) => {
    sounds.setVolume(vol);
    const updated = { ...currentSettings, soundVolume: vol };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-galaxy-950/30 select-none animate-in fade-in duration-200">
      {/* View Header */}
      <div className="px-8 py-5 border-b border-white/[0.06] flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-display font-extrabold text-white tracking-tight">
              Profile & Personalization
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Lv. {currentLevel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Player rank, total playtime metrics, cosmic visual themes, audio engine, and startup launch aesthetics.
          </p>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyTag}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 transition-all group"
            title="Click to copy your Galaxy Tag"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-mono text-theme-accent">{currentTag}</span>
            {copiedTag ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              loadData();
            }}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-all"
            title="Refresh Profile & Stats"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-theme-accent' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6 w-full">
        {/* HERO PROFILE CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden shadow-2xl">
          {/* Background ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            {/* Avatar & Player Info */}
            <div className="flex items-center space-x-5">
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleOpenAvatarModal}
                  className="w-20 h-20 rounded-2xl bg-black/70 border-2 border-theme-accent/50 shadow-glow-md overflow-hidden flex items-center justify-center cursor-pointer relative focus:outline-none transition-all group-hover:border-theme-accent group-hover:shadow-glow-lg"
                  title="Click to customize profile avatar"
                >
                  <img
                    src={currentSkinUrl}
                    alt={currentUsername}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />

                  {/* Hover Edit Overlay */}
                  <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-1">
                    <Camera className="w-5 h-5 text-theme-accent drop-shadow-md" />
                    <span className="text-[10px] font-black tracking-wider uppercase">Edit</span>
                  </div>
                </button>

                {/* Level Badge on Avatar */}
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-[10px] shadow-glow-md border border-white/30 tracking-wide font-mono pointer-events-none">
                  Lv. {currentLevel}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                    {currentUsername}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08] font-mono text-xs text-theme-accent">
                    {currentTag}
                  </span>
                </div>

                {/* Rank Badge Title */}
                <div className="text-xs text-slate-400 font-medium mt-0.5 flex items-center space-x-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-200 font-semibold">{getRankTitle(currentLevel)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Account: {activeAccount?.type || 'offline'}</span>
                </div>

                {/* Status Message Editor */}
                <div className="mt-2 flex items-center space-x-2">
                  {isEditingStatus ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingStatusText}
                        onChange={(e) => setEditingStatusText(e.target.value)}
                        placeholder="Set custom status..."
                        className="px-2.5 py-1 rounded-lg bg-black/60 border border-theme-accent text-xs text-slate-200 focus:outline-none w-56 sm:w-72"
                        maxLength={80}
                      />
                      <button
                        onClick={handleSaveStatusMessage}
                        className="px-2.5 py-1 rounded-lg btn-accent text-[11px] font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingStatus(false)}
                        className="text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingStatus(true)}
                      className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-slate-100 bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/[0.04] transition-all group"
                      title="Click to edit your custom status message"
                    >
                      <span className="italic">
                        "{profile?.statusMessage || 'Exploring the cosmic void 🌌'}"
                      </span>
                      <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-theme-accent transition-colors" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Level & Galaxy XP Card */}
            <div className="w-full md:w-80 p-4 rounded-2xl bg-black/60 border border-white/[0.08] shadow-2xl backdrop-blur-md space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-xs font-mono shadow-glow-sm flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>LEVEL {currentLevel}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300">{getRankTitle(currentLevel)}</span>
                </div>
                <span className="font-mono text-xs font-black text-theme-accent">
                  {totalXp.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">XP</span>
                </span>
              </div>

              {/* Level Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-white/[0.08] p-0.5 border border-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-700 shadow-glow-md relative"
                    style={{ width: `${Math.max(4, Math.min(100, levelProgressPercent))}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{currentLevelXpEarned} / {xpSpanForCurrentLevel} XP ({levelProgressPercent}%)</span>
                  <span className="text-purple-300 font-semibold">{xpToNextLevel} XP to Lv {currentLevel + 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center space-x-2 text-xs text-amber-300 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold">Achievements</span>
              </div>
              <div className="text-xl font-black text-slate-100">
                {gameStats?.unlockedAchievementsCount || 0}
                <span className="text-xs font-normal text-slate-500 ml-1">unlocked</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center space-x-2 text-xs text-cyan-300 mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-semibold">Total Playtime</span>
              </div>
              <div className="text-xl font-black text-slate-100">
                {gameStats?.totalPlaytimeHours || 0}h{' '}
                <span className="text-sm font-semibold text-slate-400">
                  {(gameStats?.totalPlaytimeMinutes || 0) % 60}m
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center space-x-2 text-xs text-purple-300 mb-1">
                <Boxes className="w-4 h-4" />
                <span className="font-semibold">Total Instances</span>
              </div>
              <div className="text-xl font-black text-slate-100">
                {liveInstances.length}
                <span className="text-xs font-normal text-slate-500 ml-1">configured</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center space-x-2 text-xs text-yellow-300 mb-1">
                <Star className="w-4 h-4" />
                <span className="font-semibold">Favorite Instance</span>
              </div>
              <div className="text-xs font-bold text-slate-200 line-clamp-1 mt-1">
                {gameStats?.favoriteInstanceName || 'None Selected'}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COSMIC PERSONALIZATION & CUSTOMIZATION SUITE
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* THEMES & VISUAL AESTHETICS */}
          <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Cosmic Visual Themes</h3>
                  <p className="text-[11px] text-slate-400">Curated interstellar color palettes and gradients</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                6 Themes
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'deep-void', name: 'Deep Void', color: 'from-slate-800 via-indigo-950 to-black', border: 'border-indigo-500' },
                { id: 'nebula-purple', name: 'Nebula Purple', color: 'from-purple-600 via-indigo-600 to-purple-800', border: 'border-purple-500' },
                { id: 'supernova-cyan', name: 'Supernova Cyan', color: 'from-cyan-500 via-teal-500 to-blue-600', border: 'border-cyan-500' },
                { id: 'solar-gold', name: 'Solar Flare', color: 'from-amber-500 via-orange-500 to-red-600', border: 'border-amber-500' },
                { id: 'emerald-aurora', name: 'Emerald Aurora', color: 'from-emerald-500 via-teal-600 to-emerald-800', border: 'border-emerald-500' },
                { id: 'crimson-quasar', name: 'Crimson Quasar', color: 'from-rose-600 via-red-600 to-rose-900', border: 'border-rose-500' },
              ].map((th) => {
                const isSelected = currentSettings.theme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => handleThemeChange(th.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all group ${
                      isSelected
                        ? `${th.border} bg-white/[0.08] shadow-glow-sm ring-1 ring-white/20`
                        : 'border-white/[0.06] bg-black/30 hover:border-white/[0.18] hover:bg-black/50'
                    }`}
                  >
                    <div className={`w-full h-9 rounded-xl bg-gradient-to-r ${th.color} mb-2 flex items-center justify-center shadow-md group-hover:scale-[1.02] transition-transform`}>
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md stroke-[3]" />}
                    </div>
                    <div className="text-xs font-bold text-slate-200 truncate">{th.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Starfield Particles Toggle */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Interactive Starfield & Nebula</div>
                <div className="text-[11px] text-slate-400">GPU-accelerated cosmic background particle simulation</div>
              </div>
              <button
                onClick={() => {
                  const updated = { ...currentSettings, backgroundAnimation: !currentSettings.backgroundAnimation };
                  setCurrentSettings(updated);
                  onSaveSettings(updated);
                }}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                  currentSettings.backgroundAnimation ? 'bg-purple-600 shadow-glow-sm' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  currentSettings.backgroundAnimation ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Cosmic Startup Intro Animation Toggle */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="space-y-0.5 pr-2">
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-semibold text-slate-200">Cosmic Startup Intro Animation</div>
                  {onPreviewStartupAnimation && (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onPreviewStartupAnimation();
                      }}
                      className="text-[10px] text-purple-300 hover:text-purple-100 font-semibold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 flex items-center space-x-1 hover:scale-105 active:scale-95 transition-all shadow-sm"
                    >
                      <Rocket className="w-2.5 h-2.5 text-cyan-300" />
                      <span>Preview Launch</span>
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Play rocket hyperspace launch sequence when opening Galaxy Launcher
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playSwitch();
                  const isEnabled = currentSettings.startupAnimation !== false;
                  const updated = { ...currentSettings, startupAnimation: !isEnabled };
                  setCurrentSettings(updated);
                  onSaveSettings(updated);
                  onShowToast({
                    type: 'info',
                    title: updated.startupAnimation !== false ? 'Startup Animation Enabled' : 'Startup Animation Disabled',
                    message: updated.startupAnimation !== false
                      ? 'Rocket galaxy launch intro will play on startup.'
                      : 'Startup intro animation skipped on launch.'
                  });
                }}
                className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors shrink-0 ${
                  currentSettings.startupAnimation !== false ? 'bg-purple-600 shadow-glow-sm' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  currentSettings.startupAnimation !== false ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: AUDIO ENGINE & SYSTEM INTEGRATIONS */}
          <div className="space-y-6">
            {/* AUDIO ENGINE */}
            <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-4 shadow-xl">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Sound Effects & Audio Engine</h3>
                  <p className="text-[11px] text-slate-400">Futuristic sci-fi audio feedback for UI clicks and launches</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">UI Audio Feedback</div>
                  <div className="text-[11px] text-slate-400">Play subtle audio cues on interactions</div>
                </div>
                <button
                  onClick={() => handleToggleSound(!currentSettings.soundEffects)}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                    currentSettings.soundEffects ? 'bg-cyan-600 shadow-glow-sm' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    currentSettings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {currentSettings.soundEffects && (
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Volume</span>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          sounds.playLaunch();
                          if (window.galaxy?.testSoundAchievement) {
                            window.galaxy.testSoundAchievement();
                          }
                        }}
                        className="text-[10px] text-cyan-300 hover:text-cyan-200 font-semibold px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 flex items-center space-x-1 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Test Sound</span>
                      </button>
                      <span className="font-mono text-cyan-400 font-bold">{Math.round(currentSettings.soundVolume * 100)}%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentSettings.soundVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-black/50 rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* SYSTEM TRAY & DISCORD INTEGRATION */}
            <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">System Tray & Discord Presence</h3>
                    <p className="text-[11px] text-slate-400">Windows tray background activity and Discord game status</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Active Tray
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3.5">
                {/* Permanent Background Tray Status */}
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-purple-200 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>System Tray Background Mode</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Closing with (X) minimizes Galaxy to the Windows notification tray. Right-click the tray icon to quit completely.
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    ALWAYS ON
                  </span>
                </div>

                {/* Start Minimized to Tray */}
                <div className="pt-1 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Start Minimized to Tray</div>
                    <div className="text-[11px] text-slate-400">
                      Launch Galaxy Launcher directly in the background tray on boot
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playSwitch();
                      const updated = {
                        ...currentSettings,
                        minimizeToTray: !currentSettings.minimizeToTray
                      };
                      setCurrentSettings(updated);
                      onSaveSettings(updated);
                    }}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      currentSettings.minimizeToTray ? 'bg-purple-600 shadow-glow-sm' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      currentSettings.minimizeToTray ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Discord Rich Presence */}
                <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Discord Rich Presence (RPC)</div>
                    <div className="text-[11px] text-slate-400">
                      Show current instance, Minecraft version, and active game session on Discord
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playSwitch();
                      const updated = {
                        ...currentSettings,
                        discordRpc: currentSettings.discordRpc === false ? true : false
                      };
                      setCurrentSettings(updated);
                      onSaveSettings(updated);
                      onShowToast({
                        type: 'info',
                        title: updated.discordRpc !== false ? 'Discord RPC Enabled' : 'Discord RPC Disabled'
                      });
                    }}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                      currentSettings.discordRpc !== false ? 'bg-indigo-600 shadow-glow-sm' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      currentSettings.discordRpc !== false ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PER-INSTANCE PLAYTIME & USAGE BREAKDOWN */}
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-theme-accent" />
                <span>Per-Instance Gameplay Statistics</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track exact playtime, launch counter, and star your favorite instances.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {gameStats?.instanceStats?.length || 0} Instance(s) Tracked
            </span>
          </div>

          {(!gameStats?.instanceStats || gameStats.instanceStats.length === 0) ? (
            <div className="p-8 rounded-2xl bg-black/20 border border-white/[0.04] text-center text-xs text-slate-500">
              No instance gameplay tracked yet. Launch an instance to start recording time!
            </div>
          ) : (
            <div className="space-y-3">
              {gameStats.instanceStats.map((instStat) => {
                const hours = Math.floor(instStat.playTimeMinutes / 60);
                const minutes = instStat.playTimeMinutes % 60;
                const maxPlaytime = Math.max(...gameStats.instanceStats.map((s) => s.playTimeMinutes), 1);
                const percentage = Math.round((instStat.playTimeMinutes / maxPlaytime) * 100);
                const matchingInstance =
                  liveInstances.find((i) => i.id === instStat.id) ||
                  liveInstances.find((i) => i.name.toLowerCase().trim() === instStat.name.toLowerCase().trim());

                return (
                  <div
                    key={instStat.id}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.1] transition-all space-y-3 group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        {/* Star Favorite Button */}
                        <button
                          onClick={() => handleToggleInstanceFavorite(instStat.id)}
                          className={`p-2 rounded-xl border transition-all ${
                            instStat.isFavorite
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-sm'
                              : 'bg-black/40 text-slate-500 hover:text-amber-300 border-white/[0.06]'
                          }`}
                          title={instStat.isFavorite ? 'Unstar favorite' : 'Star as Favorite Instance'}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-100">{instStat.name}</span>
                            {instStat.isFavorite && (
                              <span className="px-2 py-0.2 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                                ⭐ Favorite
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2 font-mono">
                            <span>{instStat.loader} {instStat.version}</span>
                            <span>•</span>
                            <span>Launched {instStat.launchCount} time(s)</span>
                            <span>•</span>
                            <span>Last played: {instStat.lastPlayed ? new Date(instStat.lastPlayed).toLocaleDateString() : 'Never'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Playtime Display */}
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-100">
                            {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {instStat.playTimeMinutes} mins total
                          </div>
                        </div>

                        {/* Direct Launch Button */}
                        <button
                          onClick={async () => {
                            sounds.playLaunch();
                            let instToLaunch = matchingInstance;
                            if (!instToLaunch && window.galaxy) {
                              const freshList = await window.galaxy.listInstances().catch(() => []);
                              instToLaunch = freshList.find(
                                (i) => i.id === instStat.id || i.name.toLowerCase().trim() === instStat.name.toLowerCase().trim()
                              );
                              if (freshList && freshList.length > 0) {
                                setLiveInstances(freshList);
                              }
                            }
                            if (instToLaunch) {
                              onLaunchInstance(instToLaunch);
                            } else {
                              onShowToast({
                                type: 'error',
                                title: 'Instance not found',
                                message: `Could not find instance "${instStat.name}" on disk.`
                              });
                            }
                          }}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl btn-accent font-semibold text-xs shadow-glow-sm hover:scale-105 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Launch</span>
                        </button>
                      </div>
                    </div>

                    {/* Playtime Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-theme-accent to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AVATAR CUSTOMIZATION MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-theme-accent" />
                <h3 className="text-base font-display font-bold text-white">Customize Profile Avatar</h3>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <div className="w-24 h-24 rounded-2xl bg-black/60 border-2 border-theme-accent/60 shadow-glow-md overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Live Avatar Preview</span>
            </div>

            {/* Upload File Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Upload Image File (PNG/JPG)</label>
              <label className="border border-dashed border-white/[0.15] hover:border-theme-accent/50 rounded-xl p-3 flex items-center justify-center space-x-2 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <Upload className="w-4 h-4 text-theme-accent" />
                <span className="text-xs text-slate-300">Choose custom image from PC</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Or Direct Image URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Or Paste Image / Skin URL</label>
              <input
                type="text"
                value={customAvatarInput}
                onChange={(e) => {
                  setCustomAvatarInput(e.target.value);
                  if (e.target.value.startsWith('http')) {
                    setAvatarPreview(e.target.value);
                  }
                }}
                placeholder="https://minotar.net/avatar/... or https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-theme-accent"
              />
            </div>

            {/* Preset Avatars */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Quick Minecraft Preset Avatars</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'Steve', url: 'https://minotar.net/avatar/MHF_Steve/64' },
                  { name: 'Alex', url: 'https://minotar.net/avatar/MHF_Alex/64' },
                  { name: 'Techno', url: 'https://minotar.net/avatar/Technoblade/64' },
                  { name: 'Ender', url: 'https://minotar.net/avatar/Enderman/64' }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setAvatarPreview(preset.url);
                      setCustomAvatarInput(preset.url);
                    }}
                    className="p-1.5 rounded-xl bg-black/40 border border-white/[0.06] hover:border-theme-accent/50 flex flex-col items-center space-y-1 transition-all"
                  >
                    <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-lg object-cover" />
                    <span className="text-[10px] text-slate-400 font-mono">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={isSavingAvatar}
                className="px-5 py-2.5 rounded-xl btn-accent font-bold text-xs shadow-glow-sm flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {isSavingAvatar ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Avatar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
