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
  CheckSquare
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
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function formatPlaytimeMinutes(minutes = 0): string {
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours === 0) return `${remMinutes}m`;
  return `${hours}h ${remMinutes > 0 ? `${remMinutes}m` : ''}`;
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
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dropdowns & Modals State
  const [showLaunchDropdown, setShowLaunchDropdown] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [instanceToClone, setInstanceToClone] = useState<Instance | null>(null);

  // Instances Page Filter & Sort State
  const [instanceFilterTab, setInstanceFilterTab] = useState<'all' | 'favorites' | 'recent'>('all');
  const [instanceSortBy, setInstanceSortBy] = useState<'lastPlayed' | 'name' | 'playtime' | 'version'>('lastPlayed');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Social & Achievements Counts State
  const [friendsOnlineCount, setFriendsOnlineCount] = useState<number>(0);
  const [achievementsRatio, setAchievementsRatio] = useState({ unlocked: 0, total: 25 });

  // Load dynamic auxiliary data on mount
  useEffect(() => {
    const loadDynamicLauncherData = async () => {
      try {
        if (window.galaxy?.getFriends) {
          const friends = await window.galaxy.getFriends();
          const online = friends.filter((f: any) => f.status === 'online' || f.status === 'in-game').length;
          setFriendsOnlineCount(online);
        }
        if (window.galaxy?.getAchievements) {
          const achs = await window.galaxy.getAchievements();
          const unlocked = achs.filter((a: any) => a.unlocked).length;
          setAchievementsRatio({ unlocked, total: Math.max(achs.length, 25) });
        }
      } catch (e) {
        console.warn('Could not fetch auxiliary stats:', e);
      }
    };
    loadDynamicLauncherData();
  }, [instances]);

  // Aggregate stats
  const totalPlaytimeHours = useMemo(() => {
    const totalMins = instances.reduce((acc, inst) => acc + (inst.playTimeMinutes || 0), 0);
    return Math.floor(totalMins / 60);
  }, [instances]);

  // Target instance for Hero action
  const currentHeroInstance = selectedInstance || instances[0] || null;

  // Recent instances for Home
  const recentInstances = useMemo(() => {
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

  const handleToggleFavorite = async (inst: Instance, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    if (onUpdateInstance) {
      await onUpdateInstance({ ...inst, isFavorite: !inst.isFavorite });
    }
  };

  const handleStartRename = (inst: Instance, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNameId(inst.id);
    setEditingNameValue(inst.name);
  };

  // -------------------------------------------------------------
  // RENDER: HOME VIEW
  // -------------------------------------------------------------
  if (activeTab === 'home') {
    return (
      <div className="min-h-full p-6 space-y-6 select-none max-w-7xl mx-auto">
        {/* 1. PANORAMIC HERO BANNER */}
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-72 md:h-80 group">
          <img
            src={bgPortalHero}
            alt="Hero Banner"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-galaxy-950/95 via-galaxy-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950/90 via-transparent to-transparent" />

          {/* Top Right Quote */}
          <div className="absolute top-5 right-6 text-right hidden sm:block">
            <p className="text-xs font-display font-medium text-slate-300/80 italic tracking-wider">
              "Same Game Infinite Worlds"
            </p>
          </div>

          {/* Hero Content (Left) */}
          <div className="relative h-full flex flex-col justify-between p-8 z-10">
            <div>
              <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-indigo-300 uppercase block mb-1.5 drop-shadow">
                G A L A X Y &nbsp; L A U N C H E R
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight flex items-center gap-2 drop-shadow-md">
                Welcome back, {activeAccount?.username || 'Explorer'}
                <Sparkles className="w-6 h-6 text-purple-400 animate-pulse inline-block" />
              </h1>
              <p className="text-sm text-slate-300/90 font-medium mt-1 max-w-lg">
                Launch, play, manage and explore your Minecraft journey.
              </p>
            </div>

            {/* Launch Action & Live Clock */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              {/* Big Launch Button with Dropdown */}
              <div className="relative flex items-center">
                {currentHeroInstance ? (
                  <div className="flex items-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-[0_0_25px_rgba(99,102,241,0.5)] hover:shadow-[0_0_35px_rgba(99,102,241,0.7)] transition-all group/btn">
                    <button
                      onClick={() => {
                        sounds.playLaunch();
                        onLaunch(currentHeroInstance);
                      }}
                      disabled={currentHeroInstance.isRunning || launchProgress !== null}
                      className="flex items-center space-x-3 px-6 py-3 rounded-l-2xl bg-transparent hover:bg-white/10 text-white font-display font-bold text-base transition-colors"
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
                      className="px-3.5 py-3.5 border-l border-white/20 hover:bg-white/15 rounded-r-2xl text-white transition-colors"
                      title="Select different instance"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onCreateInstance('create')}
                    className="flex items-center space-x-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-display font-bold text-base shadow-glow transition-transform hover:scale-102"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Your First Instance</span>
                  </button>
                )}

                {/* Instance Quick Selector Dropdown Menu */}
                {showLaunchDropdown && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 max-h-64 overflow-y-auto custom-scrollbar bg-galaxy-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2 shadow-2xl z-50 animate-smooth-in">
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

              {/* Bottom Right Live Clock & Weather Widget */}
              <div className="px-4 py-2 rounded-2xl bg-galaxy-950/70 backdrop-blur-xl border border-white/10 flex items-center space-x-3 shadow-lg">
                <div className="text-right">
                  <div className="text-[11px] font-medium text-slate-400">
                    {currentDateTime.date}
                  </div>
                  <div className="text-sm font-mono font-bold text-white tracking-wide">
                    {currentDateTime.time}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center text-amber-400">
                  <Sun className="w-4 h-4 animate-spin-slow" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 5-COLUMN STATS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Total Playtime */}
          <div className="p-4 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 transition-all flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-mono font-extrabold text-white">
                {totalPlaytimeHours}h
              </div>
              <div className="text-[11.5px] font-medium text-slate-400">
                Total Playtime
              </div>
            </div>
          </div>

          {/* Instances */}
          <div className="p-4 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 transition-all flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-mono font-extrabold text-white">
                {instances.length}
              </div>
              <div className="text-[11.5px] font-medium text-slate-400">
                Instances
              </div>
            </div>
          </div>

          {/* Mods / Addons */}
          <div className="p-4 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 transition-all flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-mono font-extrabold text-white">
                {instances.reduce((acc, inst) => acc + (inst.launchCount || 0), 0)}
              </div>
              <div className="text-[11.5px] font-medium text-slate-400">
                Total Launches
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="p-4 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/40 transition-all flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-mono font-extrabold text-white">
                {achievementsRatio.unlocked} / {achievementsRatio.total}
              </div>
              <div className="text-[11.5px] font-medium text-slate-400">
                Achievements
              </div>
            </div>
          </div>

          {/* Friends Online */}
          <div className="p-4 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/40 transition-all flex items-center space-x-3.5 group col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-mono font-extrabold text-white">
                {friendsOnlineCount}
              </div>
              <div className="text-[11.5px] font-medium text-slate-400">
                Friends Online
              </div>
            </div>
          </div>
        </div>

        {/* 3. MAIN 2-COLUMN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN (~65% -> 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 3.1 Recent Instances */}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {recentInstances.map((inst, idx) => (
                    <div
                      key={inst.id}
                      onClick={() => onSelectInstance(inst)}
                      className={`relative rounded-2xl overflow-hidden bg-galaxy-950/60 backdrop-blur-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                        selectedInstance?.id === inst.id
                          ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                          : 'border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      {/* Top Thumbnail */}
                      <div className="relative h-24 overflow-hidden">
                        <img
                          src={getInstanceBg(inst, idx)}
                          alt={inst.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950 via-galaxy-950/40 to-transparent" />

                        {/* Top Actions */}
                        <div className="absolute top-2 right-2 flex items-center space-x-1.5">
                          <button
                            onClick={(e) => handleToggleFavorite(inst, e)}
                            className="p-1 rounded-md bg-galaxy-950/70 hover:bg-galaxy-950 text-slate-300 hover:text-amber-400 transition-colors"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                inst.isFavorite
                                  ? 'fill-amber-400 text-amber-400'
                                  : ''
                              }`}
                            />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInstanceDetails(inst);
                            }}
                            className="p-1 rounded-md bg-galaxy-950/70 hover:bg-galaxy-950 text-slate-300 hover:text-white transition-colors"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display font-bold text-white text-xs truncate">
                            {inst.name}
                          </h3>
                          <p className="text-[11px] text-slate-400 truncate">
                            {inst.description || 'Custom Minecraft Instance'}
                          </p>

                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                              {inst.version}
                            </span>
                            <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 uppercase font-bold">
                              {inst.loader}
                            </span>
                            <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                              {(inst.memoryMax / 1024).toFixed(0)} GB RAM
                            </span>
                          </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                          <div className="flex items-center space-x-1 text-[10.5px] text-emerald-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Healthy</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playLaunch();
                              onLaunch(inst);
                            }}
                            disabled={inst.isRunning || launchProgress !== null}
                            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm transition-all"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>Play</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-galaxy-950/40 border border-white/[0.08] text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    No instances created yet.
                  </p>
                  <button
                    onClick={() => onCreateInstance('create')}
                    className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold"
                  >
                    + Create Instance
                  </button>
                </div>
              )}
            </div>

            {/* 3.2 Continue Playing Hero Card */}
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
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-2xl p-4 bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] flex flex-col md:flex-row items-center gap-5 group">
                  {/* Left Landscape Thumbnail */}
                  <div className="relative w-full md:w-48 h-28 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img
                      src={getInstanceBg(currentHeroInstance, 0)}
                      alt={currentHeroInstance.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950/80 via-transparent to-transparent" />
                  </div>

                  {/* Mid Specs */}
                  <div className="flex-1 space-y-2 w-full">
                    <div>
                      <h3 className="font-display font-bold text-white text-base">
                        {currentHeroInstance.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {currentHeroInstance.description || 'Main survival world'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.08] text-slate-300">
                        {currentHeroInstance.version}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase font-bold">
                        {currentHeroInstance.loader}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.08] text-slate-400">
                        {(currentHeroInstance.memoryMax / 1024).toFixed(0)} GB RAM
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Healthy</span>
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playLaunch();
                        onLaunch(currentHeroInstance);
                      }}
                      disabled={currentHeroInstance.isRunning || launchProgress !== null}
                      className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-glow-sm transition-transform hover:scale-102 mt-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Play</span>
                    </button>
                  </div>

                  {/* Right Metadata Column */}
                  <div className="w-full md:w-44 space-y-1.5 border-t md:border-t-0 md:border-l border-white/[0.08] pt-3 md:pt-0 md:pl-4 text-[11px] text-slate-400 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Last Played</span>
                      </span>
                      <span className="text-slate-200 font-medium">
                        {formatRelativeTime(currentHeroInstance.lastPlayed)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Activity className="w-3 h-3 text-slate-500" />
                        <span>Playtime</span>
                      </span>
                      <span className="text-slate-200 font-mono font-medium">
                        {formatPlaytimeMinutes(currentHeroInstance.playTimeMinutes)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>Max RAM</span>
                      </span>
                      <span className="text-slate-200 font-mono font-medium">
                        {(currentHeroInstance.memoryMax / 1024).toFixed(0)} GB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Cloud className="w-3 h-3 text-slate-500" />
                        <span>Last Backup</span>
                      </span>
                      <span className="text-slate-200 font-medium">
                        Synced
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3.3 Quick Actions (2x3 Grid) */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-display font-bold text-white tracking-wide">
                  Quick Actions
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. Create Instance */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    onCreateInstance('create');
                  }}
                  className="p-3.5 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/50 hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center space-y-2 text-center group"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Create Instance
                  </span>
                </button>

                {/* 2. Import Instance */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    onCreateInstance('import');
                  }}
                  className="p-3.5 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/50 hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center space-y-2 text-center group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Import Instance
                  </span>
                </button>

                {/* 3. Browse Mods */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (onNavigateToMarketplace) onNavigateToMarketplace('mod');
                    else if (onSelectTab) onSelectTab('marketplace');
                  }}
                  className="p-3.5 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/50 hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center space-y-2 text-center group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Browse Mods
                  </span>
                </button>

                {/* 4. Open Folder */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (currentHeroInstance) onOpenFolder(currentHeroInstance);
                  }}
                  className="p-3.5 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/50 hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center space-y-2 text-center group"
                >
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Open Folder
                  </span>
                </button>

                {/* 5. Backup World */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (onSelectTab) onSelectTab('cloud');
                  }}
                  className="p-3.5 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-emerald-500/50 hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center space-y-2 text-center group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Backup World
                  </span>
                </button>

                {/* 6. Launcher Settings */}
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (onSelectTab) onSelectTab('settings');
                  }}
                  className="p-3.5 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-slate-400 hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center space-y-2 text-center group"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-500/15 border border-slate-500/30 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
                    <SettingsIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                    Launcher Settings
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (~35% -> 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* 3.4 Recent Activity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-display font-bold text-white tracking-wide">
                    Recent Activity
                  </h2>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('social')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 group"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              <div className="rounded-2xl p-4 bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] space-y-3">
                {currentHeroInstance ? (
                  <>
                    <div className="flex items-start space-x-3 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Gamepad2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">
                          Played {currentHeroInstance.name}
                        </p>
                        <p className="text-[10px] text-slate-500">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">
                          Unlocked achievement "Explorer"
                        </p>
                        <p className="text-[10px] text-slate-500">5 hours ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">
                          Installed Sodium Optimization
                        </p>
                        <p className="text-[10px] text-slate-500">1 day ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">
                          Updated player skin & cosmetics
                        </p>
                        <p className="text-[10px] text-slate-500">1 day ago</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Boxes className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">
                          Created instance "{currentHeroInstance.name}"
                        </p>
                        <p className="text-[10px] text-slate-500">2 days ago</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No recent activity logged yet.
                  </div>
                )}
              </div>
            </div>

            {/* 3.5 Featured Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-display font-bold text-white tracking-wide">
                    Featured Content
                  </h2>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab('marketplace')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 group"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              <div className="rounded-2xl p-4 bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] space-y-4">
                {/* Spotlight Banner */}
                <div className="relative rounded-xl overflow-hidden h-28 border border-white/10 group">
                  <img
                    src={bgNether}
                    alt="Better End"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-galaxy-950 via-galaxy-950/50 to-transparent" />
                  <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-display font-bold text-white">
                        Better End
                      </h4>
                      <p className="text-[10.5px] text-slate-300/80">
                        Transform the End dimension
                      </p>
                    </div>
                    {/* Pagination Dots */}
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    </div>
                  </div>
                </div>

                {/* Mini Mod Download Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => {
                      if (onNavigateToMarketplace) onNavigateToMarketplace('mod');
                    }}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-center cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-white truncate">
                      Sodium
                    </div>
                    <div className="text-[9.5px] text-slate-400 truncate">
                      Performance
                    </div>
                    <button className="w-full mt-1.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 flex items-center justify-center">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>

                  <div
                    onClick={() => {
                      if (onNavigateToMarketplace) onNavigateToMarketplace('shader');
                    }}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-center cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-white truncate">
                      Iris Shaders
                    </div>
                    <div className="text-[9.5px] text-slate-400 truncate">
                      Visuals
                    </div>
                    <button className="w-full mt-1.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 flex items-center justify-center">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>

                  <div
                    onClick={() => {
                      if (onNavigateToMarketplace) onNavigateToMarketplace('mod');
                    }}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-center cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-white truncate">
                      Distant Gen
                    </div>
                    <div className="text-[9.5px] text-slate-400 truncate">
                      World Gen
                    </div>
                    <button className="w-full mt-1.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 flex items-center justify-center">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: INSTANCES VIEW
  // -------------------------------------------------------------
  const inspectorInstance = selectedInstance || instances[0] || null;

  return (
    <div className="min-h-full p-6 space-y-6 select-none max-w-7xl mx-auto">
      {/* 1. PANORAMIC INSTANCES HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-44 group">
        <img
          src={bgPortalHero}
          alt="Instances Banner"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-galaxy-950/95 via-galaxy-950/65 to-transparent" />
        <div className="relative h-full flex items-center justify-between p-8 z-10">
          <div>
            <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
              Instances
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Manage all your Minecraft instances
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onCreateInstance('create');
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-glow transition-transform hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>Create Instance</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & SORT CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Filter Tabs */}
        <div className="flex items-center space-x-2 bg-galaxy-950/60 backdrop-blur-xl p-1 rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => {
              sounds.playSwitch();
              setInstanceFilterTab('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              instanceFilterTab === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({instances.length})
          </button>
          <button
            onClick={() => {
              sounds.playSwitch();
              setInstanceFilterTab('favorites');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              instanceFilterTab === 'favorites'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Favorites ({instances.filter((i) => i.isFavorite).length})</span>
          </button>
          <button
            onClick={() => {
              sounds.playSwitch();
              setInstanceFilterTab('recent');
            }}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              instanceFilterTab === 'recent'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recent ({instances.filter((i) => i.lastPlayed).length})</span>
          </button>
        </div>

        {/* Right Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <span className="text-slate-500">Sort by</span>
            <span className="font-semibold text-slate-200 capitalize">
              {instanceSortBy === 'lastPlayed'
                ? 'Last Played'
                : instanceSortBy === 'name'
                ? 'Name'
                : instanceSortBy === 'playtime'
                ? 'Playtime'
                : 'Version'}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {sortDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-galaxy-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50">
              <button
                onClick={() => {
                  setInstanceSortBy('lastPlayed');
                  setSortDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white rounded-xl"
              >
                Last Played
              </button>
              <button
                onClick={() => {
                  setInstanceSortBy('name');
                  setSortDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white rounded-xl"
              >
                Name (A-Z)
              </button>
              <button
                onClick={() => {
                  setInstanceSortBy('playtime');
                  setSortDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white rounded-xl"
              >
                Total Playtime
              </button>
              <button
                onClick={() => {
                  setInstanceSortBy('version');
                  setSortDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 hover:text-white rounded-xl"
              >
                Minecraft Version
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. 2-COLUMN INSTANCES LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDE: INSTANCE CARDS GRID (~65% -> 8 cols) */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredInstances.map((inst, idx) => {
              const isSelected = selectedInstance?.id === inst.id;
              return (
                <div
                  key={inst.id}
                  onClick={() => onSelectInstance(inst)}
                  className={`relative rounded-2xl overflow-hidden bg-galaxy-950/60 backdrop-blur-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {/* Top Banner Artwork */}
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={getInstanceBg(inst, idx)}
                      alt={inst.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950 via-galaxy-950/40 to-transparent" />

                    {/* Top Icons */}
                    <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5">
                      <button
                        onClick={(e) => handleToggleFavorite(inst, e)}
                        className="p-1.5 rounded-lg bg-galaxy-950/70 hover:bg-galaxy-950 text-slate-300 hover:text-amber-400 transition-colors"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            inst.isFavorite
                              ? 'fill-amber-400 text-amber-400'
                              : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInstanceDetails(inst);
                        }}
                        className="p-1.5 rounded-lg bg-galaxy-950/70 hover:bg-galaxy-950 text-slate-300 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-white text-sm truncate">
                        {inst.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {inst.description || 'Custom Minecraft instance'}
                      </p>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                          {inst.version}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 uppercase font-bold">
                          {inst.loader}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">
                          {(inst.memoryMax / 1024).toFixed(0)} GB RAM
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Healthy</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playLaunch();
                            onLaunch(inst);
                          }}
                          disabled={inst.isRunning || launchProgress !== null}
                          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInstanceDetails(inst);
                          }}
                          className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Create New Instance Card Placeholder */}
            <div
              onClick={() => {
                sounds.playClick();
                onCreateInstance('create');
              }}
              className="rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-galaxy-950/30 hover:bg-white/[0.03] transition-all p-6 flex flex-col items-center justify-center space-y-2 cursor-pointer text-center min-h-[200px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] group-hover:bg-indigo-600/20 border border-white/10 group-hover:border-indigo-500/30 flex items-center justify-center text-slate-400 group-hover:text-indigo-300 group-hover:scale-110 transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <div className="font-display font-bold text-sm text-slate-300 group-hover:text-white">
                Create New Instance
              </div>
              <div className="text-xs text-slate-500">
                Start a new adventure
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: SELECTED INSTANCE INSPECTOR SIDEBAR (~35% -> 4 cols) */}
        <div className="lg:col-span-4">
          {inspectorInstance ? (
            <div className="sticky top-20 rounded-3xl overflow-hidden bg-galaxy-950/70 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-5 space-y-5">
              {/* Inspector Top Banner */}
              <div className="relative h-32 rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={getInstanceBg(inspectorInstance, 0)}
                  alt={inspectorInstance.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950 via-transparent to-transparent" />
                <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5">
                  <button
                    onClick={(e) => handleToggleFavorite(inspectorInstance, e)}
                    className="p-1.5 rounded-lg bg-galaxy-950/70 hover:bg-galaxy-950 text-slate-300 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        inspectorInstance.isFavorite
                          ? 'fill-amber-400 text-amber-400'
                          : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => onOpenInstanceDetails(inspectorInstance)}
                    className="p-1.5 rounded-lg bg-galaxy-950/70 hover:bg-galaxy-950 text-slate-300 hover:text-white transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Description with Edit Pencil */}
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-display font-extrabold text-white truncate">
                    {inspectorInstance.name}
                  </h2>
                  <button
                    onClick={(e) => handleStartRename(inspectorInstance, e)}
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {inspectorInstance.description || 'A long-term survival world with friends.'}
                </p>
              </div>

              {/* 2x3 Spec Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs">
                <div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Minecraft Version
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {inspectorInstance.version}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Loader
                  </span>
                  <span className="font-mono font-bold text-indigo-300 uppercase">
                    {inspectorInstance.loader}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Allocated RAM
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {(inspectorInstance.memoryMax / 1024).toFixed(0)} GB
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 block">
                    World Size
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    2.4 GB
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Last Played
                  </span>
                  <span className="font-medium text-slate-200">
                    {formatRelativeTime(inspectorInstance.lastPlayed)}
                  </span>
                </div>
                <div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Created On
                  </span>
                  <span className="font-medium text-slate-200">
                    {new Date(inspectorInstance.createdAt || Date.now()).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Health Diagnostic Box */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    Healthy
                  </div>
                  <div className="text-[10.5px] text-emerald-400/80">
                    Everything is working correctly
                  </div>
                </div>
              </div>

              {/* Full-width Large Play Button */}
              <button
                onClick={() => {
                  sounds.playLaunch();
                  onLaunch(inspectorInstance);
                }}
                disabled={inspectorInstance.isRunning || launchProgress !== null}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-display font-bold text-sm shadow-glow flex items-center justify-center space-x-2 transition-transform hover:scale-102"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play</span>
              </button>

              {/* Vertical Action Menu List */}
              <div className="space-y-1 pt-1 border-t border-white/[0.08]">
                <button
                  onClick={() => onOpenInstanceDetails(inspectorInstance)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit Instance</span>
                </button>
                <button
                  onClick={() => onOpenInstanceDetails(inspectorInstance)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manage Mods</span>
                </button>
                <button
                  onClick={() => onOpenFolder(inspectorInstance)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>Open Folder</span>
                </button>
                <button
                  onClick={() => onSelectTab && onSelectTab('cloud')}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  <span>Backup World</span>
                </button>
                <button
                  onClick={() => setInstanceToClone(inspectorInstance)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duplicate Instance</span>
                </button>
                <button
                  onClick={() => setInstanceToDelete(inspectorInstance)}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Instance</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-galaxy-950/40 border border-white/[0.08] text-center text-xs text-slate-400">
              Select an instance to view details.
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {instanceToDelete && (
        <ConfirmModal
          isOpen={true}
          title={`Delete "${instanceToDelete.name}"?`}
          description="Are you sure you want to delete this instance? All world saves, mods, and configuration files in this instance will be permanently removed."
          confirmText="Delete Instance"
          cancelText="Cancel"
          type="danger"
          onConfirm={() => {
            if (onDeleteInstance) onDeleteInstance(instanceToDelete.id);
            setInstanceToDelete(null);
          }}
          onClose={() => setInstanceToDelete(null)}
        />
      )}

      {/* Clone Modal */}
      {instanceToClone && onCloneInstance && (
        <CloneInstanceModal
          isOpen={true}
          instance={instanceToClone}
          onClose={() => setInstanceToClone(null)}
          onClone={async (id, options) => {
            await onCloneInstance(id, options);
            setInstanceToClone(null);
          }}
        />
      )}
    </div>
  );
};
