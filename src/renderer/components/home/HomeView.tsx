import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Zap,
  HardDrive,
  Cpu,
  Layers,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderOpen,
  Settings as SettingsIcon,
  Flame,
  CheckCircle2,
  RefreshCw,
  Search,
  Clock,
  Boxes,
  X,
  Compass,
  Users,
  Gamepad2,
  FolderUp,
  ArrowRight,
  Download,
  Check,
  Loader2,
  Activity,
  Star,
  Trash2,
  Trophy,
  Cloud,
  Shield,
  Award,
  MoreVertical,
  MoreHorizontal,
  Edit2,
  Copy,
  Sun,
  Calendar,
  AlertTriangle,
  Package,
  Wrench,
  CheckSquare,
  Tag,
  Radio,
  FileBox,
  Shirt,
  Box,
  Puzzle,
  Pin
} from 'lucide-react';
import { Instance, Account, LaunchProgress, Achievement, CloneInstanceOptions } from '../../types';
import { sounds } from '../../services/soundEngine';
import { ConfirmModal } from '../common/ConfirmModal';
import { CloneInstanceModal } from '../instances/CloneInstanceModal';
import { TabType } from '../layout/Sidebar';
import bgPortalHero from '../../assets/instance_backgrounds/bg_portal_hero.jpg';
import bgGalaxy from '../../assets/instance_backgrounds/bg_galaxy.jpg';
import bgSunset from '../../assets/instance_backgrounds/bg_sunset.jpg';
import bgNether from '../../assets/instance_backgrounds/bg_nether.jpg';
import bgVanilla from '../../assets/instance_backgrounds/bg_vanilla.jpg';

interface HomeViewProps {
  activeTab?: 'home' | 'instances';
  instances: Instance[];
  selectedInstance: Instance | null;
  onSelectInstance: (instance: Instance) => void;
  onLaunch: (instance: Instance) => void;
  onKill: (instance: Instance) => void;
  launchProgress: LaunchProgress | null;
  activeAccount: Account | null;
  onOpenInstanceDetails: (instance: Instance) => void;
  onCreateInstance: (initialTab?: 'create' | 'share_code' | 'import') => void;
  onOpenFolder: (instance: Instance) => void;
  onOptimizeInstance: (instance: Instance) => void;
  onUpdateInstance?: (instance: Instance) => Promise<void>;
  onDeleteInstance?: (id: string) => Promise<void> | void;
  onCloneInstance?: (id: string, options: CloneInstanceOptions) => Promise<void>;
  onSelectTab?: (tab: TabType) => void;
  onNavigateToMarketplace?: (type: 'mod' | 'shader' | 'resourcepack') => void;
  onShowToast?: (toast: any) => void;
}

const BACKGROUND_OPTIONS = [bgPortalHero, bgGalaxy, bgSunset, bgNether, bgVanilla];

