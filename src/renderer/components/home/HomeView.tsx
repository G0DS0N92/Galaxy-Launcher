import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Flame,
  CheckCircle2,
  RefreshCw,
  Palette,
  Search,
  SlidersHorizontal,
  Clock,
  LayoutGrid,
  List,
  Boxes,
  ArrowUpDown,
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
  Eye,
  Star,
  Trash2,
  Trophy,
  Cloud,
  Shield,
  Award,
  ChevronsDown,
  ChevronUp,
  UserCheck,
  Server,
  Rocket,
  Camera,
  Share2,
  Copy,
  Stethoscope,
  Package,
  MoreVertical,
  MoreHorizontal
} from 'lucide-react';
import { Instance, Account, LaunchProgress, Mod, Achievement, AchievementStats, CloneInstanceOptions } from '../../types';
import { sounds } from '../../services/soundEngine';
import { InstanceIconRenderer, IconEditorModal } from '../instances/instanceIcons';
import { ConfirmModal } from '../common/ConfirmModal';
import { ShareInstanceModal } from '../instances/ShareInstanceModal';
import { CloneInstanceModal } from '../instances/CloneInstanceModal';
import { InstanceHealthModal } from '../instances/InstanceHealthModal';
import { TabType } from '../layout/Sidebar';

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
  const [editingIconInstance, setEditingIconInstance] = useState<Instance | null>(null);
  const [deletingInstance, setDeletingInstance] = useState<Instance | null>(null);
  const [sharingInstance, setSharingInstance] = useState<Instance | null>(null);
  const [cloningInstance, setCloningInstance] = useState<Instance | null>(null);
  const [healthCheckingInstance, setHealthCheckingInstance] = useState<Instance | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // Instances tab search & filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLoaderFilter, setSelectedLoaderFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'loader' | 'version'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [installedMods, setInstalledMods] = useState<Mod[]>([]);
  const [instanceDropdownOpen, setInstanceDropdownOpen] = useState(false);
  const [instanceModCounts, setInstanceModCounts] = useState<Record<string, number>>({});
  const [activeMenuInstanceId, setActiveMenuInstanceId] = useState<string | null>(null);

  // Quick Launch & Wheel Navigation state
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchModalSearch, setLaunchModalSearch] = useState('');
  const lastWheelTimeRef = useRef<number>(0);

  const isLaunching = launchProgress && selectedInstance && launchProgress.instanceId === selectedInstance.id;
  const isRunning = selectedInstance?.isRunning;

  // Load installed mods for all instances to show live accurate mod counts
  useEffect(() => {
    if (window.galaxy?.getMods && instances.length > 0) {
      let isMounted = true;
      Promise.all(
        instances.map(async (inst) => {
          try {
            const m = await window.galaxy.getMods(inst.id);
            return { id: inst.id, count: m?.length || 0 };
          } catch {
            return { id: inst.id, count: 0 };
          }
        })
      ).then((results) => {
        if (!isMounted) return;
        const counts: Record<string, number> = {};
        results.forEach((r) => {
          counts[r.id] = r.count;
        });
        setInstanceModCounts(counts);
      });
      return () => {
        isMounted = false;
      };
    }
  }, [instances]);

  // Close card context dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuInstanceId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Load installed mods for active selected instance
  useEffect(() => {
    if (selectedInstance && window.galaxy?.getMods) {
      window.galaxy.getMods(selectedInstance.id).then((m) => {
        setInstalledMods(m || []);
      }).catch(() => {});
    }
  }, [selectedInstance?.id]);

  // Quick Launch Handler (Triggered on Scroll Up in Play Tab)
  const handleQuickLaunch = () => {
    if (instances.length === 0) {
      sounds.playClick();
      onCreateInstance();
      return;
    }

    if (instances.length === 1) {
      const inst = instances[0];
      if (inst.isRunning) {
        sounds.playSwitch();
        onShowToast?.({
          type: 'info',
          title: `"${inst.name}" is already running`
        });
        return;
      }
      if (isLaunching) return;
      sounds.playLaunch();
      onLaunch(inst);
      onShowToast?.({
        type: 'success',
        title: `Launching ${inst.name}...`,
        message: `Minecraft ${inst.version} (${inst.loader.toUpperCase()})`
      });
      return;
    }

    // Multiple instances present -> open selection prompt window
    sounds.playSwitch();
    setShowLaunchModal(true);
    setLaunchModalSearch('');
  };

  // Wheel Gesture Navigation for Play Page
  const handlePlayPageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 400) return;

    // Scroll Down -> Navigate to real Instances tab
    if (e.deltaY > 35) {
      lastWheelTimeRef.current = now;
      sounds.playSwitch();
      onSelectTab?.('instances');
    }
    // Scroll Up -> Quick Launch / Open Selection Prompt
    else if (e.deltaY < -35) {
      lastWheelTimeRef.current = now;
      handleQuickLaunch();
    }
  };

  // Wheel Gesture Navigation for Instances Tab
  const handleInstancesWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 400) return;

    // If scrolled at the very top and scrolling up -> return to Play
    if (container.scrollTop <= 0 && e.deltaY < -40) {
      lastWheelTimeRef.current = now;
      sounds.playSwitch();
      onSelectTab?.('home');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingInstance || !onDeleteInstance) return;
    setIsDeletingLoading(true);
    try {
      await onDeleteInstance(deletingInstance.id);
      setDeletingInstance(null);
    } catch (err: any) {
      onShowToast?.({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete instance from disk.'
      });
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const getLoaderColor = (loader?: string) => {
    const l = (loader || 'vanilla').toLowerCase();
    switch (l) {
      case 'fabric':
        return 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30';
      case 'forge':
        return 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30';
      case 'neoforge':
        return 'from-orange-500/20 to-red-500/20 text-orange-300 border-orange-500/30';
      case 'quilt':
        return 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  const formatPlaytimeShort = (mins?: number) => {
    if (!mins || mins === 0) return '0m played';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {
      return `${h}h ${m > 0 ? `${m}m` : ''} played`.trim();
    }
    return `${m}m played`;
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const timestamp = new Date(dateStr).getTime();
    if (isNaN(timestamp) || timestamp === 0) return 'Never';
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const getInstanceHealth = (inst: Instance): { status: 'healthy' | 'warning' | 'critical'; label: string } => {
    if (inst.memoryMax && inst.memoryMax < 1024) {
      return { status: 'critical', label: 'Critical' };
    }
    if (inst.loader !== 'vanilla' && inst.memoryMax && inst.memoryMax < 2048) {
      return { status: 'warning', label: 'Low RAM' };
    }
    return { status: 'healthy', label: 'Healthy' };
  };

  const handleSaveIcon = async (icon: string, background: string) => {
    if (!editingIconInstance) return;
    const updated: Instance = {
      ...editingIconInstance,
      icon,
      iconBackground: background
    };
    if (onUpdateInstance) {
      await onUpdateInstance(updated);
    }
    setEditingIconInstance(null);
  };

  // Safe Filtering & Sorting for Instances Tab
  const filteredAndSortedInstances = instances
    .filter((i) => {
      if (!i) return false;
      const name = (i.name || '').toLowerCase();
      const ver = (i.version || '').toLowerCase();
      const ldr = (i.loader || '').toLowerCase();
      const q = searchFilter.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || ver.includes(q) || ldr.includes(q);
      const matchesLoader = selectedLoaderFilter === 'all' || ldr === selectedLoaderFilter.toLowerCase();

      return matchesSearch && matchesLoader;
    })
    .sort((a, b) => {
      // Prioritize pinned favorites
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'loader') {
        return (a.loader || '').localeCompare(b.loader || '');
      }
      if (sortBy === 'version') {
        return (b.version || '').localeCompare(a.version || '');
      }
      const timeA = a.lastPlayed ? new Date(a.lastPlayed).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.lastPlayed ? new Date(b.lastPlayed).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

  // Loader counts
  const loaderCounts = {
    all: instances.length,
    fabric: instances.filter((i) => (i?.loader || '').toLowerCase() === 'fabric').length,
    forge: instances.filter((i) => (i?.loader || '').toLowerCase() === 'forge').length,
    neoforge: instances.filter((i) => (i?.loader || '').toLowerCase() === 'neoforge').length,
    quilt: instances.filter((i) => (i?.loader || '').toLowerCase() === 'quilt').length,
    vanilla: instances.filter((i) => (i?.loader || '').toLowerCase() === 'vanilla').length
  };

  // Playtime Analytics Calculations
  const totalPlaytimeMinutes = instances.reduce((acc, i) => acc + (i.playTimeMinutes || 0), 0);
  const totalPlaytimeHours = Math.floor(totalPlaytimeMinutes / 60);
  const totalPlaytimeRemainingMins = totalPlaytimeMinutes % 60;
  const totalLaunches = instances.reduce((acc, i) => acc + (i.launchCount || 0), 0);
  const instancesWithPlaytime = [...instances]
    .filter((i) => (i.playTimeMinutes || 0) > 0)
    .sort((a, b) => (b.playTimeMinutes || 0) - (a.playTimeMinutes || 0));
  const mostPlayedInstance = instancesWithPlaytime[0] || (instances.length > 0 ? instances[0] : null);

  const segmentGradients = [
    'from-cyan-500 to-blue-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-red-500',
    'from-indigo-500 to-violet-500',
    'from-sky-400 to-cyan-400',
    'from-fuchsia-500 to-purple-600'
  ];

  const segmentDotColors = [
    'bg-cyan-400',
    'bg-purple-400',
    'bg-emerald-400',
    'bg-amber-400',
    'bg-rose-400',
    'bg-indigo-400',
    'bg-sky-400',
    'bg-fuchsia-400'
  ];

  const realPageNavItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Play', icon: Gamepad2 },
    { id: 'instances', label: 'Instances', icon: Boxes },
    { id: 'marketplace', label: 'Discover', icon: Compass },
    { id: 'accounts', label: 'Capes & Cosmetics', icon: Sparkles },
    { id: 'screenshots', label: 'Screenshots', icon: Camera },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'social', label: 'Friends & Social', icon: Users },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const modalFilteredInstances = instances.filter((inst) => {
    if (!launchModalSearch.trim()) return true;
    const q = launchModalSearch.toLowerCase().trim();
    return (
      (inst.name || '').toLowerCase().includes(q) ||
      (inst.version || '').toLowerCase().includes(q) ||
      (inst.loader || '').toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // VIEW 1: DEDICATED INSTANCES LIBRARY (when activeTab === 'instances')
  // =========================================================================
  if (activeTab === 'instances') {
    return (
      <div
        onWheel={handleInstancesWheel}
        className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 select-none animate-in fade-in duration-200"
      >
        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingInstance)}
          title="Delete Instance"
          subtitle={deletingInstance ? `Permanently delete "${deletingInstance.name}"` : ''}
          description={
            <span>
              Are you sure you want to delete <strong className="text-white font-bold">"{deletingInstance?.name}"</strong>?
              This will permanently delete all installed mods, shaderpacks, resource packs, configs, and local world saves from your disk.
            </span>
          }
          confirmText="Delete Instance"
          cancelText="Keep Instance"
          type="danger"
          isLoading={isDeletingLoading}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingInstance(null)}
        />

        {/* Icon Editor Modal */}
        {editingIconInstance && (
          <IconEditorModal
            isOpen={true}
            initialIcon={editingIconInstance.icon || 'grass_block'}
            initialBackground={editingIconInstance.iconBackground || 'green'}
            onSave={handleSaveIcon}
            onClose={() => setEditingIconInstance(null)}
          />
        )}

        {/* Clone Instance Modal */}
        {cloningInstance && (
          <CloneInstanceModal
            isOpen={Boolean(cloningInstance)}
            onClose={() => setCloningInstance(null)}
            instance={cloningInstance}
            onClone={async (instId, options) => {
              if (onCloneInstance) {
                await onCloneInstance(instId, options);
              } else if (window.galaxy) {
                const cloned = await window.galaxy.cloneInstance(instId, options);
                if (cloned && onShowToast) {
                  onShowToast({
                    type: 'success',
                    title: 'Instance Cloned',
                    message: `Cloned "${cloned.name}" successfully.`
                  });
                }
              }
            }}
          />
        )}

        {/* Top Header & Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                <Boxes className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
                Instances Library & Manager
              </h1>
              <span className="text-xs font-mono font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                {instances.length} Installed
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage, organize, configure, and isolate your Minecraft installations and modded profiles.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <button
              onClick={() => {
                sounds.playClick();
                onCreateInstance('share_code');
              }}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 font-semibold text-xs flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95 shadow-glow-sm"
              title="Import 1-Click Share Code (GLX-XXXX)"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Import Share Code</span>
            </button>
            <button
              onClick={() => {
                sounds.playSuccess();
                onCreateInstance('create');
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm hover:shadow-glow-md flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Instance</span>
            </button>
          </div>
        </div>

        {/* When no instances exist in Instances tab */}
        {instances.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.1] bg-gradient-to-b from-galaxy-900/80 via-galaxy-900/90 to-galaxy-950 p-8 md:p-10 shadow-2xl space-y-6">
            <div className="max-w-xl mx-auto text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-3 shadow-glow-sm">
                <Boxes className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-display font-bold text-white">No Instances Created Yet</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your instance library is completely isolated and modular. You can create custom installations or import existing modpacks from Modrinth and CurseForge.
              </p>
            </div>

            {/* Template Creation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2">
              <div
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance('create');
                }}
                className="group p-5 rounded-2xl bg-galaxy-950/70 hover:bg-galaxy-850/80 border border-white/[0.08] hover:border-purple-500/50 cursor-pointer transition-all shadow-lg hover:translate-y-[-2px] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 group-hover:scale-110 transition-transform">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors">
                    Create Custom Instance
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose Minecraft version (1.7 to 1.21), mod loader (Fabric, Forge, NeoForge, Quilt, Vanilla), memory, and 3D icons.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance('share_code');
                }}
                className="group p-5 rounded-2xl bg-galaxy-950/70 hover:bg-galaxy-850/80 border border-white/[0.08] hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg hover:translate-y-[-2px] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">
                    Import Share Code (GLX)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Paste any <span className="text-emerald-300 font-mono">GLX-XXXX</span> code to instantly clone and install an exact instance configuration from friends.
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance('import');
                }}
                className="group p-5 rounded-2xl bg-galaxy-950/70 hover:bg-galaxy-850/80 border border-white/[0.08] hover:border-cyan-500/50 cursor-pointer transition-all shadow-lg hover:translate-y-[-2px] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                    <FolderUp className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                    Import Modpack Archive
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Directly import local <span className="text-cyan-300 font-mono">.mrpack</span> (Modrinth) or <span className="text-purple-300 font-mono">.zip</span> (CurseForge) files with automatic mod extraction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Playtime Statistics & Distribution Section */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-galaxy-900/90 to-galaxy-950/90 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-glow-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-display font-bold text-white flex items-center space-x-2">
                      <span>Playtime Statistics & Distribution</span>
                      <span className="text-[10px] font-mono font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                        {totalPlaytimeHours > 0 ? `${totalPlaytimeHours}h ${totalPlaytimeRemainingMins}m Total` : `${totalPlaytimeMinutes}m Total`}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Track usage time across instances, game sessions, and launch frequencies.
                    </p>
                  </div>
                </div>

                {/* Quick Stat Pill Cards */}
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1.5 rounded-xl bg-galaxy-950/80 border border-white/[0.08] flex items-center space-x-2">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Total Launches</div>
                      <div className="text-xs font-mono font-bold text-slate-200">{totalLaunches} sessions</div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-galaxy-950/80 border border-white/[0.08] flex items-center space-x-2">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Top Instance</div>
                      <div className="text-xs font-mono font-bold text-amber-300 truncate max-w-[110px]">
                        {mostPlayedInstance ? mostPlayedInstance.name : 'None'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Segmented Proportional Playtime Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Instance Playtime Share</span>
                  </span>
                  <span>{instancesWithPlaytime.length} Active Profiles</span>
                </div>

                {totalPlaytimeMinutes > 0 ? (
                  <div className="h-4 w-full rounded-full overflow-hidden flex bg-galaxy-950/90 border border-white/[0.1] p-0.5 shadow-inner gap-0.5">
                    {instancesWithPlaytime.map((inst, idx) => {
                      const instMins = inst.playTimeMinutes || 0;
                      const pct = Math.max(Math.round((instMins / totalPlaytimeMinutes) * 100), 1);
                      const gradient = segmentGradients[idx % segmentGradients.length];
                      const hours = Math.floor(instMins / 60);
                      const mins = instMins % 60;
                      return (
                        <div
                          key={inst.id}
                          style={{ width: `${pct}%` }}
                          className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500 hover:opacity-90 cursor-pointer group/segment relative`}
                          title={`${inst.name}: ${hours}h ${mins}m (${pct}%)`}
                        >
                          {/* Floating segment tooltip */}
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-galaxy-950/95 border border-white/[0.15] text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 group-hover/segment:opacity-100 pointer-events-none transition-all shadow-xl z-30">
                            {inst.name}: {hours}h {mins}m ({pct}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-4 w-full rounded-full bg-galaxy-950/80 border border-white/[0.08] flex items-center justify-center text-[10px] font-mono text-slate-500">
                    No playtime recorded yet • Launch an instance to start tracking
                  </div>
                )}

                {/* Instance Legend / Breakdown Chips */}
                {instancesWithPlaytime.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    {instancesWithPlaytime.slice(0, 6).map((inst, idx) => {
                      const instMins = inst.playTimeMinutes || 0;
                      const pct = Math.max(Math.round((instMins / totalPlaytimeMinutes) * 100), 1);
                      const dotColor = segmentDotColors[idx % segmentDotColors.length];
                      const hours = Math.floor(instMins / 60);
                      const mins = instMins % 60;
                      return (
                        <div
                          key={inst.id}
                          onClick={() => onSelectInstance(inst)}
                          className="px-2.5 py-1 rounded-lg bg-galaxy-950/70 hover:bg-galaxy-900 border border-white/[0.06] hover:border-cyan-500/40 cursor-pointer flex items-center space-x-1.5 text-[11px] transition-all"
                        >
                          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                          <span className="font-medium text-slate-200 truncate max-w-[120px]">{inst.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Filter, Search & View Controls Bar */}
            <div className="p-4 rounded-2xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-3.5 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search instances by name, version, loader..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-galaxy-950/80 border border-white/[0.1] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort & View Controls */}
                <div className="flex items-center space-x-3">
                  {/* Sort dropdown */}
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-galaxy-950/80 border border-white/[0.1] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="recent">Recently Played</option>
                      <option value="name">Name (A-Z)</option>
                      <option value="loader">Loader Type</option>
                      <option value="version">Minecraft Version</option>
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center p-0.5 rounded-xl bg-galaxy-950/80 border border-white/[0.1]">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Loader Filter Chips & Instance Counter */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.05]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All', count: loaderCounts.all },
                    { id: 'fabric', label: 'Fabric', count: loaderCounts.fabric },
                    { id: 'forge', label: 'Forge', count: loaderCounts.forge },
                    { id: 'neoforge', label: 'NeoForge', count: loaderCounts.neoforge },
                    { id: 'quilt', label: 'Quilt', count: loaderCounts.quilt },
                    { id: 'vanilla', label: 'Vanilla', count: loaderCounts.vanilla }
                  ].map((chip) => {
                    const isActive = selectedLoaderFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        onClick={() => {
                          sounds.playSwitch();
                          setSelectedLoaderFilter(chip.id);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-glow-sm'
                            : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] border border-white/[0.06]'
                        }`}
                      >
                        <span>{chip.label}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isActive ? 'bg-black/30 text-white' : 'bg-white/[0.06] text-slate-400'
                        }`}>
                          {chip.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Instance Total & Filtered Counter */}
                <div className="text-[11px] font-mono text-slate-400 bg-galaxy-950/70 px-3 py-1 rounded-xl border border-white/[0.06] flex items-center space-x-2">
                  <span>Showing <strong className="text-white font-bold">{filteredAndSortedInstances.length}</strong> of <strong className="text-white font-bold">{instances.length}</strong> Profiles</span>
                  {instances.filter((i) => i.isFavorite).length > 0 && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-400 flex items-center space-x-1" title="Starred Favorites">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{instances.filter((i) => i.isFavorite).length}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content Body: Grid or List */}
            {filteredAndSortedInstances.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center space-y-4 bg-galaxy-900/30">
                <Boxes className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-200">No Instances Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No instances matched your current search query or loader filter.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setSelectedLoaderFilter('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      sounds.playSuccess();
                      onCreateInstance('create');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-xs font-semibold text-white shadow-glow-sm"
                  >
                    Create New Instance
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* High-Fidelity Reference Design Grid View Mode */
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4.5">
                {filteredAndSortedInstances.map((inst) => {
                  const isSelected = selectedInstance?.id === inst.id;
                  const isInstRunning = inst.isRunning;
                  const modCount = instanceModCounts[inst.id] ?? 0;
                  const health = getInstanceHealth(inst);

                  return (
                    <div
                      key={inst.id}
                      onClick={() => {
                        sounds.playClick();
                        onSelectInstance(inst);
                      }}
                      className={`group relative rounded-3xl p-5 cursor-pointer transition-all duration-300 border flex flex-col justify-between overflow-hidden select-none ${
                        isSelected
                          ? 'bg-gradient-to-r from-galaxy-950/95 via-galaxy-900/90 to-galaxy-950/95 border-indigo-500/80 ring-2 ring-indigo-500/60 shadow-[0_0_35px_rgba(99,102,241,0.35)]'
                          : 'bg-galaxy-950/75 hover:bg-galaxy-900/85 border-white/[0.08] hover:border-indigo-400/50 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.2)]'
                      }`}
                    >
                      {/* Atmospheric Panorama Background & Dynamic Glow */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-galaxy-950/60 to-black/70 pointer-events-none z-0" />
                      
                      {health.status === 'warning' && (
                        <div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-amber-500/10 blur-2xl pointer-events-none" />
                      )}
                      {health.status === 'critical' && (
                        <div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-rose-500/15 blur-2xl pointer-events-none" />
                      )}
                      {health.status === 'healthy' && (
                        <div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-indigo-500/10 blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
                      )}

                      {/* Card Content Relative Container */}
                      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                        
                        {/* Top Row: Icon + Title/Description/Chips + Top-Right Star/Pin */}
                        <div className="flex items-start justify-between gap-4">
                          
                          {/* Left: 3D Block / World Thumbnail + Info */}
                          <div className="flex items-start space-x-4 min-w-0 flex-1">
                            
                            {/* 3D Icon / World Thumbnail */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playClick();
                                setEditingIconInstance(inst);
                              }}
                              className="group/icon relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0 shadow-lg overflow-hidden group-hover/icon:border-indigo-400/50 transition-all cursor-pointer"
                              title="Click to customize 3D icon & theme"
                            >
                              <InstanceIconRenderer
                                icon={inst.icon || 'grass_block'}
                                background={inst.iconBackground || 'obsidian'}
                                size="md"
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl group-hover/icon:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/icon:opacity-100 flex items-center justify-center transition-opacity">
                                <Palette className="w-4 h-4 text-cyan-300" />
                              </div>
                            </div>

                            {/* Text Block: Title + Description + Chips */}
                            <div className="space-y-2 min-w-0 flex-1">
                              {/* Header Row: Favorite badge (if favorited) + Instance Title */}
                              <div>
                                <div className="flex items-center space-x-2">
                                  {inst.isFavorite && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold tracking-wider uppercase inline-flex items-center space-x-1 shadow-glow-sm shrink-0">
                                      <Star className="w-3 h-3 fill-amber-300" />
                                      <span>FAVORITE</span>
                                    </span>
                                  )}
                                  {isInstRunning && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold animate-pulse shrink-0">
                                      RUNNING
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-base sm:text-lg font-display font-bold text-white tracking-wide truncate group-hover:text-indigo-200 transition-colors mt-0.5" title={inst.name}>
                                  {inst.name || 'Untitled Instance'}
                                </h3>

                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                  {inst.description || (inst.loader !== 'vanilla' ? `${inst.loader.toUpperCase()} modded instance • ${inst.memoryMax ?? 4096} MB RAM` : `Vanilla Minecraft profile • ${inst.memoryMax ?? 4096} MB RAM`)}
                                </p>
                              </div>

                              {/* Info Tags / Chips Row */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {/* Minecraft Version Chip */}
                                <span className="px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-200 text-xs font-mono flex items-center space-x-1.5 shadow-sm">
                                  <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold">🟩</span>
                                  <span>Minecraft {inst.version || '1.21.1'}</span>
                                </span>

                                {/* Loader Chip */}
                                <span className="px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-200 text-xs font-mono flex items-center space-x-1.5 capitalize shadow-sm">
                                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>{inst.loader || 'Fabric'}</span>
                                </span>

                                {/* Mods Count Chip */}
                                {modCount > 0 ? (
                                  <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono flex items-center space-x-1.5 shadow-sm">
                                    <Package className="w-3.5 h-3.5 text-purple-400" />
                                    <span>{modCount} Mods</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300/90 text-xs font-mono flex items-center space-x-1.5 shadow-sm">
                                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Vanilla</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Top Right: Star Toggle */}
                          <div className="flex items-center space-x-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] shrink-0">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                sounds.playClick();
                                await window.galaxy?.toggleInstanceFavorite(inst.id);
                                const updated = { ...inst, isFavorite: !inst.isFavorite };
                                onUpdateInstance?.(updated);
                                onShowToast?.({
                                  id: Math.random().toString(),
                                  type: 'info',
                                  title: updated.isFavorite ? 'Starred as Favorite' : 'Unstarred',
                                  message: `${inst.name} is now ${updated.isFavorite ? 'pinned to top' : 'unstarred'}.`
                                });
                              }}
                              className={`p-1.5 rounded-xl transition-all ${
                                inst.isFavorite
                                  ? 'text-amber-300 bg-amber-500/20 shadow-glow-sm'
                                  : 'text-slate-400 hover:text-amber-300 hover:bg-white/[0.08]'
                              }`}
                              title={inst.isFavorite ? 'Unstar Instance' : 'Star as Favorite'}
                            >
                              <Star className={`w-4 h-4 ${inst.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Bar: Health Status + Last Played (Left) & Play Button + 3-Dots Menu (Right) */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
                          
                          {/* Left: Health Indicator + Last Played */}
                          <div className="flex items-center space-x-3">
                            {/* Health Status Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playClick();
                                setHealthCheckingInstance(inst);
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 shadow-sm ${
                                health.status === 'critical'
                                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                                  : health.status === 'warning'
                                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                              }`}
                              title="Click to run health checkup"
                            >
                              <span className={`w-2 h-2 rounded-full ${
                                health.status === 'critical'
                                  ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                                  : health.status === 'warning'
                                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                                    : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                              }`} />
                              <span>{health.label}</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            </button>

                            {/* Last Played */}
                            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Last played {formatTimeAgo(inst.lastPlayed || inst.createdAt)}</span>
                            </div>
                          </div>

                          {/* Right: Play Button + More Options (···) */}
                          <div className="flex items-center space-x-2">
                            {/* Play Button */}
                            {isInstRunning ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sounds.playError();
                                  onKill(inst);
                                }}
                                className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-display font-bold text-xs shadow-glow-sm flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
                              >
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Stop</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sounds.playLaunch();
                                  onLaunch(inst);
                                }}
                                className="px-7 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-display font-extrabold text-xs flex items-center space-x-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:shadow-[0_0_28px_rgba(99,102,241,0.65)] hover:scale-105 active:scale-95"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Play</span>
                              </button>
                            )}

                            {/* 3-Dots Dropdown Trigger */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  sounds.playClick();
                                  setActiveMenuInstanceId(activeMenuInstanceId === inst.id ? null : inst.id);
                                }}
                                className={`p-2 rounded-xl border transition-all ${
                                  activeMenuInstanceId === inst.id
                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-glow-sm'
                                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border-white/[0.08]'
                                }`}
                                title="More Options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Context Dropdown Menu */}
                              {activeMenuInstanceId === inst.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 bottom-full mb-2 w-52 rounded-2xl bg-galaxy-900 border border-white/[0.14] shadow-2xl py-1.5 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 text-left"
                                >
                                  <button
                                    onClick={() => {
                                      setActiveMenuInstanceId(null);
                                      sounds.playClick();
                                      setHealthCheckingInstance(inst);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-emerald-300 hover:bg-emerald-500/15 flex items-center space-x-2.5 transition-colors font-semibold"
                                  >
                                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                                    <span>Run Health Checkup</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMenuInstanceId(null);
                                      sounds.playClick();
                                      onOpenInstanceDetails(inst);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                                  >
                                    <SettingsIcon className="w-4 h-4 text-purple-400" />
                                    <span>Configure & Mods</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMenuInstanceId(null);
                                      sounds.playClick();
                                      onOpenFolder(inst);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                                  >
                                    <FolderOpen className="w-4 h-4 text-cyan-400" />
                                    <span>Open Folder</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMenuInstanceId(null);
                                      sounds.playClick();
                                      setSharingInstance(inst);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                                  >
                                    <Share2 className="w-4 h-4 text-cyan-400" />
                                    <span>Share Code (GLX)</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMenuInstanceId(null);
                                      sounds.playClick();
                                      setCloningInstance(inst);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                                  >
                                    <Copy className="w-4 h-4 text-purple-400" />
                                    <span>Clone Instance</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveMenuInstanceId(null);
                                      sounds.playClick();
                                      setEditingIconInstance(inst);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                                  >
                                    <Palette className="w-4 h-4 text-pink-400" />
                                    <span>Customize 3D Icon</span>
                                  </button>

                                  <div className="my-1 border-t border-white/[0.08]" />

                                  <button
                                    onClick={() => {
                                      setActiveMenuInstanceId(null);
                                      sounds.playClick();
                                      setDeletingInstance(inst);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/15 flex items-center space-x-2.5 transition-colors font-medium"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-400" />
                                    <span>Delete Instance</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* High-Fidelity List View Mode */
              <div className="space-y-3">
                {filteredAndSortedInstances.map((inst) => {
                  const isSelected = selectedInstance?.id === inst.id;
                  const isInstRunning = inst.isRunning;
                  const modCount = instanceModCounts[inst.id] ?? 0;
                  const health = getInstanceHealth(inst);

                  return (
                    <div
                      key={inst.id}
                      onClick={() => {
                        sounds.playClick();
                        onSelectInstance(inst);
                      }}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between space-x-4 ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-950/40 via-galaxy-900/90 to-galaxy-950/95 border-indigo-400/80 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/30'
                          : 'bg-galaxy-950/70 hover:bg-galaxy-900/85 border-white/[0.08] hover:border-indigo-400/40 hover:shadow-lg'
                      }`}
                    >
                      {/* Left: Icon + Meta + Badges */}
                      <div className="flex items-center space-x-4 min-w-0">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            setEditingIconInstance(inst);
                          }}
                          className="group/icon relative cursor-pointer flex-shrink-0"
                          title="Click to edit 3D icon & theme"
                        >
                          <InstanceIconRenderer
                            icon={inst.icon || 'grass_block'}
                            background={inst.iconBackground || 'obsidian'}
                            size="md"
                            className="w-13 h-13 rounded-xl group-hover/icon:scale-105 transition-transform shadow-md"
                          />
                          <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover/icon:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Palette className="w-3.5 h-3.5 text-cyan-300" />
                          </div>
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center space-x-2">
                            {inst.isFavorite && (
                              <span className="px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-mono font-bold tracking-wider uppercase inline-flex items-center space-x-1 shadow-glow-sm">
                                <Star className="w-2.5 h-2.5 fill-amber-300" />
                                <span>FAVORITE</span>
                              </span>
                            )}
                            <span className="font-display font-bold text-sm text-slate-100 truncate">
                              {inst.name || 'Untitled Instance'}
                            </span>
                            {isInstRunning && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono animate-pulse font-bold">
                                RUNNING
                              </span>
                            )}
                          </div>

                          {/* Meta Chips Row */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 flex items-center space-x-1">
                              <span>🟩</span>
                              <span>MC {inst.version || '1.21.1'}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg border ${getLoaderColor(inst.loader)} uppercase font-semibold text-[10px]`}>
                              {inst.loader || 'vanilla'}
                            </span>
                            {modCount > 0 ? (
                              <span className="text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-lg border border-purple-500/30 flex items-center space-x-1">
                                <Package className="w-3 h-3 text-purple-400" />
                                <span>{modCount} Mods</span>
                              </span>
                            ) : (
                              <span className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25">
                                Vanilla
                              </span>
                            )}
                            <span className="text-slate-600">•</span>
                            <span className="text-cyan-300">{inst.memoryMax ?? 4096} MB RAM</span>
                            <span className="text-slate-600">•</span>
                            <span>Last played {formatTimeAgo(inst.lastPlayed || inst.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Health + Star + Play + 3-Dots */}
                      <div className="flex items-center space-x-2.5 flex-shrink-0">
                        {/* Health Status Pill */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            setHealthCheckingInstance(inst);
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all hover:scale-105 active:scale-95 ${
                            health.status === 'critical'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : health.status === 'warning'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                          title="Run Health Checkup"
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            health.status === 'critical'
                              ? 'bg-rose-400'
                              : health.status === 'warning'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                          }`} />
                          <span>{health.label}</span>
                          <ChevronRight className="w-3 h-3 opacity-60" />
                        </button>

                        {/* Star Favorite Button */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            sounds.playClick();
                            await window.galaxy?.toggleInstanceFavorite(inst.id);
                            const updated = { ...inst, isFavorite: !inst.isFavorite };
                            onUpdateInstance?.(updated);
                            onShowToast?.({
                              id: Math.random().toString(),
                              type: 'info',
                              title: updated.isFavorite ? 'Starred as Favorite' : 'Unstarred',
                              message: `${inst.name} is now ${updated.isFavorite ? 'pinned to top' : 'unstarred'}.`
                            });
                          }}
                          className={`p-2 rounded-xl border transition-all ${
                            inst.isFavorite
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-sm'
                              : 'bg-white/[0.04] text-slate-500 hover:text-amber-300 border-white/[0.06]'
                          }`}
                          title={inst.isFavorite ? 'Unstar Instance' : 'Star as Favorite'}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>

                        {/* Play / Stop Button */}
                        {isInstRunning ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playError();
                              onKill(inst);
                            }}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-1.5"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playLaunch();
                              onLaunch(inst);
                            }}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play</span>
                          </button>
                        )}

                        {/* 3-Dots Dropdown Trigger */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playClick();
                              setActiveMenuInstanceId(activeMenuInstanceId === inst.id ? null : inst.id);
                            }}
                            className={`p-2 rounded-xl border transition-all ${
                              activeMenuInstanceId === inst.id
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-glow-sm'
                                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border-white/[0.08]'
                            }`}
                            title="More Options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu Modal */}
                          {activeMenuInstanceId === inst.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl bg-galaxy-900 border border-white/[0.14] shadow-2xl py-1.5 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100 text-left"
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuInstanceId(null);
                                  sounds.playClick();
                                  setHealthCheckingInstance(inst);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-emerald-300 hover:bg-emerald-500/15 flex items-center space-x-2.5 transition-colors font-semibold"
                              >
                                <Stethoscope className="w-4 h-4 text-emerald-400" />
                                <span>Run Health Checkup</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuInstanceId(null);
                                  sounds.playClick();
                                  onOpenInstanceDetails(inst);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                              >
                                <SettingsIcon className="w-4 h-4 text-purple-400" />
                                <span>Configure & Mods</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuInstanceId(null);
                                  sounds.playClick();
                                  onOpenFolder(inst);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                              >
                                <FolderOpen className="w-4 h-4 text-cyan-400" />
                                <span>Open Folder</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuInstanceId(null);
                                  sounds.playClick();
                                  setSharingInstance(inst);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                              >
                                <Share2 className="w-4 h-4 text-cyan-400" />
                                <span>Share Code (GLX)</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuInstanceId(null);
                                  sounds.playClick();
                                  setCloningInstance(inst);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                              >
                                <Copy className="w-4 h-4 text-purple-400" />
                                <span>Clone Instance</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuInstanceId(null);
                                  sounds.playClick();
                                  setEditingIconInstance(inst);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.08] flex items-center space-x-2.5 transition-colors"
                              >
                                <Palette className="w-4 h-4 text-pink-400" />
                                <span>Customize 3D Icon</span>
                              </button>

                              <div className="my-1 border-t border-white/[0.08]" />

                              <button
                                onClick={() => {
                                  setActiveMenuInstanceId(null);
                                  sounds.playClick();
                                  setDeletingInstance(inst);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/15 flex items-center space-x-2.5 transition-colors font-medium"
                              >
                                <Trash2 className="w-4 h-4 text-rose-400" />
                                <span>Delete Instance</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PLAY TAB / COMMAND HUB HERO (activeTab === 'home')
  // =========================================================================
  return (
    <div
      onWheel={handlePlayPageWheel}
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between p-6 md:p-8 animate-in fade-in duration-200"
    >
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingInstance)}
        title="Delete Instance"
        subtitle={deletingInstance ? `Permanently delete "${deletingInstance.name}"` : ''}
        description={
          <span>
            Are you sure you want to delete <strong className="text-white font-bold">"{deletingInstance?.name}"</strong>?
            This will permanently delete all installed mods, shaderpacks, configs, and local world saves from your disk.
          </span>
        }
        confirmText="Delete Instance"
        cancelText="Keep Instance"
        type="danger"
        isLoading={isDeletingLoading}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingInstance(null)}
      />

      {/* Icon Editor Modal */}
      {editingIconInstance && (
        <IconEditorModal
          isOpen={true}
          initialIcon={editingIconInstance.icon || 'grass_block'}
          initialBackground={editingIconInstance.iconBackground || 'green'}
          onSave={handleSaveIcon}
          onClose={() => setEditingIconInstance(null)}
        />
      )}

      {/* Share Instance Modal (GLX-XXXX) */}
      {sharingInstance && (
        <ShareInstanceModal
          instance={sharingInstance}
          onClose={() => setSharingInstance(null)}
          onShowToast={onShowToast || (() => {})}
        />
      )}

      {/* Clone Instance Modal */}
      {cloningInstance && (
        <CloneInstanceModal
          isOpen={Boolean(cloningInstance)}
          onClose={() => setCloningInstance(null)}
          instance={cloningInstance}
          onClone={async (instId, options) => {
            if (onCloneInstance) {
              await onCloneInstance(instId, options);
            } else if (window.galaxy) {
              const cloned = await window.galaxy.cloneInstance(instId, options);
              if (cloned && onShowToast) {
                onShowToast({
                  type: 'success',
                  title: 'Instance Cloned',
                  message: `Cloned "${cloned.name}" successfully.`
                });
              }
            }
          }}
        />
      )}

      {/* Instance Health Checkup & Diagnostics Modal */}
      {healthCheckingInstance && (
        <InstanceHealthModal
          instance={healthCheckingInstance}
          onClose={() => setHealthCheckingInstance(null)}
          onInstanceUpdated={async (updatedInst) => {
            if (onUpdateInstance) {
              await onUpdateInstance(updatedInst);
            }
          }}
        />
      )}

      {/* Quick Launch Instance Picker Modal (Prompt on Scroll Up) */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => {
              sounds.playClick();
              setShowLaunchModal(false);
            }}
          />

          <div className="relative w-full max-w-xl max-h-[85vh] bg-galaxy-900 border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-galaxy-950/60">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-glow-sm">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    Quick Launch
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select which instance profile you want to launch
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  setShowLaunchModal(false);
                }}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Filter if > 3 instances */}
            {instances.length > 3 && (
              <div className="p-3.5 bg-galaxy-900/90 border-b border-white/[0.06]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={launchModalSearch}
                    onChange={(e) => setLaunchModalSearch(e.target.value)}
                    placeholder="Search instance by name, version, loader..."
                    className="w-full pl-9 pr-4 py-2 bg-galaxy-950/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    autoFocus
                  />
                  {launchModalSearch && (
                    <button
                      onClick={() => setLaunchModalSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Instance List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[55vh] custom-scrollbar">
              {modalFilteredInstances.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No instances match "{launchModalSearch}".
                </div>
              ) : (
                modalFilteredInstances.map((inst) => {
                  const isInstSelected = selectedInstance?.id === inst.id;
                  const isInstRunning = inst.isRunning;
                  const isInstLaunching = launchProgress && launchProgress.instanceId === inst.id;

                  return (
                    <div
                      key={inst.id}
                      onClick={() => {
                        onSelectInstance(inst);
                      }}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isInstSelected
                          ? 'bg-emerald-950/25 border-emerald-500/40 shadow-sm'
                          : 'bg-galaxy-950/60 hover:bg-galaxy-800/80 border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      {/* Left: Icon & Meta */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <InstanceIconRenderer
                          icon={inst.icon || 'grass_block'}
                          background={inst.iconBackground || 'obsidian'}
                          size="sm"
                          className="w-11 h-11 rounded-xl shrink-0 shadow-md"
                        />

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-white font-display truncate">
                              {inst.name}
                            </span>
                            {inst.isFavorite && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                            <span className="capitalize px-1.5 py-0.2 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300">
                              {inst.loader || 'vanilla'}
                            </span>
                            <span>MC {inst.version}</span>
                            <span className="text-slate-500">•</span>
                            <span>{inst.memoryMax || 4096} MB</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Launch / Stop Button */}
                      <div className="shrink-0">
                        {isInstRunning ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playError();
                              onKill(inst);
                              setShowLaunchModal(false);
                            }}
                            className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all"
                          >
                            Stop Game
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInstLaunching) return;
                              sounds.playLaunch();
                              onSelectInstance(inst);
                              onLaunch(inst);
                              setShowLaunchModal(false);
                              onShowToast?.({
                                type: 'success',
                                title: `Launching ${inst.name}...`,
                                message: `Minecraft ${inst.version} (${inst.loader.toUpperCase()})`
                              });
                            }}
                            disabled={Boolean(isInstLaunching)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-bold text-xs shadow-glow-sm hover:shadow-glow-md flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                          >
                            {isInstLaunching ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Launching...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Play Now</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-galaxy-950/80 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-500">
                {instances.length} instance{instances.length === 1 ? '' : 's'} configured
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowLaunchModal(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium border border-white/[0.1] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Rail (Maps to Real Tabs) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-2 bg-galaxy-950/85 px-4 py-2 rounded-full border border-white/[0.12] backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        {realPageNavItems.map((item) => {
          const isActive = item.id === 'home';
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                sounds.playSwitch();
                onSelectTab?.(item.id);
              }}
              className="group relative p-1.5 rounded-full transition-all focus:outline-none"
              title={item.label}
            >
              {/* Glowing active indicator pill / dot */}
              <span
                className={`block rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-7 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 shadow-[0_0_14px_rgba(6,182,212,0.9)] ring-1 ring-cyan-400/50'
                    : 'w-2 h-2 bg-slate-500 hover:bg-slate-300 opacity-60 hover:opacity-100'
                }`}
              />

              {/* Floating tooltip on hover */}
              <div className="absolute bottom-9 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-galaxy-900/95 border border-white/[0.15] text-[11px] font-medium text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl backdrop-blur-md flex items-center space-x-1.5 transform translate-y-1 group-hover:translate-y-0 z-50">
                <IconComponent className="w-3.5 h-3.5 text-cyan-300" />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Top Subtle Scroll Up Cue */}
      <div
        onClick={handleQuickLaunch}
        className="cursor-pointer group flex items-center justify-center space-x-1.5 pt-1 text-slate-500 hover:text-emerald-400 transition-colors self-center"
        title="Scroll up or click to Quick Launch Minecraft"
      >
        <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform text-emerald-400/70" />
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60 group-hover:opacity-100">
          Scroll up to quick launch
        </span>
      </div>

      {/* =========================================================================
          PLAY COMMAND HUB (HERO STAGE)
         ========================================================================= */}
      {instances.length === 0 || !selectedInstance ? (
        /* When no instances exist: Show Cosmic Quick Launch Station */
        <div className="relative space-y-6 max-w-4xl w-full mx-auto my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Ambient Celestial Galaxy Orbit Background */}
          <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden opacity-75">
            <div className="absolute w-[520px] h-[520px] rounded-full border border-purple-500/20 animate-spin-slow" />
            <div className="absolute w-[380px] h-[380px] rounded-full border border-dashed border-cyan-500/25 animate-reverse-spin" />
            <div className="absolute w-80 h-80 rounded-full bg-purple-600/15 blur-3xl animate-pulse" />
          </div>

          {/* Main Hero Card for Brand New User */}
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.14] bg-gradient-to-b from-galaxy-850/95 via-galaxy-900/95 to-galaxy-950/98 p-6 md:p-8 shadow-2xl text-center space-y-5 backdrop-blur-xl">
            <div className="relative z-10 mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 shadow-glow-lg flex items-center justify-center">
              <div className="w-full h-full bg-galaxy-950/90 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-cyan-300 animate-pulse" />
              </div>
            </div>

            <div className="relative z-10 space-y-1.5 max-w-xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-semibold tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>GALAXY COMMAND CENTER</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight">
                Ready to Launch Your Universe
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Choose a ready-to-play profile or create your own custom setup with 100,000+ mods, shaders, and optimizations.
              </p>
            </div>

            {/* Quick 1-Click Launch Options (4-Grid) */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-left">
              <div
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance();
                }}
                className="p-3.5 rounded-2xl bg-galaxy-950/85 hover:bg-galaxy-850 border border-white/[0.08] hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg group hover:scale-[1.02] hover:shadow-glow-sm"
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <InstanceIconRenderer icon="grass_block" background="green" size="sm" shadow={false} />
                  <span className="font-bold text-xs text-slate-100 group-hover:text-emerald-300 transition-colors">Vanilla 1.21.4</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Official pure Minecraft with zero modifications.</p>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance();
                }}
                className="p-3.5 rounded-2xl bg-galaxy-950/85 hover:bg-galaxy-850 border border-white/[0.08] hover:border-blue-500/50 cursor-pointer transition-all shadow-lg group hover:scale-[1.02] hover:shadow-glow-sm"
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <InstanceIconRenderer icon="backpack" background="blue" size="sm" shadow={false} />
                  <span className="font-bold text-xs text-slate-100 group-hover:text-blue-300 transition-colors">Fabric Optimized</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Sodium + Lithium tuned for 300+ FPS boost.</p>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance();
                }}
                className="p-3.5 rounded-2xl bg-galaxy-950/85 hover:bg-galaxy-850 border border-white/[0.08] hover:border-orange-500/50 cursor-pointer transition-all shadow-lg group hover:scale-[1.02] hover:shadow-glow-sm"
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <InstanceIconRenderer icon="anvil" background="orange" size="sm" shadow={false} />
                  <span className="font-bold text-xs text-slate-100 group-hover:text-orange-300 transition-colors">Forge Modded</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Built for heavy tech modpacks and shaders.</p>
              </div>

              <div
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance();
                }}
                className="p-3.5 rounded-2xl bg-galaxy-950/85 hover:bg-galaxy-850 border border-white/[0.08] hover:border-rose-500/50 cursor-pointer transition-all shadow-lg group hover:scale-[1.02] hover:shadow-glow-sm"
              >
                <div className="flex items-center space-x-2.5 mb-1.5">
                  <InstanceIconRenderer icon="redstone" background="ruby" size="sm" shadow={false} />
                  <span className="font-bold text-xs text-slate-100 group-hover:text-rose-300 transition-colors">NeoForge 1.21.1</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Next-generation modern Minecraft modding.</p>
              </div>
            </div>

            {/* Call to Action Button */}
            <div className="relative z-10 pt-1 flex items-center justify-center">
              <button
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance();
                }}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-400 hover:from-purple-500 hover:to-cyan-300 text-white font-display font-bold text-xs shadow-glow-md hover:shadow-glow-lg flex items-center space-x-2.5 transition-all transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="tracking-wide">CREATE FIRST INSTANCE</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Selected Instance Hero Banner */
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.14] bg-gradient-to-b from-galaxy-850/95 via-galaxy-900/90 to-galaxy-950/98 backdrop-blur-2xl shadow-2xl p-6 md:p-8 space-y-6 my-auto max-w-7xl mx-auto w-full">
          {/* Glowing Nebula Auras */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-16 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Instance Profile & Status */}
            <div className="flex items-start md:items-center space-x-5 max-w-2xl">
              {/* Clickable 3D Isometric Icon */}
              <div
                onClick={() => {
                  sounds.playClick();
                  setEditingIconInstance(selectedInstance);
                }}
                className="group relative cursor-pointer flex-shrink-0"
                title="Click to customize 3D icon & background theme"
              >
                <InstanceIconRenderer
                  icon={selectedInstance.icon || 'grass_block'}
                  background={selectedInstance.iconBackground || 'obsidian'}
                  size="xl"
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl group-hover:scale-105 transition-transform shadow-2xl"
                />
                <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-semibold transition-opacity space-y-1">
                  <Palette className="w-4 h-4 text-cyan-300" />
                  <span>Customize</span>
                </div>
              </div>

              <div className="space-y-2 min-w-0">
                {/* Badges & Profile Switcher */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase border shadow-sm ${getLoaderColor(selectedInstance.loader)}`}>
                    {selectedInstance.loader || 'vanilla'} {selectedInstance.loaderVersion ? `(${selectedInstance.loaderVersion})` : ''}
                  </span>
                  <span className="text-xs font-mono text-slate-300 bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/[0.09]">
                    MC {selectedInstance.version || '1.21.1'}
                  </span>
                  <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/25">
                    {installedMods.length} Mods Active
                  </span>

                  {/* Direct Link to Cosmetics Wardrobe */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onSelectTab?.('accounts');
                    }}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-pink-300 border border-pink-500/30 flex items-center space-x-1.5 transition-all shadow-glow-sm hover:scale-105 active:scale-95 cursor-pointer"
                    title="Open Galaxy Capes & Cosmetics Wardrobe"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                    <span>Cosmetics Wardrobe</span>
                  </button>

                  {/* Quick Profile Switcher Dropdown */}
                  {instances.length > 1 && (
                    <div className="relative">
                      <button
                        onClick={() => setInstanceDropdownOpen(!instanceDropdownOpen)}
                        className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono flex items-center space-x-1 transition-colors"
                      >
                        <span>Switch Profile</span>
                        <ChevronDown className="w-3 h-3 text-cyan-400" />
                      </button>

                      {instanceDropdownOpen && (
                        <div className="absolute left-0 mt-1.5 w-60 rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl py-1.5 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.06]">
                            Select Instance Profile
                          </div>
                          <div className="max-h-56 overflow-y-auto">
                            {instances.map((inst) => (
                              <button
                                key={inst.id}
                                onClick={() => {
                                  sounds.playClick();
                                  onSelectInstance(inst);
                                  setInstanceDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                                  inst.id === selectedInstance.id
                                    ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                                    : 'text-slate-300 hover:bg-white/[0.05]'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <InstanceIconRenderer icon={inst.icon || 'grass_block'} background={inst.iconBackground || 'obsidian'} size="sm" />
                                  <span className="truncate">{inst.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 uppercase">{inst.loader}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight truncate">
                    {selectedInstance.name || 'Untitled Instance'}
                  </h1>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      await window.galaxy?.toggleInstanceFavorite(selectedInstance.id);
                      const updated = { ...selectedInstance, isFavorite: !selectedInstance.isFavorite };
                      onUpdateInstance?.(updated);
                      onShowToast?.({
                        id: Math.random().toString(),
                        type: 'info',
                        title: updated.isFavorite ? 'Starred as Favorite' : 'Unstarred',
                        message: `${selectedInstance.name} is now ${updated.isFavorite ? 'pinned to the top' : 'unstarred'}.`
                      });
                    }}
                    className={`p-2 rounded-xl border transition-all ${
                      selectedInstance.isFavorite
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-glow-sm'
                        : 'bg-white/[0.05] text-slate-400 hover:text-amber-300 border-white/[0.08]'
                    }`}
                    title={selectedInstance.isFavorite ? 'Unstar Instance' : 'Star as Favorite Instance'}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>

                {/* Hardware & Spec Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-400 font-mono">
                  <div className="flex items-center space-x-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/[0.06]">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    <span>{selectedInstance.memoryMax ?? 4096} MB RAM</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/[0.06]">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedInstance.resolution?.width ?? 1920}x{selectedInstance.resolution?.height ?? 1080}</span>
                  </div>
                  {activeAccount && (
                    <div className="flex items-center space-x-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-white/[0.06] text-emerald-300">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{activeAccount.username}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Launch Action Hub */}
            <div className="flex flex-col items-stretch md:items-end space-y-3 min-w-[240px] shrink-0">
              {isRunning ? (
                <button
                  onClick={() => {
                    sounds.playError();
                    onKill(selectedInstance);
                  }}
                  className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-display font-bold text-sm shadow-glow-md flex items-center justify-center space-x-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span className="tracking-wider">STOP GAME</span>
                </button>
              ) : (
                <button
                  disabled={Boolean(isLaunching)}
                  onClick={() => {
                    sounds.playLaunch();
                    onLaunch(selectedInstance);
                  }}
                  className={`relative group/btn w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-display font-extrabold text-base shadow-glow-lg flex items-center justify-center space-x-2.5 transition-all transform hover:scale-[1.03] active:scale-[0.98] ${
                    isLaunching ? 'opacity-80 cursor-wait' : ''
                  }`}
                >
                  {/* Button ambient pulsing border */}
                  <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-40 blur group-hover/btn:opacity-75 transition-opacity" />

                  <span className="relative z-10 flex items-center space-x-2.5">
                    {isLaunching ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                        <span className="tracking-wider">INITIALIZING...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current text-slate-950" />
                        <span className="tracking-wider">PLAY NOW</span>
                      </>
                    )}
                  </span>
                </button>
              )}

              {/* Quick Actions Row */}
              <div className="flex items-center space-x-2 w-full">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenInstanceDetails(selectedInstance);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setSharingInstance(selectedInstance);
                  }}
                  className="py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                  title="1-Click Instance Share Code (GLX-XXXX)"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setHealthCheckingInstance(selectedInstance);
                  }}
                  className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                  title="Instance Health Checkup & Conflict Diagnostics"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Health</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenFolder(selectedInstance);
                  }}
                  className="py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                  title="Open Instance Directory"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Folder</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playSuccess();
                    onOptimizeInstance(selectedInstance);
                  }}
                  className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center justify-center space-x-1 transition-all active:scale-95"
                  title="1-Click Performance Boost (Sodium/Lithium/FerriteCore)"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Boost</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Launch Progress Bar */}
          {isLaunching && (
            <div className="pt-3 border-t border-white/[0.08] space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300 font-medium flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span>{launchProgress.step}</span>
                </span>
                <span className="text-cyan-400 font-bold">{launchProgress.progress}%</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${launchProgress.progress}%` }}
                />
              </div>
              {launchProgress.details && (
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {launchProgress.details}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Interactive Scroll Hint (Navigates to Real Instances View) */}
      <div
        onClick={() => {
          sounds.playSwitch();
          onSelectTab?.('instances');
        }}
        className="cursor-pointer group flex flex-col items-center justify-center space-y-1 pb-14 text-slate-400 hover:text-cyan-300 transition-colors"
      >
        <span className="text-[11px] font-medium tracking-wide uppercase opacity-75 group-hover:opacity-100">
          Scroll down to explore your Galaxy universe
        </span>
        <ChevronsDown className="w-4 h-4 animate-bounce text-cyan-400 group-hover:scale-125 transition-transform" />
      </div>
    </div>
  );
};
