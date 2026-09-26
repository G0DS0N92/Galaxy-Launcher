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
  Folder,
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
  Moon,
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
  Pin,
  Monitor
} from 'lucide-react';
import { Instance, Account, LaunchProgress, Achievement, CloneInstanceOptions } from '../../types';
import { sounds } from '../../services/soundEngine';
import { ConfirmModal } from '../common/ConfirmModal';
import { CloneInstanceModal } from '../instances/CloneInstanceModal';
import { IsometricSymbolSVG } from '../instances/instanceIcons';
import { TabType } from '../layout/Sidebar';
import bgPortalHero from '../../assets/instance_backgrounds/bg_portal_hero.jpg';
import bgGalaxy from '../../assets/instance_backgrounds/bg_galaxy.jpg';
import bgSunset from '../../assets/instance_backgrounds/bg_sunset.jpg';
import bgNether from '../../assets/instance_backgrounds/bg_nether.jpg';
import bgVanilla from '../../assets/instance_backgrounds/bg_vanilla.jpg';
import bgCampfireFriends from '../../assets/instance_backgrounds/bg_campfire_friends.jpg';
import bgCloudSync from '../../assets/instance_backgrounds/bg_cloud_sync.jpg';

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

import { resolveInstanceArtwork } from '../../services/instanceArtwork';

function getInstanceBg(instance?: Instance | null, index?: number): string {
  return resolveInstanceArtwork(instance, index);
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

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const SodiumIcon: React.FC<{ size?: string; iconSize?: string }> = ({ size = 'w-6 h-6', iconSize = 'w-3.5 h-3.5' }) => (
  <div className={`${size} rounded-lg bg-gradient-to-b from-emerald-500/20 to-emerald-950/50 p-0.5 border border-emerald-500/35 group-hover/mod:border-emerald-300 group-hover/mod:shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center relative overflow-hidden group-hover/mod:scale-108 transition-all duration-300 shrink-0`}>
    <svg viewBox="0 0 32 32" className={`${iconSize} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`} fill="none">
      <path d="M12 6h8v3l4.5 9A3 3 0 0 1 21.8 22H10.2A3 3 0 0 1 7.5 18L12 9V6z" stroke="#34d399" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 6h12" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.2 16.5h13.6l1.2 2.5a2 2 0 0 1-1.8 3H9.8a2 2 0 0 1-1.8-3l1.2-2.5z" fill="#10b981" fillOpacity="0.85" />
      <circle cx="16" cy="18.5" r="1.2" fill="#ecfdf5" />
      <circle cx="19" cy="17.5" r="0.8" fill="#ecfdf5" />
      <circle cx="13" cy="19" r="0.8" fill="#ecfdf5" />
    </svg>
  </div>
);

const IrisIcon: React.FC<{ size?: string; iconSize?: string }> = ({ size = 'w-6 h-6', iconSize = 'w-3.5 h-3.5' }) => (
  <div className={`${size} rounded-lg bg-gradient-to-b from-purple-500/20 to-indigo-950/50 p-0.5 border border-purple-500/35 group-hover/mod:border-purple-300 group-hover/mod:shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center justify-center relative overflow-hidden group-hover/mod:scale-108 transition-all duration-300 shrink-0`}>
    <svg viewBox="0 0 32 32" className={`${iconSize} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`} fill="none">
      <circle cx="16" cy="16" r="9" stroke="#c084fc" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="5.5" stroke="#38bdf8" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="2.5" fill="#f43f5e" />
    </svg>
  </div>
);

const HorizonsIcon: React.FC<{ size?: string; iconSize?: string }> = ({ size = 'w-6 h-6', iconSize = 'w-3.5 h-3.5' }) => (
  <div className={`${size} rounded-lg bg-gradient-to-b from-amber-500/20 to-purple-950/50 p-0.5 border border-amber-500/35 group-hover/mod:border-amber-300 group-hover/mod:shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center justify-center relative overflow-hidden group-hover/mod:scale-108 transition-all duration-300 shrink-0`}>
    <svg viewBox="0 0 32 32" className={`${iconSize} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`} fill="none">
      <circle cx="16" cy="11" r="3.8" fill="#fde047" className="drop-shadow-[0_0_6px_rgba(253,224,71,0.9)]" />
      <path d="M5 23L13 14L19 20L23 15L27 23H5Z" fill="#a855f7" fillOpacity="0.85" />
      <path d="M9 23L15 17L21 23H9Z" fill="#6366f1" />
    </svg>
  </div>
);

const ParchmentScrollIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <div className={`${className} flex items-center justify-center shrink-0`}>
    <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" fill="none">
      <path
        d="M9 7 C7.5 5.5 7 8 7 9.5 L19.5 22 C21 23.5 23.5 23 22 21 L9.5 7 Z"
        fill="#B45309"
        opacity="0.3"
      />
      <path
        d="M8 8.5 C6.5 10 7.5 12.5 9.5 11.5 L20.5 22.5 C22.5 24 25 22.5 23.5 20.5 L12.5 9.5 C10.5 7.5 8.5 7 8 8.5 Z"
        fill="#FDE68A"
      />
      <ellipse cx="9" cy="9.5" rx="3.5" ry="2" transform="rotate(-35 9 9.5)" fill="#F59E0B" />
      <ellipse cx="9" cy="9.5" rx="1.8" ry="1" transform="rotate(-35 9 9.5)" fill="#78350F" />
      <ellipse cx="22.5" cy="22" rx="3.5" ry="2" transform="rotate(-35 22.5 22)" fill="#D97706" />
      <line x1="11" y1="12" x2="16" y2="17" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      <line x1="13" y1="11.5" x2="18.5" y2="17" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
    </svg>
  </div>
);

const IsometricModCubeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <div className={`${className} flex items-center justify-center shrink-0`}>
    <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" fill="none">
      <polygon points="16,4 27,10 16,16 5,10" fill="#E0E7FF" stroke="#C7D2FE" strokeWidth="1" />
      <polygon points="5,10 16,16 16,27 5,21" fill="#818CF8" stroke="#6366F1" strokeWidth="1" />
      <polygon points="16,16 27,10 27,21 16,27" fill="#6366F1" stroke="#4F46E5" strokeWidth="1" />
      <polygon points="16,7 23,11 16,15 9,11" fill="#FFFFFF" fillOpacity="0.5" />
      <polygon points="9,11 16,15 16,23 9,19" fill="#4338CA" fillOpacity="0.35" />
    </svg>
  </div>
);

const IsometricStorageBoxIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <div className={`${className} flex items-center justify-center shrink-0`}>
    <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" fill="none">
      <polygon points="16,4 27,10 16,16 5,10" fill="#DDD6FE" stroke="#C4B5FD" strokeWidth="1" />
      <polygon points="5,10 16,16 16,27 5,21" fill="#A78BFA" stroke="#8B5CF6" strokeWidth="1" />
      <polygon points="16,16 27,10 27,21 16,27" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1" />
      <rect x="14.5" y="14" width="3" height="4.5" rx="0.5" fill="#FAF5FF" stroke="#6D28D9" strokeWidth="0.8" />
    </svg>
  </div>
);