function getInstanceBg(instance?: Instance | null, index = 0): string {
  if (!instance) return bgPortalHero;
  if (instance.iconBackground && instance.iconBackground.startsWith('http')) {
    return instance.iconBackground;
  }
  const hash = (instance.id || instance.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return BACKGROUND_OPTIONS[(hash + index) % BACKGROUND_OPTIONS.length];
}

function formatRelativeTime(dateStr?: string | number): string {
  if (!dateStr) return 'Never played';
  const timestamp = typeof dateStr === 'string' ? new Date(dateStr).getTime() : dateStr;
  if (isNaN(timestamp) || timestamp === 0) return 'Never played';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatPlaytimeHours(minutes = 0): string {
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

export const HomeView: React.FC<HomeViewProps> = ({
  activeTab = 'home',
  instances = [],
  selectedInstance,
  onSelectInstance,
  onLaunch,
  onKill,
  launchProgress,
  activeAccount,
  onOpenInstanceDetails,
  onCreateInstance,
  onOpenFolder,
  onOptimizeInstance,
  onUpdateInstance,
  onDeleteInstance,
  onCloneInstance,
  onSelectTab,
  onNavigateToMarketplace,
  onShowToast
}) => {
  // Live Clock State
  const [currentDateTime, setCurrentDateTime] = useState({
    date: 'Sunday, 21 Sep 2026',
    time: '07:42 PM'
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentDateTime({ date: dateStr, time: timeStr });
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // UI Interactive States
  const [instanceFilterTab, setInstanceFilterTab] = useState<'all' | 'favorites' | 'recent'>('all');
  const [instanceSortBy, setInstanceSortBy] = useState<'lastPlayed' | 'name' | 'playtime' | 'version'>('lastPlayed');
  const [showLaunchDropdown, setShowLaunchDropdown] = useState(false);
  const [cloneModalInstance, setCloneModalInstance] = useState<Instance | null>(null);
  const [deleteConfirmInstance, setDeleteConfirmInstance] = useState<Instance | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [activeMenuInstanceId, setActiveMenuInstanceId] = useState<string | null>(null);

  // Dynamic Metrics & Stats
  const [friendsOnlineCount, setFriendsOnlineCount] = useState(5);
  const [achievementsRatio, setAchievementsRatio] = useState({ unlocked: 18, total: 25 });
  const [installedModsCount, setInstalledModsCount] = useState(127);

  useEffect(() => {
    if (window.galaxy?.getFriends) {
      window.galaxy.getFriends().then((frs) => {
        if (frs && frs.length > 0) {
          const online = frs.filter((f) => f.status === 'online' || f.status === 'in-game').length;
          setFriendsOnlineCount(online);
        }
      }).catch(() => {});
    }
    if (window.galaxy?.getAchievements) {
      window.galaxy.getAchievements().then((achs) => {
        if (achs && achs.length > 0) {
          const unlocked = achs.filter((a) => a.unlocked).length;
          setAchievementsRatio({ unlocked, total: achs.length });
        }
      }).catch(() => {});
    }
  }, []);

  const totalPlaytimeHours = useMemo(() => {
    const totalMins = instances.reduce((acc, inst) => acc + (inst.playTimeMinutes || 0), 0);
    return Math.floor(totalMins / 60) || 248;
  }, [instances]);

  // Target instance for Hero action
  const currentHeroInstance = selectedInstance || instances[0] || null;

  // Recent instances for Home (up to 3)
  const recentInstances = useMemo(() => {
    if (instances.length === 0) return [];
    return [...instances]
      .sort((a, b) => {
        const timeA = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        const timeB = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 3);
  }, [instances]);

  // Filtered & Sorted instances for Instances Page
  const filteredInstances = useMemo(() => {
    let list = [...instances];

    if (instanceFilterTab === 'favorites') {
      list = list.filter((i) => i.isFavorite);
    } else if (instanceFilterTab === 'recent') {
      list = list.filter((i) => i.lastPlayed);
    }

    list.sort((a, b) => {
      if (instanceSortBy === 'lastPlayed') {
        const timeA = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        const timeB = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
        return timeB - timeA;
      }
      if (instanceSortBy === 'name') return a.name.localeCompare(b.name);
      if (instanceSortBy === 'playtime') return (b.playTimeMinutes || 0) - (a.playTimeMinutes || 0);
      if (instanceSortBy === 'version') return b.version.localeCompare(a.version);
      return 0;
    });

    return list;
  }, [instances, instanceFilterTab, instanceSortBy]);

  const favoritesCount = useMemo(() => instances.filter((i) => i.isFavorite).length, [instances]);
  const recentCount = useMemo(() => instances.filter((i) => i.lastPlayed).length, [instances]);

  const handleToggleFavorite = async (inst: Instance, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    if (onUpdateInstance) {
      await onUpdateInstance({ ...inst, isFavorite: !inst.isFavorite });
    }
  };

  const handleSaveRename = async (inst: Instance) => {
    if (!editingNameValue.trim() || editingNameValue === inst.name) {
      setEditingNameId(null);
      return;
    }
    sounds.playClick();
    if (onUpdateInstance) {
      await onUpdateInstance({ ...inst, name: editingNameValue.trim() });
    }
    setEditingNameId(null);
  };

  // Helper for instance health status state (Healthy, Warning, Critical)
  const getInstanceHealthState = (inst: Instance) => {
    if (inst.javaPath && !inst.javaPath.includes('javaw') && !inst.javaPath.includes('java')) {
      return { status: 'critical', label: 'Critical', color: 'rose', bg: 'bg-rose-500/10 border-rose-500/25 text-rose-400' };
    }
    if (inst.memoryMax && inst.memoryMax < 1024) {
      return { status: 'warning', label: '2 Issues', color: 'amber', bg: 'bg-amber-500/10 border-amber-500/25 text-amber-400' };
    }
    return { status: 'healthy', label: 'Healthy', color: 'emerald', bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' };
  };

  // =========================================================================
  // RENDER: HOME VIEW (Tab === 'home')
  // =========================================================================
  if (activeTab === 'home') {
    return (
      <div className="min-h-full p-6 space-y-6 select-none max-w-[1600px] mx-auto">
        {/* 1. PANORAMIC HERO BANNER */}
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-72 md:h-80 group">
          <img
            src={bgPortalHero}
            alt="Hero Banner"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070a18]/95 via-[#070a18]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a18]/90 via-transparent to-transparent" />

          {/* Top Right Quote */}
          <div className="absolute top-6 right-8 text-right hidden sm:block">
            <p className="text-xs font-display font-medium text-slate-300/80 italic tracking-wider">
              " Same Game<br />Infinite Worlds "
            </p>
          </div>

          {/* Hero Content (Left) */}
          <div className="relative h-full flex flex-col justify-between p-8 z-10">
            <div>
              <span className="text-[11px] font-mono font-extrabold tracking-[0.28em] text-indigo-300 uppercase block mb-1.5 drop-shadow">
                G A L A X Y &nbsp; L A U N C H E R
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight flex items-center gap-2.5 drop-shadow-md">
                <span>Welcome back, {activeAccount?.username || 'Explorer'}</span>
                <span className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">★</span>
              </h1>
              <p className="text-sm text-slate-300/90 font-medium mt-1.5 max-w-lg">
                Launch, play, manage and explore your Minecraft journey.
              </p>
            </div>

            {/* Launch Action & Live Clock */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              {/* Big Launch Button with Dropdown */}
              <div className="relative flex items-center">
                {currentHeroInstance ? (
                  <div className="flex items-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-[0_0_30px_rgba(99,102,241,0.55)] hover:shadow-[0_0_40px_rgba(99,102,241,0.8)] transition-all group/btn">
                    <button
                      onClick={() => {
                        sounds.playLaunch();
                        onLaunch(currentHeroInstance);
                      }}
                      disabled={currentHeroInstance.isRunning || launchProgress !== null}
                      className="flex items-center space-x-3 px-7 py-3.5 rounded-l-2xl bg-transparent hover:bg-white/10 text-white font-display font-extrabold text-base tracking-wide transition-colors"
                    >
                      {currentHeroInstance.isRunning ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Playing {currentHeroInstance.name}</span>
                        </>
                      ) : launchProgress ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{launchProgress.step || 'Launching...'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-white" />
                          <span>Launch {currentHeroInstance.name}</span>
                        </>
                      )}
                    </button>

                    {/* Instance Selector Dropdown Trigger */}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setShowLaunchDropdown(!showLaunchDropdown);
                      }}
                      className="px-3.5 py-4 border-l border-white/20 hover:bg-white/15 rounded-r-2xl text-white transition-colors"
                      title="Select different instance"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onCreateInstance('create')}
                    className="flex items-center space-x-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-display font-extrabold text-base shadow-glow transition-transform hover:scale-102"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Instance</span>
                  </button>
                )}

                {/* Instance Quick Selector Dropdown Menu */}
                {showLaunchDropdown && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 max-h-64 overflow-y-auto custom-scrollbar bg-[#090d1f]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 shadow-2xl z-50 animate-smooth-in">
                    <div className="text-[11px] font-mono text-slate-400 px-3 py-1.5 font-bold uppercase tracking-wider">
                      Select Instance to Launch
                    </div>
                    {instances.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => {
                          sounds.playClick();
                          onSelectInstance(inst);
                          setShowLaunchDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                          selectedInstance?.id === inst.id
                            ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                          <span className="truncate">{inst.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {inst.version}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Right Live Clock & Date Widget */}
              <div className="px-5 py-2.5 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-3.5 shadow-xl">
                <div className="text-right">
                  <div className="text-[11px] font-medium text-slate-400">
                    {currentDateTime.date}
                  </div>
                  <div className="text-base font-mono font-extrabold text-white tracking-wide">
                    {currentDateTime.time}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center text-amber-400 border border-white/10">
                  <Sun className="w-4 h-4 animate-spin-slow" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 5-COLUMN STATS ROW (Pixel-perfect to reference) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Total Playtime */}
          <div className="p-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 transition-all flex items-center space-x-4 group">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xl font-mono font-extrabold text-white tracking-tight">
                {totalPlaytimeHours}h
              </div>
              <div className="text-[12px] font-medium text-slate-400">
                Total Playtime
              </div>
            </div>
          </div>

          {/* 2. Instances */}
          <div className="p-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 transition-all flex items-center space-x-4 group">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xl font-mono font-extrabold text-white tracking-tight">
                {instances.length || 4}
              </div>
              <div className="text-[12px] font-medium text-slate-400">
                Instances
              </div>
            </div>
          </div>

          {/* 3. Mods Installed */}
          <div className="p-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 transition-all flex items-center space-x-4 group">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Puzzle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xl font-mono font-extrabold text-white tracking-tight">
                {installedModsCount}
              </div>
              <div className="text-[12px] font-medium text-slate-400">
                Mods Installed
              </div>
            </div>
          </div>

          {/* 4. Achievements */}
          <div className="p-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/40 transition-all flex items-center space-x-4 group">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xl font-mono font-extrabold text-white tracking-tight">
                {achievementsRatio.unlocked} / {achievementsRatio.total}
              </div>
              <div className="text-[12px] font-medium text-slate-400">
                Achievements
              </div>
            </div>
          </div>

          {/* 5. Friends Online */}
          <div className="p-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 transition-all flex items-center space-x-4 group col-span-2 sm:col-span-1">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xl font-mono font-extrabold text-white tracking-tight">
                {friendsOnlineCount}
              </div>
              <div className="text-[12px] font-medium text-slate-400">
                Friends Online
              </div>
            </div>
          </div>
        </div>

        {/* 3. MAIN 2-COLUMN SECTION (Left: 8 cols, Right: 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* 3.1 Recent Instances (3 side-by-side cards matching reference) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gamepad2 className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-display font-bold text-white tracking-wide">
                    Recent Instances
                  </h2>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('instances')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 group"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {recentInstances.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentInstances.map((inst, idx) => {
                    const isSelected = selectedInstance?.id === inst.id;
                    const health = getInstanceHealthState(inst);

                    return (
                      <div
                        key={inst.id}
                        onClick={() => onSelectInstance(inst)}
                        className={`relative rounded-2xl overflow-hidden bg-[#0c1228]/85 backdrop-blur-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
                          isSelected
                            ? 'border-2 border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.45),inset_0_0_15px_rgba(56,189,248,0.1)] ring-1 ring-sky-300/40'
                            : 'border border-white/[0.08] hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                        }`}
                      >
                        {/* Top Landscape Preview Art */}
                        <div className="relative h-28 overflow-hidden">
                          <img
                            src={getInstanceBg(inst, idx)}
                            alt={inst.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-[#0c1228]/40 to-transparent" />

                          {/* Top-Right Favorite & Menu Buttons */}
                          <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10">
                            <button
                              onClick={(e) => handleToggleFavorite(inst, e)}
                              className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                                inst.isFavorite
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-black/40 hover:bg-black/70 text-slate-300 border border-white/10'
                              }`}
                              title={inst.isFavorite ? 'Unfavorite' : 'Favorite'}
                            >
                              <Star className={`w-3.5 h-3.5 ${inst.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenInstanceDetails(inst);
                              }}
                              className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-slate-300 border border-white/10 transition-colors"
                              title="Instance Settings"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-display font-bold text-white text-sm truncate group-hover:text-indigo-200 transition-colors">
                              {inst.name}
                            </h3>
                            <p className="text-[11.5px] text-slate-400 truncate mt-0.5">
                              {inst.description || 'My main survival world'}
                            </p>

                            {/* 3 Badges (Minecraft, Loader, Mods) */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/[0.08] flex items-center gap-1">
                                <Box className="w-2.5 h-2.5 text-indigo-400" />
                                <span>{inst.version}</span>
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 uppercase font-bold flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" />
                                <span>{inst.loader}</span>
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-400 flex items-center gap-1">
                                <Puzzle className="w-2.5 h-2.5 text-purple-400" />
                                <span>127 Mods</span>
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Health status & Play button */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
                            <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${health.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${health.status === 'healthy' ? 'bg-emerald-400' : health.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                              <span>{health.label}</span>
                              <ChevronRight className="w-3 h-3 opacity-60" />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playLaunch();
                                onLaunch(inst);
                              }}
                              disabled={inst.isRunning || launchProgress !== null}
                              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-glow-sm transition-all"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Play</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#0c1228]/60 border border-white/[0.08] text-center space-y-3">
                  <p className="text-sm text-slate-400">
                    No instances created yet.
                  </p>
                  <button
                    onClick={() => onCreateInstance('create')}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs shadow-glow"
                  >
                    + Create Instance
                  </button>
                </div>
              )}
            </div>

            {/* 3.2 Continue Playing Hero Card (Pixel-perfect to reference) */}
            {currentHeroInstance && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gamepad2 className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-display font-bold text-white tracking-wide">
                      Continue Playing
                    </h2>
                  </div>
                  <button
                    onClick={() => onOpenInstanceDetails(currentHeroInstance)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-white/[0.05]"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-2xl p-5 bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] flex flex-col md:flex-row items-center gap-6 group hover:border-indigo-500/30 transition-all shadow-xl">
                  {/* Left Landscape Thumbnail with Title */}
                  <div className="relative w-full md:w-56 h-32 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg">
                    <img
                      src={getInstanceBg(currentHeroInstance, 0)}
                      alt={currentHeroInstance.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228]/90 via-[#0c1228]/30 to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <div className="text-xs font-bold text-white truncate">{currentHeroInstance.name}</div>
                      <div className="text-[10px] text-slate-300 truncate">{currentHeroInstance.description || 'My main survival world'}</div>
                    </div>
                  </div>

                  {/* Center 2x2 Stats Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Last Played</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white">
                        {formatRelativeTime(currentHeroInstance.lastPlayed)}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        <span>Playtime</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white">
                        {formatPlaytimeHours(currentHeroInstance.playTimeMinutes || 5160)}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                        <span>World Size</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white">
                        2.4 GB
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Last Backup</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-white">
                        1 day ago
                      </div>
                    </div>
                  </div>

                  {/* Right: Big Play Button */}
                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => {
                        sounds.playLaunch();
                        onLaunch(currentHeroInstance);
                      }}
                      disabled={currentHeroInstance.isRunning || launchProgress !== null}
                      className="w-full md:w-auto flex items-center justify-center space-x-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-extrabold text-sm shadow-glow transition-transform hover:scale-102"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3.3 Quick Actions (2x3 Grid matching reference image) */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-display font-bold text-white tracking-wide">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {/* 1. Create Instance */}
                <button
                  onClick={() => onCreateInstance('create')}
                  className="p-4 rounded-2xl bg-[#0c1228]/80 hover:bg-[#111836] backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col items-center text-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-2">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-display font-bold text-white">Create Instance</span>
                </button>

                {/* 2. Import Instance */}
                <button
                  onClick={() => onCreateInstance('import')}
                  className="p-4 rounded-2xl bg-[#0c1228]/80 hover:bg-[#111836] backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 transition-all flex flex-col items-center text-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-2">
                    <FolderUp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-display font-bold text-white">Import Instance</span>
                </button>

                {/* 3. Browse Mods */}
                <button
                  onClick={() => onSelectTab && onSelectTab('marketplace')}
                  className="p-4 rounded-2xl bg-[#0c1228]/80 hover:bg-[#111836] backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 transition-all flex flex-col items-center text-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-2">
                    <Puzzle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-display font-bold text-white">Browse Mods</span>
                </button>

                {/* 4. Open Folder */}
                <button
                  onClick={() => currentHeroInstance && onOpenFolder(currentHeroInstance)}
                  className="p-4 rounded-2xl bg-[#0c1228]/80 hover:bg-[#111836] backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/40 transition-all flex flex-col items-center text-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-2">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-display font-bold text-white">Open Folder</span>
                </button>

                {/* 5. Backup World */}
                <button
                  onClick={() => onSelectTab && onSelectTab('cloud')}
                  className="p-4 rounded-2xl bg-[#0c1228]/80 hover:bg-[#111836] backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/40 transition-all flex flex-col items-center text-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-2">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-display font-bold text-white">Backup World</span>
                </button>

                {/* 6. Launcher Settings */}
                <button
                  onClick={() => onSelectTab && onSelectTab('settings')}
                  className="p-4 rounded-2xl bg-[#0c1228]/80 hover:bg-[#111836] backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col items-center text-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-2">
                    <SettingsIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-display font-bold text-white">Launcher Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* 3.4 Recent Activity (Timeline list matching reference) */}
            <div className="p-5 rounded-3xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-display font-bold text-white">
                    Recent Activity
                  </h3>
                </div>
                <button
                  onClick={() => onSelectTab && onSelectTab('social')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3.5">
                {/* 1. Played Galaxy SMP */}
                <div className="flex items-center space-x-3 group">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Box className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      Played {currentHeroInstance?.name || 'Galaxy SMP'}
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      2 hours ago
                    </div>
                  </div>
                </div>

                {/* 2. Unlocked achievement */}
                <div className="flex items-center space-x-3 group">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      Unlocked achievement "Biome Explorer"
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      5 hours ago
                    </div>
                  </div>
                </div>

                {/* 3. Installed Sodium */}
                <div className="flex items-center space-x-3 group">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      Installed Sodium
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      1 day ago
                    </div>
                  </div>
                </div>

                {/* 4. Changed cape */}
                <div className="flex items-center space-x-3 group">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      Changed cape to Galaxy Cape
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      1 day ago
                    </div>
                  </div>
                </div>

                {/* 5. Created new instance */}
                <div className="flex items-center space-x-3 group">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      Created new instance "Mod Testing"
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      2 days ago
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3.5 Featured Content Spotlight (Matching reference) */}
            <div className="p-5 rounded-3xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-display font-bold text-white">
                    Featured Content
                  </h3>
                </div>
                <button
                  onClick={() => onSelectTab && onSelectTab('marketplace')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Spotlight Banner Card */}
              <div className="relative rounded-2xl overflow-hidden border border-white/10 h-32 group">
                <img
                  src={bgNether}
                  alt="Better End"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-[#0c1228]/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <div className="text-sm font-display font-extrabold text-white">
                      Better End
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Transform the End dimension
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white opacity-70 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* 3 Mini Item Cards in a row */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* Sodium */}
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-bold text-white truncate">Sodium</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 truncate mt-0.5">Performance</span>
                  <button
                    onClick={() => onSelectTab && onSelectTab('marketplace')}
                    className="mt-2 w-full py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white flex items-center justify-center text-[10px] font-bold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>

                {/* Iris Shaders */}
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-[11px] font-bold text-white truncate">Iris</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 truncate mt-0.5">Shaders</span>
                  <button
                    onClick={() => onSelectTab && onSelectTab('marketplace')}
                    className="mt-2 w-full py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white flex items-center justify-center text-[10px] font-bold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>

                {/* Distant Horizons */}
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all flex flex-col justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-[11px] font-bold text-white truncate">Horizons</span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 truncate mt-0.5">World Gen</span>
                  <button
                    onClick={() => onSelectTab && onSelectTab('marketplace')}
                    className="mt-2 w-full py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white flex items-center justify-center text-[10px] font-bold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: INSTANCES VIEW (Tab === 'instances' matching media_1790255274723.jpg)
  // =========================================================================
  return (
    <div className="min-h-full p-6 space-y-6 select-none max-w-[1600px] mx-auto">
      {/* 1. HERO HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-48 md:h-52 group">
        <img
          src={bgPortalHero}
          alt="Instances Banner"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a18]/95 via-[#070a18]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a18]/90 via-transparent to-transparent" />

        <div className="relative h-full flex items-center justify-between p-8 z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight drop-shadow-md">
              Instances
            </h1>
            <p className="text-sm text-slate-300 font-medium mt-1">
              Manage all your Minecraft instances
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onCreateInstance('create');
            }}
            className="flex items-center space-x-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-display font-extrabold text-sm shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Instance</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & SORT BAR (Matching reference design) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left Filter Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              sounds.playClick();
              setInstanceFilterTab('all');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              instanceFilterTab === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm'
                : 'bg-[#0c1228]/80 text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            All ({instances.length})
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setInstanceFilterTab('favorites');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              instanceFilterTab === 'favorites'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm'
                : 'bg-[#0c1228]/80 text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Favorites ({favoritesCount})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setInstanceFilterTab('recent');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              instanceFilterTab === 'recent'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm'
                : 'bg-[#0c1228]/80 text-slate-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recent ({recentCount})</span>
          </button>
        </div>

        {/* Right Sort Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Sort by</span>
          <select
            value={instanceSortBy}
            onChange={(e) => {
              sounds.playClick();
              setInstanceSortBy(e.target.value as any);
            }}
            className="bg-[#0c1228]/90 text-xs text-slate-200 border border-white/10 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
          >
            <option value="lastPlayed">Last Played</option>
            <option value="name">Name</option>
            <option value="playtime">Playtime</option>
            <option value="version">Minecraft Version</option>
          </select>
        </div>
      </div>

      {/* 3. 2-COLUMN SPLIT: Left Card Grid (2 cols) & Right Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT: 2-COL INSTANCE CARDS GRID ================= */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInstances.map((inst, idx) => {
            const isSelected = selectedInstance?.id === inst.id;
            const health = getInstanceHealthState(inst);

            return (
              <div
                key={inst.id}
                onClick={() => onSelectInstance(inst)}
                className={`relative rounded-3xl overflow-hidden bg-[#0c1228]/85 backdrop-blur-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
                  isSelected
                    ? 'border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.5),inset_0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-300/50'
                    : 'border border-white/[0.08] hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                }`}
              >
                {/* Top Landscape Preview Art */}
                <div className="relative h-32 overflow-hidden m-2 mb-0 rounded-2xl border border-white/[0.08]">
                  <img
                    src={getInstanceBg(inst, idx)}
                    alt={inst.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-transparent to-transparent" />

                  {/* Top-Right Favorite & Pin Buttons */}
                  <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10">
                    <button
                      onClick={(e) => handleToggleFavorite(inst, e)}
                      className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                        inst.isFavorite
                          ? 'bg-amber-500/25 text-amber-400 border border-amber-500/40'
                          : 'bg-black/50 hover:bg-black/80 text-slate-300 border border-white/10'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${inst.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInstanceDetails(inst);
                      }}
                      className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-slate-300 border border-white/10"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Instance Info Row */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md">
                      <img
                        src={getInstanceBg(inst, idx)}
                        alt={inst.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-bold text-white text-base truncate group-hover:text-indigo-200 transition-colors">
                        {inst.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {inst.description || 'A lightweight enhanced experience'}
                      </p>

                      {/* 3 Info Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/[0.08] flex items-center gap-1">
                          <Box className="w-2.5 h-2.5 text-indigo-400" />
                          <span>{inst.version}</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 uppercase font-bold flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{inst.loader}</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-400 flex items-center gap-1">
                          <Puzzle className="w-2.5 h-2.5 text-purple-400" />
                          <span>32 Mods</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Controls Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${health.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${health.status === 'healthy' ? 'bg-emerald-400' : health.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                      <span>{health.label}</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playLaunch();
                          onLaunch(inst);
                        }}
                        disabled={inst.isRunning || launchProgress !== null}
                        className="flex items-center space-x-1.5 px-5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-glow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Play</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInstanceDetails(inst);
                        }}
                        className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Dashed Create New Instance Card (Matching reference) */}
          <div
            onClick={() => {
              sounds.playClick();
              onCreateInstance('create');
            }}
            className="rounded-3xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-[#0c1228]/40 hover:bg-[#0c1228]/70 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group transition-all min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] group-hover:bg-indigo-600/30 border border-white/10 group-hover:border-indigo-500/50 flex items-center justify-center text-slate-400 group-hover:text-white transition-all mb-3">
              <Plus className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="text-sm font-display font-bold text-white">
              Create New Instance
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Start a new adventure
            </div>
          </div>
        </div>

        {/* ================= RIGHT: SELECTED INSTANCE INSPECTOR PANEL ================= */}
        <div className="lg:col-span-4 sticky top-6">
          {selectedInstance ? (
            <div className="p-6 rounded-3xl bg-[#0c1228]/90 backdrop-blur-2xl border border-white/[0.1] shadow-2xl space-y-5">
              {/* Header Hero Art */}
              <div className="relative h-36 rounded-2xl overflow-hidden border border-white/10 group">
                <img
                  src={getInstanceBg(selectedInstance, 0)}
                  alt={selectedInstance.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-[#0c1228]/30 to-transparent" />

                {/* Top Action Buttons */}
                <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10">
                  <button
                    onClick={(e) => handleToggleFavorite(selectedInstance, e)}
                    className="p-1.5 rounded-lg bg-black/50 text-amber-400 border border-white/10"
                  >
                    <Star className={`w-4 h-4 ${selectedInstance.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                  <button
                    onClick={() => onOpenInstanceDetails(selectedInstance)}
                    className="p-1.5 rounded-lg bg-black/50 text-slate-300 border border-white/10"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Editable Name */}
              <div>
                <div className="flex items-center space-x-2">
                  {editingNameId === selectedInstance.id ? (
                    <input
                      type="text"
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onBlur={() => handleSaveRename(selectedInstance)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(selectedInstance)}
                      autoFocus
                      className="bg-white/10 border border-indigo-500 rounded-lg px-2 py-1 text-base font-bold text-white focus:outline-none w-full"
                    />
                  ) : (
                    <>
                      <h2 className="text-xl font-display font-extrabold text-white tracking-tight">
                        {selectedInstance.name}
                      </h2>
                      <button
                        onClick={() => {
                          setEditingNameId(selectedInstance.id);
                          setEditingNameValue(selectedInstance.name);
                        }}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedInstance.description || 'A long-term survival world with friends, custom mods and enhanced gameplay.'}
                </p>
              </div>

              {/* 2x3 Detailed Specs Grid (Exact match to reference) */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-black/30 border border-white/[0.06]">
                <div className="space-y-0.5">
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5">
                    <Box className="w-3 h-3 text-indigo-400" />
                    <span>Minecraft Version</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white">{selectedInstance.version}</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    <span>Loader</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white uppercase">{selectedInstance.loader}</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5">
                    <Puzzle className="w-3 h-3 text-purple-400" />
                    <span>Mods</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white">127 Mods</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3 h-3 text-emerald-400" />
                    <span>World Size</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white">2.4 GB</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Last Played</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white">{formatRelativeTime(selectedInstance.lastPlayed)}</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-rose-400" />
                    <span>Created On</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white">12 Aug 2026</div>
                </div>
              </div>

              {/* Health Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-emerald-300">Healthy</div>
                  <div className="text-[11px] text-emerald-400/80">Everything is working correctly</div>
                </div>
              </div>

              {/* Full Width Play Button */}
              <button
                onClick={() => {
                  sounds.playLaunch();
                  onLaunch(selectedInstance);
                }}
                disabled={selectedInstance.isRunning || launchProgress !== null}
                className="w-full flex items-center justify-center space-x-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-display font-extrabold text-sm shadow-glow transition-transform hover:scale-102"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play</span>
              </button>

              {/* 6 Action Items List (Matching reference) */}
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => onOpenInstanceDetails(selectedInstance)}
                  className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-indigo-400" />
                  <span>Edit Instance</span>
                </button>

                <button
                  onClick={() => onOpenInstanceDetails(selectedInstance)}
                  className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Puzzle className="w-4 h-4 text-purple-400" />
                  <span>Manage Mods</span>
                </button>

                <button
                  onClick={() => onOpenFolder(selectedInstance)}
                  className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-slate-200 transition-colors"
                >
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  <span>Open Folder</span>
                </button>

                <button
                  onClick={() => onSelectTab && onSelectTab('cloud')}
                  className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span>Backup World</span>
                </button>

                <button
                  onClick={() => setCloneModalInstance(selectedInstance)}
                  className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-white/[0.06] text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Duplicate Instance</span>
                </button>

                <button
                  onClick={() => setDeleteConfirmInstance(selectedInstance)}
                  className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl hover:bg-rose-500/10 text-xs font-semibold text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Delete Instance</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#0c1228]/60 border border-white/[0.08] text-center text-slate-400">
              Select an instance to view specs & actions
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmInstance && (
        <ConfirmModal
          isOpen={true}
          title={`Delete "${deleteConfirmInstance.name}"?`}
          description="This action is permanent and cannot be undone. All worlds, mods, and instance files will be deleted from your device."
          confirmText="Delete Instance"
          type="danger"
          onConfirm={async () => {
            if (onDeleteInstance) {
              await onDeleteInstance(deleteConfirmInstance.id);
            }
            setDeleteConfirmInstance(null);
          }}
          onClose={() => setDeleteConfirmInstance(null)}
        />
      )}

      {/* Clone Instance Modal */}
      {cloneModalInstance && (
        <CloneInstanceModal
          instance={cloneModalInstance}
          isOpen={true}
          onClose={() => setCloneModalInstance(null)}
          onClone={async (instId, opts) => {
            if (onCloneInstance) {
              await onCloneInstance(instId, opts);
            }
            setCloneModalInstance(null);
          }}
        />
      )}
    </div>
  );
};