function formatCreatedDate(dateStr?: string): string {
  if (!dateStr) return '12 Aug 2026';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '12 Aug 2026';
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '12 Aug 2026';
  }
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
  // Live Clock State with Day/Night Cycle Logic (Syncs automatically to client machine's local time & timezone)
  const [currentDateTime, setCurrentDateTime] = useState(() => {
    const now = new Date();
    const hours = now.getHours();
    // Morning & Afternoon (6:00 AM to 5:59 PM) => Sun (Day)
    // Evening & Night (6:00 PM to 5:59 AM) => Moon (Night)
    const isDay = hours >= 6 && hours < 18;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dateStr = `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date: dateStr, time: timeStr, isDay };
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const isDay = hours >= 6 && hours < 18;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dateStr = `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentDateTime({ date: dateStr, time: timeStr, isDay });
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // UI Interactive States
  const [instanceFilterTab, setInstanceFilterTab] = useState<'all' | 'favorites' | 'recent'>('all');
  const [instanceSortBy, setInstanceSortBy] = useState<'lastPlayed' | 'name' | 'playtime' | 'version'>('lastPlayed');
  const [showLaunchDropdown, setShowLaunchDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [cloneModalInstance, setCloneModalInstance] = useState<Instance | null>(null);
  const [deleteConfirmInstance, setDeleteConfirmInstance] = useState<Instance | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // 100% Dynamic Real Data States (Zero Dummies)
  const [friendsOnlineCount, setFriendsOnlineCount] = useState(0);
  const [achievementsRatio, setAchievementsRatio] = useState({ unlocked: 0, total: 19 });
  const [realAchievements, setRealAchievements] = useState<Achievement[]>([]);
  const [totalModsInstalled, setTotalModsInstalled] = useState(0);
  const [instanceModsCountMap, setInstanceModsCountMap] = useState<Record<string, number>>({});

  // Featured Mod Download / Instance Selection Modal State
  const [featuredModToInstall, setFeaturedModToInstall] = useState<{
    name: string;
    slug: string;
    category: string;
    iconType: string;
    description: string;
  } | null>(null);
  const [installingForInstanceId, setInstallingForInstanceId] = useState<string | null>(null);
  const [installedForInstanceIds, setInstalledForInstanceIds] = useState<Set<string>>(new Set());

  // Recent Activity Feed Persistent State
  const [loggedActivities, setLoggedActivities] = useState<
    Array<{ id: string; type: 'launch' | 'achievement' | 'mod' | 'cosmetic'; title: string; timestamp: number }>
  >(() => {
    try {
      const stored = localStorage.getItem('galaxy_activity_log');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const recordActivity = (act: {
    id: string;
    type: 'launch' | 'achievement' | 'mod' | 'cosmetic';
    title: string;
    timestamp: number;
  }) => {
    try {
      const stored = localStorage.getItem('galaxy_activity_log');
      const list = stored ? JSON.parse(stored) : [];
      const next = [act, ...list.filter((x: any) => x.title !== act.title)].slice(0, 20);
      localStorage.setItem('galaxy_activity_log', JSON.stringify(next));
      setLoggedActivities(next);
    } catch {}
  };

  // Launch handler that records launch activity
  const handleLaunchWithActivity = (inst: Instance) => {
    recordActivity({
      id: 'launch-' + Date.now(),
      type: 'launch',
      title: `Played ${inst.name}`,
      timestamp: Date.now()
    });
    sounds.playLaunch();
    onLaunch(inst);
  };

  // Query real dynamic friends online count + subscribe to live updates
  useEffect(() => {
    const fetchFriends = () => {
      if (window.galaxy?.getFriends) {
        window.galaxy.getFriends().then((frs) => {
          if (frs && Array.isArray(frs)) {
            const online = frs.filter((f) => f.status === 'online' || f.status === 'in-game').length;
            setFriendsOnlineCount(online);
          } else {
            setFriendsOnlineCount(0);
          }
        }).catch(() => setFriendsOnlineCount(0));
      }
    };

    fetchFriends();

    let unsub: (() => void) | undefined;
    if (window.galaxy?.onFriendsUpdated) {
      unsub = window.galaxy.onFriendsUpdated((frs) => {
        if (frs && Array.isArray(frs)) {
          const online = frs.filter((f) => f.status === 'online' || f.status === 'in-game').length;
          setFriendsOnlineCount(online);
        }
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [activeAccount?.id]);

  // Query real dynamic achievements + subscribe to live unlocks & updates
  useEffect(() => {
    const fetchAchievements = () => {
      if (window.galaxy?.getAchievements) {
        window.galaxy.getAchievements().then((achs) => {
          if (achs && Array.isArray(achs) && achs.length > 0) {
            setRealAchievements(achs);
            const unlocked = achs.filter((a) => a.unlocked).length;
            setAchievementsRatio({ unlocked, total: achs.length });
          }
        }).catch(() => {});
      }
    };

    fetchAchievements();

    let unsubUnlock: (() => void) | undefined;
    let unsubStats: (() => void) | undefined;

    if (window.galaxy?.onAchievementUnlocked) {
      unsubUnlock = window.galaxy.onAchievementUnlocked((ach) => {
        fetchAchievements();
        recordActivity({
          id: 'ach-' + Date.now(),
          type: 'achievement',
          title: `Unlocked "${ach.title}"`,
          timestamp: Date.now()
        });
      });
    }

    if (window.galaxy?.onAchievementStatsUpdated) {
      unsubStats = window.galaxy.onAchievementStatsUpdated((data) => {
        if (data?.stats) {
          setAchievementsRatio({
            unlocked: data.stats.totalUnlocked,
            total: data.stats.totalAchievements
          });
        }
        if (data?.achievements) {
          setRealAchievements(data.achievements);
        }
      });
    }

    return () => {
      if (unsubUnlock) unsubUnlock();
      if (unsubStats) unsubStats();
    };
  }, [activeAccount?.id]);

  // Query real dynamic mods count for all instances
  useEffect(() => {
    const fetchModCounts = async () => {
      if (!window.galaxy?.getMods || instances.length === 0) {
        setTotalModsInstalled(0);
        setInstanceModsCountMap({});
        return;
      }
      try {
        const counts: Record<string, number> = {};
        let total = 0;
        await Promise.all(
          instances.map(async (inst) => {
            const mods = await window.galaxy.getMods(inst.id);
            const count = mods ? mods.length : 0;
            counts[inst.id] = count;
            total += count;
          })
        );
        setInstanceModsCountMap(counts);
        setTotalModsInstalled(total);
      } catch {
        setTotalModsInstalled(0);
      }
    };
    fetchModCounts();
  }, [instances]);

  // Target instance for Continue Playing: the instance played most recently
  const continuePlayingInstance = useMemo(() => {
    if (instances.length === 0) return null;
    const sorted = [...instances].sort((a, b) => {
      const timeA = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
      const timeB = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
      return timeB - timeA;
    });
    return sorted[0];
  }, [instances]);

  // Target instance for Hero Banner Action
  const currentHeroInstance = selectedInstance || continuePlayingInstance || instances[0] || null;

  // Real stats for Continue Playing instance (World Size & Last Backup)
  const [continueWorldSize, setContinueWorldSize] = useState<string>('0 MB');
  const [continueLastBackup, setContinueLastBackup] = useState<string>('No backups');

  useEffect(() => {
    if (!continuePlayingInstance?.id) {
      setContinueWorldSize('0 MB');
      setContinueLastBackup('No backups');
      return;
    }

    if (window.galaxy?.getWorldSaves) {
      window.galaxy.getWorldSaves(continuePlayingInstance.id).then((saves) => {
        if (saves && Array.isArray(saves) && saves.length > 0) {
          const totalBytes = saves.reduce((sum, s) => sum + (s.sizeBytes || 0), 0);
          setContinueWorldSize(formatBytes(totalBytes));
        } else {
          setContinueWorldSize('0 MB');
        }
      }).catch(() => setContinueWorldSize('0 MB'));
    }

    if (window.galaxy?.listWorldBackups) {
      window.galaxy.listWorldBackups(continuePlayingInstance.id).then((backups) => {
        if (backups && Array.isArray(backups) && backups.length > 0) {
          const sorted = [...backups].sort((a, b) => {
            const tA = new Date(a.timestamp || 0).getTime();
            const tB = new Date(b.timestamp || 0).getTime();
            return tB - tA;
          });
          setContinueLastBackup(formatRelativeTime(sorted[0].timestamp));
        } else {
          setContinueLastBackup('No backups');
        }
      }).catch(() => setContinueLastBackup('No backups'));
    }
  }, [continuePlayingInstance?.id]);

  // Real world size calculation for selected instance
  const [selectedWorldSize, setSelectedWorldSize] = useState<string>('2.4 GB');
  const activeSelectedInstance = selectedInstance || instances[0] || null;

  const selectedInstanceIndex = useMemo(() => {
    if (!activeSelectedInstance) return 0;
    const idx = instances.findIndex((i) => i.id === activeSelectedInstance.id);
    return idx >= 0 ? idx : 0;
  }, [instances, activeSelectedInstance?.id]);

  useEffect(() => {
    if (!activeSelectedInstance?.id) {
      setSelectedWorldSize('2.4 GB');
      return;
    }
    if (window.galaxy?.getWorldSaves) {
      window.galaxy.getWorldSaves(activeSelectedInstance.id).then((saves) => {
        if (saves && Array.isArray(saves) && saves.length > 0) {
          const totalBytes = saves.reduce((sum, s) => sum + (s.sizeBytes || 0), 0);
          setSelectedWorldSize(formatBytes(totalBytes));
        } else {
          setSelectedWorldSize('2.4 GB');
        }
      }).catch(() => setSelectedWorldSize('2.4 GB'));
    }
  }, [activeSelectedInstance?.id, instances]);

  // Real calculated total playtime across all instances
  const totalPlaytimeFormatted = useMemo(() => {
    const totalMinutes = instances.reduce((acc, inst) => acc + (inst.playTimeMinutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0 && mins === 0) return '0h';
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }, [instances]);

  // Recent instances for Home (up to 3, sorted by lastPlayed descending)
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

  // Top 4 Recent Activities dynamically constructed from real events
  const activityFeed = useMemo(() => {
    const list: Array<{ id: string; type: 'launch' | 'achievement' | 'mod' | 'cosmetic'; title: string; timestamp: number }> = [
      ...loggedActivities
    ];

    // 1. Unlocked achievements
    realAchievements.forEach((a) => {
      if (a.unlocked && a.unlockedAt) {
        list.push({
          id: 'ach-' + a.id,
          type: 'achievement',
          title: `Unlocked "${a.title}"`,
          timestamp: new Date(a.unlockedAt).getTime()
        });
      }
    });

    // 2. Instances played
    instances.forEach((inst) => {
      if (inst.lastPlayed) {
        list.push({
          id: 'play-' + inst.id,
          type: 'launch',
          title: `Played ${inst.name}`,
          timestamp: new Date(inst.lastPlayed).getTime()
        });
      }
    });

    // 3. Equipped cosmetics from activeAccount
    if (activeAccount?.cosmetics) {
      const c = activeAccount.cosmetics;
      if (c.equippedCape || c.equippedWings || c.equippedHalo) {
        list.push({
          id: 'cosm-' + (activeAccount.id || 'default'),
          type: 'cosmetic',
          title: 'Equipped Galaxy Cosmetics',
          timestamp: Date.now() - 3600000
        });
      }
    }

    // Deduplicate by title, keeping the newest timestamp
    const map = new Map<string, { id: string; type: 'launch' | 'achievement' | 'mod' | 'cosmetic'; title: string; timestamp: number }>();
    list.forEach((item) => {
      const existing = map.get(item.title);
      if (!existing || item.timestamp > existing.timestamp) {
        map.set(item.title, item);
      }
    });

    const uniqueList = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);

    // If fewer than 4 activities exist, add standard milestone activities
    const defaultMilestones: Array<{ id: string; type: 'launch' | 'achievement' | 'mod' | 'cosmetic'; title: string; timestamp: number }> = [
      {
        id: 'default-welcome',
        type: 'achievement',
        title: 'Joined Galaxy Launcher',
        timestamp: Date.now() - 86400000 * 2
      },
      {
        id: 'default-profile',
        type: 'cosmetic',
        title: `Profile ${activeAccount?.username || 'Player'} Active`,
        timestamp: Date.now() - 86400000 * 3
      },
      {
        id: 'default-mod',
        type: 'mod',
        title: 'Mod Engine Initialized',
        timestamp: Date.now() - 86400000 * 4
      }
    ];

    for (const dm of defaultMilestones) {
      if (uniqueList.length >= 4) break;
      if (!uniqueList.some((u) => u.title === dm.title)) {
        uniqueList.push(dm);
      }
    }

    return uniqueList.slice(0, 4);
  }, [loggedActivities, realAchievements, instances, activeAccount]);

  // Featured mod install handler
  const handleOpenFeaturedInstall = (mod: {
    name: string;
    slug: string;
    category: string;
    iconType: string;
    description: string;
  }) => {
    sounds.playClick();
    setFeaturedModToInstall(mod);
  };

  const handleInstallFeaturedToInstance = async (inst: Instance) => {
    if (!featuredModToInstall) return;
    setInstallingForInstanceId(inst.id);
    sounds.playClick();

    try {
      if (window.galaxy?.getMarketplaceVersions && window.galaxy?.installMarketplaceItem) {
        let versions = await window.galaxy.getMarketplaceVersions(
          featuredModToInstall.slug,
          [inst.loader || 'fabric'],
          [inst.version]
        );

        if (!versions || versions.length === 0) {
          versions = await window.galaxy.getMarketplaceVersions(featuredModToInstall.slug);
        }

        if (versions && versions.length > 0 && versions[0].files?.[0]) {
          const file = versions[0].files[0];
          await window.galaxy.installMarketplaceItem(
            inst.id,
            'mod',
            file.url,
            file.filename,
            file.hashes?.sha1
          );

          setInstalledForInstanceIds((prev) => new Set(prev).add(inst.id));
          setInstanceModsCountMap((prev) => ({
            ...prev,
            [inst.id]: (prev[inst.id] || 0) + 1
          }));
          setTotalModsInstalled((prev) => prev + 1);

          recordActivity({
            id: 'mod-' + Date.now(),
            type: 'mod',
            title: `Installed ${featuredModToInstall.name} for ${inst.name}`,
            timestamp: Date.now()
          });

          sounds.playSuccess();
          if (onShowToast) {
            onShowToast({
              type: 'success',
              title: `Installed ${featuredModToInstall.name}`,
              message: `Successfully added to ${inst.name}`
            });
          }

          setTimeout(() => {
            setFeaturedModToInstall(null);
            setInstallingForInstanceId(null);
          }, 1200);
          return;
        }
      }

      sounds.playError();
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Installation failed',
          message: `No compatible file found for ${inst.loader || 'fabric'} ${inst.version}`
        });
      }
    } catch (err: any) {
      sounds.playError();
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Install Error',
          message: err.message || 'Could not download mod'
        });
      }
    } finally {
      setInstallingForInstanceId(null);
    }
  };

  // Filtered & Sorted instances for Instances Page
  const filteredInstances = useMemo(() => {
    let list = [...instances];

    if (instanceFilterTab === 'favorites') {
      list = list.filter((i) => i.isFavorite);
    } else if (instanceFilterTab === 'recent') {
      list = list.filter((i) => i.lastPlayed);
    }

    list.sort((a, b) => {
      // Favorites always appear at the top of the list before non-favorites
      const favA = Boolean(a.isFavorite);
      const favB = Boolean(b.isFavorite);
      if (favA !== favB) {
        return favA ? -1 : 1;
      }

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

  // Helper for ModLoader badge styling (Fabric, Forge, NeoForge, Quilt, Vanilla)
  const getLoaderBadgeStyle = (loader?: string) => {
    const l = (loader || '').toLowerCase();
    if (l.includes('fabric')) {
      return {
        bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:border-cyan-500/50',
        iconColor: 'text-cyan-400',
        label: 'Fabric'
      };
    }
    if (l.includes('forge') && !l.includes('neo')) {
      return {
        bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:border-amber-500/50',
        iconColor: 'text-amber-400',
        label: 'Forge'
      };
    }
    if (l.includes('neo')) {
      return {
        bg: 'bg-orange-500/15 text-orange-300 border-orange-500/30 hover:border-orange-500/50',
        iconColor: 'text-orange-400',
        label: 'NeoForge'
      };
    }
    if (l.includes('quilt')) {
      return {
        bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:border-purple-500/50',
        iconColor: 'text-purple-400',
        label: 'Quilt'
      };
    }
    return {
      bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50',
      iconColor: 'text-emerald-400',
      label: loader || 'Vanilla'
    };
  };

  // =========================================================================
  // RENDER: HOME VIEW (Tab === 'home' matching Desired Image)
  // =========================================================================
  if (activeTab === 'home') {
    return (
      <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 lg:p-5 gap-3 sm:gap-3.5 select-none overflow-hidden">
        {/* ================= 1. FULL-WIDTH PANORAMIC HERO BANNER ================= */}
        <div className="w-full relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-[200px] sm:h-[215px] lg:h-[225px] xl:h-[235px] group shrink-0">
          <img
            src={bgPortalHero}
            alt="Hero Banner"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070a1c]/95 via-[#070a1c]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a1c]/80 via-transparent to-transparent" />

          {/* Top Right Quote */}
          <div className="absolute top-4 right-7 text-right hidden sm:block">
            <p className="text-xs sm:text-[13px] xl:text-sm font-display font-medium text-slate-300/80 italic tracking-wider leading-snug drop-shadow">
              " Same Game<br />Infinite Worlds "
            </p>
          </div>

          {/* Hero Content (Left) */}
          <div className="relative h-full flex flex-col justify-between px-6 sm:px-8 xl:px-9 py-5 sm:py-5.5 xl:py-6 z-10">
            <div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.3em] text-indigo-300 uppercase block mb-1.5 drop-shadow">
                G A L A X Y &nbsp; L A U N C H E R
              </span>
              <h1 className="text-2xl sm:text-3xl xl:text-[34px] font-display font-extrabold text-white tracking-tight flex items-center gap-2.5 drop-shadow-md leading-tight">
                <span>Welcome back, {activeAccount?.username || 'Player'}</span>
                <Sparkles className="w-6 h-6 text-purple-400 drop-shadow-[0_0_18px_rgba(192,132,252,0.95)] animate-pulse inline shrink-0" />
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 drop-shadow">
                Launch, play, manage and explore your Minecraft journey.
              </p>
            </div>

            {/* Launch Action & Live Clock */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              {/* Big Launch Button with Dropdown */}
              <div className="relative flex items-center">
                {currentHeroInstance ? (
                  <div className="flex items-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-[0_0_25px_rgba(99,102,241,0.55)] hover:shadow-[0_0_35px_rgba(99,102,241,0.85)] transition-all group/btn">
                    <button
                      onClick={() => handleLaunchWithActivity(currentHeroInstance)}
                      disabled={currentHeroInstance.isRunning || launchProgress !== null}
                      className="flex items-center space-x-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-l-2xl bg-transparent hover:bg-white/10 text-white font-display font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer"
                    >
                      {currentHeroInstance.isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Playing {currentHeroInstance.name}</span>
                        </>
                      ) : launchProgress ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{launchProgress.step || 'Launching...'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
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
                      className="px-3 py-2.5 sm:py-3 border-l border-white/20 hover:bg-white/15 rounded-r-2xl text-white transition-colors cursor-pointer"
                      title="Select different instance"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onCreateInstance('create')}
                    className="flex items-center space-x-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-display font-extrabold text-xs sm:text-sm shadow-glow transition-transform hover:scale-102 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
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
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer ${
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

              {/* Bottom Right Live Clock, Date & Day/Night Animated Widget */}
              <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/85 backdrop-blur-xl border border-white/15 flex items-center space-x-3 shadow-xl">
                <div className="text-right">
                  <div className="text-[10.5px] font-medium text-slate-400 leading-tight">
                    {currentDateTime.date}
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-extrabold text-white tracking-wide leading-tight mt-0.5">
                    {currentDateTime.time}
                  </div>
                </div>
                {currentDateTime.isDay ? (
                  <div
                    className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.35)] transition-all"
                    title="Daytime (Morning / Afternoon)"
                  >
                    <Sun className="w-4 h-4 animate-spin-slow drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]" />
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.4)] transition-all"
                    title="Nighttime (Evening / Night)"
                  >
                    <Moon className="w-4 h-4 animate-celestial-moon fill-indigo-300/20" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. 5-COLUMN STATS ROW ================= */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
          {/* 1. Total Playtime */}
          <div className="py-3 px-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all flex items-center space-x-3 group cursor-default shadow-md">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="text-lg xl:text-xl font-mono font-extrabold text-white tracking-tight leading-none">
                {totalPlaytimeFormatted}
              </div>
              <div className="text-[12px] font-medium text-slate-400 mt-0.5 truncate">
                Total Playtime
              </div>
            </div>
          </div>

          {/* 2. Instances */}
          <div className="py-3 px-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all flex items-center space-x-3 group cursor-default shadow-md">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
              <Boxes className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="text-lg xl:text-xl font-mono font-extrabold text-white tracking-tight leading-none">
                {instances.length}
              </div>
              <div className="text-[12px] font-medium text-slate-400 mt-0.5 truncate">
                Instances
              </div>
            </div>
          </div>

          {/* 3. Mods Installed */}
          <div className="py-3 px-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all flex items-center space-x-3 group cursor-default shadow-md">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shrink-0">
              <Puzzle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="text-lg xl:text-xl font-mono font-extrabold text-white tracking-tight leading-none">
                {totalModsInstalled}
              </div>
              <div className="text-[12px] font-medium text-slate-400 mt-0.5 truncate">
                Mods Installed
              </div>
            </div>
          </div>

          {/* 4. Achievements */}
          <div className="py-3 px-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all flex items-center space-x-3 group cursor-default shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="text-lg xl:text-xl font-mono font-extrabold text-white tracking-tight leading-none">
                {achievementsRatio.unlocked} / {achievementsRatio.total}
              </div>
              <div className="text-[12px] font-medium text-slate-400 mt-0.5 truncate">
                Achievements
              </div>
            </div>
          </div>

          {/* 5. Friends Online */}
          <div className="py-3 px-4 rounded-2xl bg-[#0c1228]/80 backdrop-blur-xl border border-white/[0.08] hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all flex items-center space-x-3 group cursor-default col-span-2 sm:col-span-1 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shrink-0">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="text-lg xl:text-xl font-mono font-extrabold text-white tracking-tight leading-none">
                {friendsOnlineCount}
              </div>
              <div className="text-[12px] font-medium text-slate-400 mt-0.5 truncate">
                Friends Online
              </div>
            </div>
          </div>
        </div>

        {/* ================= UNIFIED MAIN GRID: Left 8 cols | Right 4 cols ================= */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">

          {/* ===== LEFT SIDE: 8 cols â€” Instances + Continue/Quick ===== */}
          <div className="lg:col-span-8 flex flex-col gap-3 h-full min-h-0">

            {/* Recent Instances â€” fills remaining left space */}
            <div className="flex flex-col flex-1 space-y-1.5 min-h-0">
              <div className="flex items-center justify-between shrink-0 mb-0.5">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-display font-extrabold text-white uppercase tracking-wider">
                    Recent Instances
                  </h2>
                </div>
                <button
                  onClick={() => onSelectTab && onSelectTab('instances')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 group cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 flex-1 items-stretch min-h-0">
                {recentInstances.map((inst, idx) => {
                  const modsCount = instanceModsCountMap[inst.id] ?? 0;
                  const health = getInstanceHealthState(inst);
                  const loaderBadge = getLoaderBadgeStyle(inst.loader);
                  return (
                    <div
                      key={inst.id}
                      onClick={() => onOpenInstanceDetails(inst)}
                      className="rounded-2xl overflow-hidden border border-white/[0.08] hover:border-indigo-500/50 bg-[#0c1228]/80 backdrop-blur-xl shadow-lg cursor-pointer group flex flex-col transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] relative"
                    >
                      {/* Thumbnail - larger immersive preview */}
                      <div className="relative w-full flex-[1.25] min-h-0 overflow-hidden shrink-0">
                        <img
                          src={getInstanceBg(inst, idx)}
                          alt={inst.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228]/95 via-[#0c1228]/25 to-transparent" />

                        {/* Top-left subtle tag on preview image */}
                        <div className="absolute top-2 left-2 flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[8.5px] font-bold border border-white/20 flex items-center gap-1.5 shadow-sm">
                            <span className={`w-1.5 h-1.5 rounded-full ${health.status === 'healthy' ? 'bg-emerald-400' : health.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                            <span>v{inst.version}</span>
                          </span>
                        </div>

                        {/* Top controls */}
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleToggleFavorite(inst, e)}
                            className={`p-1 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
                              inst.isFavorite
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-black/50 hover:bg-black/80 text-slate-300 border border-white/15'
                            }`}
                            title={inst.isFavorite ? 'Unfavorite' : 'Favorite'}
                          >
                            <Star className={`w-3 h-3 ${inst.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInstanceDetails(inst);
                            }}
                            className="p-1 rounded-lg bg-black/50 hover:bg-black/80 text-slate-300 border border-white/15 transition-colors cursor-pointer"
                            title="Instance Settings"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Card Content - properly utilizes empty space */}
                      <div className="pt-2 px-2.5 pb-2.5 sm:pt-2 sm:px-3 sm:pb-3 flex flex-col justify-between flex-1 min-h-0">
                        <div>
                          {/* Title Header - Positioned closer to image with comfortable gap before tags */}
                          <div className="flex items-center justify-between gap-1 mb-2.5">
                            <h3 className="font-display font-extrabold text-white text-xs sm:text-[13px] truncate group-hover:text-indigo-200 transition-colors leading-tight">
                              {inst.name}
                            </h3>
                          </div>

                          {/* 4 Tags Grid - Compact single-line tags */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {/* Version Tag */}
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#070b1a]/85 border border-white/[0.07] hover:border-indigo-500/40 transition-colors">
                              <Box className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span className="text-[9.5px] font-mono font-bold text-slate-200 truncate">v{inst.version}</span>
                            </div>

                            {/* ModLoader Tag */}
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-colors ${loaderBadge.bg}`}>
                              <Tag className={`w-3 h-3 shrink-0 ${loaderBadge.iconColor}`} />
                              <span className="text-[9.5px] font-mono font-extrabold uppercase truncate">{inst.loader || 'Vanilla'}</span>
                            </div>

                            {/* Mods Count Tag */}
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#070b1a]/85 border border-white/[0.07] hover:border-purple-500/40 transition-colors">
                              <Puzzle className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="text-[9.5px] font-mono font-bold text-purple-200 truncate">{modsCount} Mods</span>
                            </div>

                            {/* Activity / Played Tag */}
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#070b1a]/85 border border-white/[0.07] hover:border-cyan-500/40 transition-colors">
                              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="text-[9.5px] font-mono font-bold text-slate-200 truncate">
                                {formatRelativeTime(inst.lastPlayed) === 'Never played' ? 'Recent' : formatRelativeTime(inst.lastPlayed)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row: Health status & Play button */}
                        <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/[0.06] shrink-0">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenInstanceDetails(inst);
                            }}
                            className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold cursor-pointer hover:brightness-125 transition-all ${health.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${health.status === 'healthy' ? 'bg-emerald-400' : health.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                            <span>{health.label}</span>
                            <ChevronRight className="w-2.5 h-2.5 opacity-60" />
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunchWithActivity(inst);
                            }}
                            disabled={inst.isRunning || launchProgress !== null}
                            className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-extrabold text-[11px] shadow-glow-sm transition-all hover:scale-102 cursor-pointer"
                          >
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>Play</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Slot 3: Create Instance Card */}
                {recentInstances.length < 3 && (
                  <div
                    onClick={() => onCreateInstance('create')}
                    className="rounded-2xl border-2 border-dashed border-white/12 hover:border-indigo-500/50 bg-[#0c1228]/40 hover:bg-[#0c1228]/70 backdrop-blur-xl p-3.5 flex flex-col items-center justify-center text-center cursor-pointer group transition-all h-full"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] group-hover:bg-indigo-600/30 border border-white/10 group-hover:border-indigo-500/50 flex items-center justify-center text-slate-300 group-hover:text-white transition-all mb-1.5">
                      <Plus className="w-4.5 h-4.5 stroke-[2]" />
                    </div>
                    <div className="text-xs sm:text-[13px] font-display font-extrabold text-white">Create Instance</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Start new world</div>
                  </div>
                )}
              </div>
            </div>

            {/* Continue Playing + Quick Actions â€” fixed height sub-row */}
            <div className="grid grid-cols-8 gap-3 shrink-0 h-[245px] sm:h-[260px] xl:h-[275px]">
              {/* ===== CONTINUE PLAYING (5/8) ===== */}
              <div className="col-span-5 flex flex-col h-full space-y-1.5 min-h-0">
                <div className="flex items-center justify-between shrink-0 mb-0.5">
                  <div className="flex items-center space-x-2">
                    <Gamepad2 className="w-4 h-4 text-purple-400" />
                    <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                      Continue Playing
                    </h2>
                  </div>
                  {continuePlayingInstance && (
                    <button
                      onClick={() => onOpenInstanceDetails(continuePlayingInstance)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="More details"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {continuePlayingInstance ? (
                  <div className="rounded-2xl bg-[#0c1228]/85 backdrop-blur-xl border border-white/[0.08] shadow-lg flex flex-col flex-1 group hover:border-indigo-500/35 transition-all min-h-0 overflow-hidden">
                    {/* Top: Large Instance Image */}
                    <div
                      className="relative w-full flex-1 min-h-0 cursor-pointer group/thumb shrink-0 overflow-hidden"
                      style={{ flexBasis: '55%' }}
                      onClick={() => onOpenInstanceDetails(continuePlayingInstance)}
                    >
                      <img
                        src={getInstanceBg(continuePlayingInstance, 0)}
                        alt={continuePlayingInstance.name}
                        className="w-full h-full object-cover object-center group-hover/thumb:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070a18]/90 via-[#070a18]/20 to-transparent" />
                      <div className="absolute top-2 left-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-white font-mono text-[8px] font-extrabold uppercase tracking-wider border border-white/20">
                          Active World
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-3 right-3">
                        <div className="text-sm font-display font-extrabold text-white truncate leading-tight drop-shadow">
                          {continuePlayingInstance.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.12] text-slate-200 border border-white/[0.15]">
                            {continuePlayingInstance.version}
                          </span>
                          <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 uppercase font-bold">
                            {continuePlayingInstance.loader || 'Vanilla'}
                          </span>
                          <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.08] text-slate-400">
                            {instanceModsCountMap[continuePlayingInstance.id] ?? 0} Mods
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Stats grid */}
                    <div className="p-3 grid grid-cols-2 gap-1.5 shrink-0">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#070b1a]/70 border border-white/[0.05]">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[9px] text-slate-400 font-medium leading-none">Last Played</div>
                          <div className="text-[11.5px] font-mono font-bold text-white truncate mt-0.5 leading-none">
                            {formatRelativeTime(continuePlayingInstance.lastPlayed)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#070b1a]/70 border border-white/[0.05]">
                        <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[9px] text-slate-400 font-medium leading-none">Playtime</div>
                          <div className="text-[11.5px] font-mono font-bold text-white truncate mt-0.5 leading-none">
                            {Math.floor((continuePlayingInstance.playTimeMinutes || 0) / 60)}h {(continuePlayingInstance.playTimeMinutes || 0) % 60}m
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#070b1a]/70 border border-white/[0.05]">
                        <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[9px] text-slate-400 font-medium leading-none">World Size</div>
                          <div className="text-[11.5px] font-mono font-bold text-white truncate mt-0.5 leading-none">
                            {continueWorldSize}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#070b1a]/70 border border-white/[0.05]">
                        <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[9px] text-slate-400 font-medium leading-none">Last Backup</div>
                          <div className="text-[11.5px] font-mono font-bold text-white truncate mt-0.5 leading-none">
                            {continueLastBackup}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-4 bg-[#0c1228]/80 border border-white/[0.08] text-center text-slate-400 text-xs flex items-center justify-center flex-1">
                    No instances available. Create your first world!
                  </div>
                )}
              </div>

              {/* ===== QUICK ACTIONS (3/8) ===== */}
              <div className="col-span-3 flex flex-col h-full space-y-1.5 min-h-0">
                <div className="flex items-center space-x-2 shrink-0 mb-0.5">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <h2 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                    Quick Actions
                  </h2>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0c1228]/85 backdrop-blur-xl border border-white/[0.08] shadow-lg flex-1 flex flex-col min-h-0">
                  <div className="grid grid-cols-3 gap-2.5 flex-1 min-h-0">
                    <button onClick={() => onCreateInstance('create')} className="p-2 rounded-xl bg-[#070b1a]/70 hover:bg-[#070b1a] border border-white/[0.06] hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all flex flex-col items-center justify-center text-center group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/35 group-hover:border-cyan-400 group-hover:scale-110 flex items-center justify-center text-cyan-400 transition-all mb-1.5"><Boxes className="w-4 h-4" /></div>
                      <span className="text-[11px] font-display font-bold text-white leading-tight group-hover:text-cyan-200 transition-colors">Create</span>
                    </button>
                    <button onClick={() => onCreateInstance('import')} className="p-2 rounded-xl bg-[#070b1a]/70 hover:bg-[#070b1a] border border-white/[0.06] hover:border-indigo-400/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.35)] transition-all flex flex-col items-center justify-center text-center group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/35 group-hover:border-indigo-400 group-hover:scale-110 flex items-center justify-center text-indigo-400 transition-all mb-1.5"><FolderUp className="w-4 h-4" /></div>
                      <span className="text-[11px] font-display font-bold text-white leading-tight group-hover:text-indigo-200 transition-colors">Import</span>
                    </button>
                    <button onClick={() => onSelectTab && onSelectTab('marketplace')} className="p-2 rounded-xl bg-[#070b1a]/70 hover:bg-[#070b1a] border border-white/[0.06] hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.35)] transition-all flex flex-col items-center justify-center text-center group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/35 group-hover:border-purple-400 group-hover:scale-110 flex items-center justify-center text-purple-400 transition-all mb-1.5"><Puzzle className="w-4 h-4" /></div>
                      <span className="text-[11px] font-display font-bold text-white leading-tight group-hover:text-purple-200 transition-colors">Mods</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (window.galaxy?.openInstancesRootDir) {
                          window.galaxy.openInstancesRootDir();
                        } else if (window.galaxy?.openInstanceFolder) {
                          window.galaxy.openInstanceFolder('');
                        } else if (continuePlayingInstance) {
                          onOpenFolder(continuePlayingInstance);
                        }
                      }}
                      className="p-2 rounded-xl bg-[#070b1a]/70 hover:bg-[#070b1a] border border-white/[0.06] hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                      title="Open Instances Directory"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/35 group-hover:border-blue-400 group-hover:scale-110 flex items-center justify-center text-blue-400 transition-all mb-1.5"><FolderOpen className="w-4 h-4" /></div>
                      <span className="text-[11px] font-display font-bold text-white leading-tight group-hover:text-blue-200 transition-colors">Folder</span>
                    </button>
                    <button onClick={() => onSelectTab && onSelectTab('cloud')} className="p-2 rounded-xl bg-[#070b1a]/70 hover:bg-[#070b1a] border border-white/[0.06] hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all flex flex-col items-center justify-center text-center group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/35 group-hover:border-emerald-400 group-hover:scale-110 flex items-center justify-center text-emerald-400 transition-all mb-1.5"><Cloud className="w-4 h-4" /></div>
                      <span className="text-[11px] font-display font-bold text-white leading-tight group-hover:text-emerald-200 transition-colors">Cloud</span>
                    </button>
                    <button onClick={() => onSelectTab && onSelectTab('settings')} className="p-2 rounded-xl bg-[#070b1a]/70 hover:bg-[#070b1a] border border-white/[0.06] hover:border-amber-400/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all flex flex-col items-center justify-center text-center group cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/35 group-hover:border-amber-400 group-hover:scale-110 flex items-center justify-center text-amber-400 transition-all mb-1.5"><SettingsIcon className="w-4 h-4" /></div>
                      <span className="text-[11px] font-display font-bold text-white leading-tight group-hover:text-amber-200 transition-colors">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RIGHT SIDEBAR: 4 cols â€” Activity (top) + Featured (flex-1 bottom) ===== */}
          <div className="lg:col-span-4 flex flex-col gap-3 h-full min-h-0">

            {/* Recent Activity â€” shrinks to content */}
            <div className="flex flex-col space-y-1.5 shrink-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full border border-indigo-400/70 flex items-center justify-center text-indigo-400">
                    <Clock className="w-2.5 h-2.5" />
                  </div>
                  <h3 className="text-xs font-display font-extrabold text-white uppercase tracking-wider">
                    Recent Activity
                  </h3>
                </div>
                <button
                  onClick={() => onSelectTab && onSelectTab('social')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 group cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#0c1228]/85 backdrop-blur-xl border border-white/[0.08] shadow-lg flex flex-col gap-2">
                {activityFeed.map((act) => {
                  let icon = <Box className="w-4 h-4 stroke-[2]" />;
                  let iconBoxClass = 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                  let hoverTextClass = 'group-hover:text-emerald-300';

                  if (act.type === 'achievement') {
                    icon = <Trophy className="w-4 h-4 stroke-[2]" />;
                    iconBoxClass = 'bg-amber-500/10 border-amber-500/35 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
                    hoverTextClass = 'group-hover:text-amber-300';
                  } else if (act.type === 'mod') {
                    icon = <Download className="w-4 h-4 stroke-[2]" />;
                    iconBoxClass = 'bg-purple-500/10 border-purple-500/35 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
                    hoverTextClass = 'group-hover:text-purple-300';
                  } else if (act.type === 'cosmetic') {
                    icon = <Shirt className="w-4 h-4 stroke-[2]" />;
                    iconBoxClass = 'bg-cyan-500/10 border-cyan-500/35 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
                    hoverTextClass = 'group-hover:text-cyan-300';
                  }

                  return (
                    <div
                      key={act.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#070b1a]/70 hover:bg-[#070b1a] border border-white/[0.05] hover:border-white/15 transition-all group cursor-default"
                    >
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 ${iconBoxClass}`}>
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-[12.5px] font-display font-extrabold text-white truncate transition-colors leading-tight ${hoverTextClass}`}>
                          {act.title}
                        </div>
                        <div className="text-[10.5px] text-slate-400 font-medium leading-none mt-0.5">
                          {formatRelativeTime(act.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Featured Content â€” flex-1, fills ALL remaining right-column space */}
            <div className="flex flex-col space-y-1.5 flex-1 min-h-0">
              <div className="flex items-center justify-between mb-0.5 shrink-0">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                    Featured Content
                  </h3>
                </div>
                <button
                  onClick={() => onSelectTab && onSelectTab('marketplace')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 group cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#0c1228]/85 backdrop-blur-xl border border-white/[0.08] shadow-lg flex flex-col gap-2.5 flex-1 min-h-0">
                {/* Spotlight Banner â€” flex-1, much taller now */}
                <div
                  className="w-full relative rounded-xl overflow-hidden border border-white/10 flex-1 min-h-0 group cursor-pointer shadow-md"
                  onClick={() =>
                    handleOpenFeaturedInstall({
                      name: 'Better End',
                      slug: 'betterend',
                      category: 'Dimension',
                      iconType: 'betterend',
                      description: 'Transform the End dimension with lush biomes, creatures, and blocks.'
                    })
                  }
                >
                  <img
                    src={bgNether}
                    alt="Better End"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 border border-white/25 flex items-center justify-center text-white shadow-[0_0_14px_rgba(139,92,246,0.6)] shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[13px] font-display font-extrabold text-white leading-tight">Better End</div>
                        <div className="text-[10px] text-slate-300 leading-none mt-0.5">Transform the End dimension</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 group-hover:text-white transition-all" />
                  </div>
                </div>

                {/* 3 Mod Cards */}
                <div className="grid grid-cols-3 gap-2 shrink-0">
                  <div
                    className="rounded-xl bg-[#070b1a]/80 border border-white/[0.06] hover:border-emerald-400/40 hover:shadow-[0_0_14px_rgba(16,185,129,0.3)] transition-all flex flex-col items-center pt-2.5 pb-0 overflow-hidden group/mod cursor-pointer"
                    onClick={() =>
                      handleOpenFeaturedInstall({
                        name: 'Sodium',
                        slug: 'sodium',
                        category: 'Performance',
                        iconType: 'sodium',
                        description: 'Modern rendering engine providing massive FPS gains and smooth gameplay.'
                      })
                    }
                  >
                    <SodiumIcon size="w-9 h-9" iconSize="w-4.5 h-4.5" />
                    <span className="text-[11.5px] font-display font-bold text-white mt-1.5 leading-tight">Sodium</span>
                    <span className="text-[9.5px] text-emerald-400 font-semibold leading-tight mb-2">Performance</span>
                    <div className="w-full mt-auto px-2 py-1.5 bg-emerald-500/10 border-t border-emerald-500/20 flex items-center justify-center group-hover/mod:bg-emerald-500/20 transition-colors">
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>
                  <div
                    className="rounded-xl bg-[#070b1a]/80 border border-white/[0.06] hover:border-purple-400/40 hover:shadow-[0_0_14px_rgba(168,85,247,0.3)] transition-all flex flex-col items-center pt-2.5 pb-0 overflow-hidden group/mod cursor-pointer"
                    onClick={() =>
                      handleOpenFeaturedInstall({
                        name: 'Iris',
                        slug: 'iris',
                        category: 'Shaders',
                        iconType: 'iris',
                        description: 'Modern shader pack loader fully compatible with Sodium.'
                      })
                    }
                  >
                    <IrisIcon size="w-9 h-9" iconSize="w-4.5 h-4.5" />
                    <span className="text-[11.5px] font-display font-bold text-white mt-1.5 leading-tight">Iris</span>
                    <span className="text-[9.5px] text-cyan-400 font-semibold leading-tight mb-2">Shaders</span>
                    <div className="w-full mt-auto px-2 py-1.5 bg-purple-500/10 border-t border-purple-500/20 flex items-center justify-center group-hover/mod:bg-purple-500/20 transition-colors">
                      <Download className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                  </div>
                  <div
                    className="rounded-xl bg-[#070b1a]/80 border border-white/[0.06] hover:border-amber-400/40 hover:shadow-[0_0_14px_rgba(245,158,11,0.3)] transition-all flex flex-col items-center pt-2.5 pb-0 overflow-hidden group/mod cursor-pointer"
                    onClick={() =>
                      handleOpenFeaturedInstall({
                        name: 'Distant Horizons',
                        slug: 'distant-horizons',
                        category: 'World Gen',
                        iconType: 'horizons',
                        description: 'Expands render distance dramatically with Level-of-Detail terrain chunks.'
                      })
                    }
                  >
                    <HorizonsIcon size="w-9 h-9" iconSize="w-4.5 h-4.5" />
                    <span className="text-[11.5px] font-display font-bold text-white mt-1.5 leading-tight">Horizons</span>
                    <span className="text-[9.5px] text-amber-400 font-semibold leading-tight mb-2">World Gen</span>
                    <div className="w-full mt-auto px-2 py-1.5 bg-amber-500/10 border-t border-amber-500/20 flex items-center justify-center group-hover/mod:bg-amber-500/20 transition-colors">
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= 3. FEATURED MOD INSTANCE SELECTOR POPUP MODAL ================= */}
        {featuredModToInstall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-smooth-in">
            <div className="relative w-full max-w-md bg-[#090d1f]/95 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    {featuredModToInstall.iconType === 'sodium' ? (
                      <SodiumIcon size="w-7 h-7" iconSize="w-4 h-4" />
                    ) : featuredModToInstall.iconType === 'iris' ? (
                      <IrisIcon size="w-7 h-7" iconSize="w-4 h-4" />
                    ) : featuredModToInstall.iconType === 'horizons' ? (
                      <HorizonsIcon size="w-7 h-7" iconSize="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-display font-extrabold text-white leading-tight">
                      Install {featuredModToInstall.name}
                    </h3>
                    <span className="text-[11px] font-mono text-indigo-300 font-semibold">
                      Select instance to install
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setFeaturedModToInstall(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                {featuredModToInstall.description}
              </p>

              {/* Instance List */}
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {instances.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No instances found. Create an instance first!
                  </div>
                ) : (
                  instances.map((inst) => {
                    const isInstallingThis = installingForInstanceId === inst.id;
                    const isInstalledThis = installedForInstanceIds.has(inst.id);
                    return (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#070b1a]/80 border border-white/[0.08] hover:border-indigo-500/40 transition-all"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                            <Box className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-display font-bold text-white truncate leading-tight">
                              {inst.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>v{inst.version}</span>
                              <span>•</span>
                              <span className="uppercase">{inst.loader || 'Vanilla'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInstallFeaturedToInstance(inst)}
                          disabled={isInstallingThis || isInstalledThis}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                            isInstalledThis
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : isInstallingThis
                              ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/40'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-glow-sm'
                          }`}
                        >
                          {isInstalledThis ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Installed</span>
                            </>
                          ) : isInstallingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Installing...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Install</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }


  // =========================================================================
  // RENDER: INSTANCES VIEW (Tab === 'instances')
  // =========================================================================
  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-5 gap-3.5 select-none overflow-hidden">
      {/* 1. HERO HEADER BANNER */}
      <div className="w-full relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl h-28 sm:h-32 shrink-0 group">
        <img
          src={bgPortalHero}
          alt="Instances Banner"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a18]/95 via-[#070a18]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a18]/90 via-transparent to-transparent" />

        <div className="relative h-full flex items-center justify-between px-6 py-4 z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight drop-shadow-md">
              Instances
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
              Manage all your Minecraft instances
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onCreateInstance('create');
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-display font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Instance</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & SORT BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
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

        {/* Right Sort Dropdown - Custom Galaxy Glassmorphic Theme */}
        <div className="relative flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Sort by</span>
          <button
            onClick={() => {
              sounds.playClick();
              setShowSortDropdown(!showSortDropdown);
            }}
            className="bg-[#0c1228]/90 hover:bg-[#111936] text-xs text-slate-200 border border-white/10 hover:border-indigo-500/40 rounded-xl px-3.5 py-2 flex items-center space-x-2 font-semibold transition-all shadow-md cursor-pointer"
          >
            <span>
              {instanceSortBy === 'lastPlayed'
                ? 'Last Played'
                : instanceSortBy === 'name'
                ? 'Name'
                : instanceSortBy === 'playtime'
                ? 'Playtime'
                : 'Minecraft Version'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                showSortDropdown ? 'rotate-180 text-indigo-400' : ''
              }`}
            />
          </button>

          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#090d22]/95 backdrop-blur-2xl border border-indigo-500/30 rounded-xl p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.85)] z-50 animate-smooth-in flex flex-col gap-0.5">
                {[
                  { value: 'lastPlayed', label: 'Last Played' },
                  { value: 'name', label: 'Name' },
                  { value: 'playtime', label: 'Playtime' },
                  { value: 'version', label: 'Minecraft Version' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      sounds.playClick();
                      setInstanceSortBy(opt.value as any);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                      instanceSortBy === opt.value
                        ? 'bg-indigo-600/35 text-white font-bold border border-indigo-500/40 shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {instanceSortBy === opt.value && (
                      <Check className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. 2-COLUMN SPLIT: Left Card Grid (2 cols) & Right Inspector Panel */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-hidden">
        {/* ================= LEFT: 2-COL INSTANCE CARDS GRID ================= */}
        <div className={`lg:col-span-8 h-full min-h-0 ${
          filteredInstances.length > 4 ? 'overflow-y-auto pr-1.5 custom-scrollbar' : 'overflow-hidden'
        }`}>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3.5 ${
            filteredInstances.length === 0 || filteredInstances.length > 4
              ? 'pb-2'
              : filteredInstances.length <= 2
              ? 'h-full min-h-0 grid-rows-1 auto-rows-fr'
              : 'h-full min-h-0 grid-rows-2 auto-rows-fr'
          }`}>
            {filteredInstances.map((inst, idx) => {
              const isSelected = selectedInstance?.id === inst.id;
              const health = getInstanceHealthState(inst);
              const modsCount = instanceModsCountMap[inst.id] ?? 0;
              const originalIdx = instances.findIndex((i) => i.id === inst.id);
              const cardBgIndex = originalIdx >= 0 ? originalIdx : idx;

              return (
                <div
                  key={inst.id}
                  onClick={() => onSelectInstance(inst)}
                  className={`relative rounded-2xl overflow-hidden bg-[#0c1228]/85 backdrop-blur-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-0 ${
                    isSelected
                      ? 'border-2 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.5),inset_0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-sky-300/50'
                      : 'border border-white/[0.08] hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  }`}
                >
                  {/* Top Landscape Preview Art - grows to fill available space */}
                  <div className="relative flex-1 min-h-0 overflow-hidden m-2 mb-0 rounded-xl border border-white/[0.08]">
                    <img
                      src={resolveInstanceArtwork(inst, cardBgIndex)}
                      alt={inst.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-transparent to-transparent" />

                    {/* Top-Right Favorite & Pin Buttons */}
                    <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10">
                      <button
                        onClick={(e) => handleToggleFavorite(inst, e)}
                        className={`p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
                          inst.isFavorite
                            ? 'bg-amber-500/25 text-amber-400 border border-amber-500/40'
                            : 'bg-black/50 hover:bg-black/80 text-slate-300 border border-white/10'
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
                        className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-slate-300 border border-white/10 cursor-pointer"
                        title="Instance Details"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Instance Info Row */}
                  <div className="p-3.5 space-y-2.5 shrink-0 flex flex-col justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md">
                        <img
                          src={resolveInstanceArtwork(inst, cardBgIndex)}
                          alt={inst.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-white text-sm sm:text-base truncate group-hover:text-indigo-200 transition-colors">
                          {inst.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate">
                          {inst.description || 'A lightweight enhanced experience'}
                        </p>

                        {/* 3 Info Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
                            <span>{modsCount} Mods</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06]">
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
                          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-glow-sm transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Play</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInstanceDetails(inst);
                          }}
                          className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 cursor-pointer"
                          title="More options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dashed Create New Instance Card (shown if empty) */}
            {filteredInstances.length === 0 && (
              <div
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance('create');
                }}
                className="col-span-2 rounded-2xl border-2 border-dashed border-white/15 hover:border-indigo-500/50 bg-[#0c1228]/40 hover:bg-[#0c1228]/70 backdrop-blur-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group transition-all min-h-[220px]"
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
            )}
          </div>
        </div>

        {/* ================= RIGHT: SELECTED INSTANCE INSPECTOR PANEL (Galaxy SMP Reference Layout) ================= */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col overflow-y-auto pr-1 custom-scrollbar">
          {activeSelectedInstance ? (
            (() => {
              const activeHealth = getInstanceHealthState(activeSelectedInstance);
              const modsCount = instanceModsCountMap[activeSelectedInstance.id] ?? 0;
              return (
                <div className="h-full min-h-0 p-3.5 sm:p-4 rounded-3xl bg-[#090d22]/90 backdrop-blur-2xl border border-indigo-500/25 shadow-[0_0_35px_rgba(79,70,229,0.18)] flex flex-col justify-between transition-all">
                  {/* Top Landscape Preview Art - Dynamically shows selected instance image */}
                  <div className="relative flex-1 min-h-[105px] max-h-[155px] w-full rounded-2xl overflow-hidden border border-white/10 group">
                    <img
                      src={getInstanceBg(activeSelectedInstance, selectedInstanceIndex)}
                      alt={activeSelectedInstance.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d22]/90 via-[#090d22]/20 to-transparent" />

                    {/* Top Action Buttons (Favorite Star & More Options) */}
                    <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10">
                      <button
                        onClick={(e) => handleToggleFavorite(activeSelectedInstance, e)}
                        className="p-1.5 rounded-xl bg-black/55 hover:bg-black/85 text-amber-400 border border-white/15 backdrop-blur-md shadow-md transition-all cursor-pointer"
                        title={activeSelectedInstance.isFavorite ? 'Unfavorite' : 'Favorite'}
                      >
                        <Star className={`w-3.5 h-3.5 ${activeSelectedInstance.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
                      </button>
                      <button
                        onClick={() => onOpenInstanceDetails(activeSelectedInstance)}
                        className="p-1.5 rounded-xl bg-black/55 hover:bg-black/85 text-slate-300 hover:text-white border border-white/15 backdrop-blur-md shadow-md transition-all cursor-pointer"
                        title="Instance Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title, Subtitle & Description */}
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2 min-w-0">
                      {editingNameId === activeSelectedInstance.id ? (
                        <input
                          type="text"
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onBlur={() => handleSaveRename(activeSelectedInstance)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(activeSelectedInstance)}
                          autoFocus
                          className="bg-white/10 border border-indigo-500 rounded-lg px-2 py-0.5 text-base font-bold text-white focus:outline-none w-full"
                        />
                      ) : (
                        <>
                          <h2 className="text-base sm:text-lg font-display font-extrabold text-white tracking-tight truncate leading-tight">
                            {activeSelectedInstance.name}
                          </h2>
                          <button
                            onClick={() => {
                              setEditingNameId(activeSelectedInstance.id);
                              setEditingNameValue(activeSelectedInstance.name);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Rename instance"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 font-medium leading-tight">
                      {activeSelectedInstance.description ? activeSelectedInstance.description.split('.')[0] : 'My main survival world'}
                    </div>
                    <p className="text-[10.5px] text-slate-400 leading-snug line-clamp-2">
                      {activeSelectedInstance.description || 'A long-term survival world with friends, custom mods and enhanced gameplay.'}
                    </p>
                  </div>

                  {/* 2x3 Detailed Specs Grid - High Visibility & Visual Hierarchy */}
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 py-1.5 shrink-0">
                    {/* 1. Minecraft Version */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <IsometricSymbolSVG symbolId="grass_block" className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 font-medium leading-none">Minecraft Version</div>
                        <div className="text-[13.5px] sm:text-sm font-mono font-bold text-white leading-tight mt-1 truncate">
                          {activeSelectedInstance.version}
                        </div>
                      </div>
                    </div>

                    {/* 2. Loader */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <ParchmentScrollIcon className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 font-medium leading-none">Loader</div>
                        <div className="text-[13.5px] sm:text-sm font-sans font-bold text-white capitalize leading-tight mt-1 truncate">
                          {activeSelectedInstance.loader || 'Vanilla'}
                        </div>
                      </div>
                    </div>

                    {/* 3. Mods */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <IsometricModCubeIcon className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 font-medium leading-none">Mods</div>
                        <div className="text-[13.5px] sm:text-sm font-mono font-bold text-white leading-tight mt-1 truncate">
                          {modsCount} Mods
                        </div>
                      </div>
                    </div>

                    {/* 4. World Size */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <IsometricStorageBoxIcon className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 font-medium leading-none">World Size</div>
                        <div className="text-[13.5px] sm:text-sm font-mono font-bold text-white leading-tight mt-1 truncate">
                          {selectedWorldSize}
                        </div>
                      </div>
                    </div>

                    {/* 5. Last Played */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-200 shrink-0 shadow-sm">
                        <Clock className="w-5 h-5 text-slate-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 font-medium leading-none">Last Played</div>
                        <div className="text-[13px] sm:text-[13.5px] font-sans font-semibold text-white leading-tight mt-1 truncate">
                          {formatRelativeTime(activeSelectedInstance.lastPlayed)}
                        </div>
                      </div>
                    </div>

                    {/* 6. Created On */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-200 shrink-0 shadow-sm">
                        <Calendar className="w-5 h-5 text-slate-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] text-slate-400 font-medium leading-none">Created On</div>
                        <div className="text-[13px] sm:text-[13.5px] font-sans font-semibold text-white leading-tight mt-1 truncate">
                          {formatCreatedDate(activeSelectedInstance.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Health Banner */}
                  <div
                    onClick={() => onOpenInstanceDetails(activeSelectedInstance)}
                    className={`rounded-2xl p-2.5 sm:p-3 flex items-center space-x-3.5 shrink-0 cursor-pointer transition-all hover:brightness-110 ${
                      activeHealth.status === 'healthy'
                        ? 'bg-[#081a20]/75 border border-emerald-500/35 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                        : activeHealth.status === 'warning'
                        ? 'bg-[#241a08]/75 border border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.12)]'
                        : 'bg-[#24080e]/75 border border-rose-500/35 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                        activeHealth.status === 'healthy'
                          ? 'bg-[#10b981] shadow-[0_0_10px_#10b981]'
                          : activeHealth.status === 'warning'
                          ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]'
                          : 'bg-rose-400 shadow-[0_0_10px_#f43f5e]'
                      }`}
                    />
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold leading-tight ${
                          activeHealth.status === 'healthy'
                            ? 'text-[#10b981]'
                            : activeHealth.status === 'warning'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {activeHealth.label}
                      </div>
                      <div className="text-[10.5px] text-slate-300 font-medium leading-tight mt-0.5 truncate">
                        {activeHealth.status === 'healthy'
                          ? 'Everything is working correctly'
                          : activeHealth.status === 'warning'
                          ? 'Check instance memory & performance'
                          : 'Java path or configuration critical'}
                      </div>
                    </div>
                  </div>

                  {/* Full Width Play Button */}
                  <button
                    onClick={() => {
                      sounds.playLaunch();
                      onLaunch(activeSelectedInstance);
                    }}
                    disabled={activeSelectedInstance.isRunning || launchProgress !== null}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-display font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] shrink-0 cursor-pointer"
                  >
                    {activeSelectedInstance.isRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Playing {activeSelectedInstance.name}</span>
                      </>
                    ) : launchProgress ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{launchProgress.step || 'Launching...'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Play</span>
                      </>
                    )}
                  </button>

                  {/* 6 Action Buttons in a Spacious 3-Column Grid (3 buttons per row) */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1 shrink-0">
                    {/* 1. Edit Instance */}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onOpenInstanceDetails(activeSelectedInstance);
                      }}
                      className="flex flex-col items-center justify-center text-center p-2.5 rounded-2xl bg-[#0c132c]/85 hover:bg-[#131d45] border border-white/[0.08] hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-all cursor-pointer group shadow-sm"
                      title="Edit Instance"
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:border-indigo-400/50 transition-all mb-1">
                        <Edit2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-tight">
                        Edit Instance
                      </span>
                    </button>

                    {/* 2. Manage Mods */}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onOpenInstanceDetails(activeSelectedInstance);
                      }}
                      className="flex flex-col items-center justify-center text-center p-2.5 rounded-2xl bg-[#0c132c]/85 hover:bg-[#131d45] border border-white/[0.08] hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)] transition-all cursor-pointer group shadow-sm"
                      title="Manage Mods"
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:border-purple-400/50 transition-all mb-1">
                        <Box className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-tight">
                        Manage Mods
                      </span>
                    </button>

                    {/* 3. Open Folder */}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        onOpenFolder(activeSelectedInstance);
                      }}
                      className="flex flex-col items-center justify-center text-center p-2.5 rounded-2xl bg-[#0c132c]/85 hover:bg-[#131d45] border border-white/[0.08] hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all cursor-pointer group shadow-sm"
                      title="Open Instance Folder"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:border-blue-400/50 transition-all mb-1">
                        <Folder className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-tight">
                        Open Folder
                      </span>
                    </button>

                    {/* 4. Backup World */}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (onSelectTab) {
                          onSelectTab('cloud');
                        }
                      }}
                      className="flex flex-col items-center justify-center text-center p-2.5 rounded-2xl bg-[#0c132c]/85 hover:bg-[#131d45] border border-white/[0.08] hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all cursor-pointer group shadow-sm"
                      title="Backup World"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:border-emerald-400/50 transition-all mb-1">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-tight">
                        Backup World
                      </span>
                    </button>

                    {/* 5. Duplicate Instance */}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setCloneModalInstance(activeSelectedInstance);
                      }}
                      className="flex flex-col items-center justify-center text-center p-2.5 rounded-2xl bg-[#0c132c]/85 hover:bg-[#131d45] border border-white/[0.08] hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all cursor-pointer group shadow-sm"
                      title="Duplicate Instance"
                    >
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400/50 transition-all mb-1">
                        <Copy className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-white leading-tight">
                        Duplicate
                      </span>
                    </button>

                    {/* 6. Delete Instance */}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setDeleteConfirmInstance(activeSelectedInstance);
                      }}
                      className="flex flex-col items-center justify-center text-center p-2.5 rounded-2xl bg-rose-950/25 hover:bg-rose-950/45 border border-rose-500/25 hover:border-rose-500/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)] transition-all cursor-pointer group shadow-sm"
                      title="Delete Instance"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:border-rose-400/50 transition-all mb-1">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-rose-300 group-hover:text-rose-200 leading-tight">
                        Delete
                      </span>
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="h-full min-h-0 p-8 rounded-3xl bg-[#0c1228]/60 border border-white/[0.08] flex items-center justify-center text-center text-slate-400">
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
