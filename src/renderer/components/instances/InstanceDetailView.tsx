import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  ArrowLeft,
  Play,
  Square,
  FolderOpen,
  Folder,
  Trash2,
  Copy,
  Sliders,
  Package,
  Layers,
  Sparkles,
  Search,
  Plus,
  Compass,
  HardDrive,
  Cpu,
  RefreshCw,
  Power,
  Eye,
  FileCode,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Palette,
  Image,
  Camera,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  User,
  ArrowLeftRight,
  ArrowUpDown,
  ChevronDown,
  Check,
  MoreVertical,
  MoreHorizontal,
  Upload,
  Download,
  Globe,
  Terminal,
  Share2,
  Settings,
  Filter,
  FileText,
  Calendar,
  Box,
  CheckSquare,
  Square as SquareIcon,
  ExternalLink,
  Loader2,
  Stethoscope,
  Gamepad2,
  Pencil,
  Cloud,
  CloudOff,
  RotateCcw,
  Info,
  Zap,
  Coffee,
  Monitor,
  Maximize2,
  Minimize2,
  Save,
  Database,
  Scroll
} from 'lucide-react';
import { Instance, ModLoader, MinecraftVersion, Mod, ResourcePack, ShaderPack, WorldSave, JavaInstallation, ScreenshotItem, MarketplaceVersion, CloneInstanceOptions } from '../../types';
import { sounds } from '../../services/soundEngine';
import { InstanceIconRenderer, IconEditorModal, IsometricSymbolSVG } from './instanceIcons';
import { ConfirmModal } from '../common/ConfirmModal';
import { PromptModal } from '../common/PromptModal';
import { ShareInstanceModal } from './ShareInstanceModal';
import { AddContentModal } from './AddContentModal';
import { CloneInstanceModal } from './CloneInstanceModal';
import { InstanceHealthModal } from './InstanceHealthModal';
import bgPortalHero from '../../assets/instance_backgrounds/bg_portal_hero.jpg';
import bgSunset from '../../assets/instance_backgrounds/bg_sunset.jpg';
import bgVanilla from '../../assets/instance_backgrounds/bg_vanilla.jpg';
import bgGalaxy from '../../assets/instance_backgrounds/bg_galaxy.jpg';
import bgNether from '../../assets/instance_backgrounds/bg_nether.jpg';
import bgSidebarPortal from '../../assets/instance_backgrounds/bg_sidebar_portal.jpg';
import bgBannerContent from '../../assets/instance_backgrounds/bg_banner_content.jpg';
import bgBannerFiles from '../../assets/instance_backgrounds/bg_banner_files.jpg';
import bgBannerWorlds from '../../assets/instance_backgrounds/bg_banner_worlds.jpg';
import bgBannerLogs from '../../assets/instance_backgrounds/bg_banner_logs.jpg';
import bgBannerScreenshots from '../../assets/instance_backgrounds/bg_banner_screenshots.jpg';
import bgBannerSettings from '../../assets/instance_backgrounds/bg_banner_settings.jpg';
import iconEndIsland from '../../assets/instance_backgrounds/icon_end_island.jpg';
import iconLushCave from '../../assets/instance_backgrounds/icon_lush_cave.jpg';
import iconCherryGrove from '../../assets/instance_backgrounds/icon_cherry_grove.jpg';
import iconCrimsonNether from '../../assets/instance_backgrounds/icon_crimson_nether.jpg';
import { resolveContentMetadata, fetchMissingMetadataOnline, EnrichedContentMetadata } from '../../services/contentMetadataService';

const TAB_BANNER_CONFIG: Record<
  string,
  {
    label: string;
    desc: string;
    quoteLine1: string;
    quoteLine2: string;
    bg: string;
    icon: React.ElementType;
    iconColor: string;
  }
> = {
  content: {
    label: 'CONTENT',
    desc: 'Manage mods, resource packs, shaders and modpacks',
    quoteLine1: 'Enhance',
    quoteLine2: 'Your World',
    bg: bgBannerContent,
    icon: Box,
    iconColor: 'text-indigo-400',
  },
  files: {
    label: 'FILES',
    desc: 'Explore instance folders and files',
    quoteLine1: 'Your Files',
    quoteLine2: 'Your Control',
    bg: bgBannerFiles,
    icon: Folder,
    iconColor: 'text-cyan-400',
  },
  worlds: {
    label: 'WORLDS',
    desc: 'Manage world saves and backups',
    quoteLine1: 'Build',
    quoteLine2: 'New Stories',
    bg: bgBannerWorlds,
    icon: Globe,
    iconColor: 'text-sky-400',
  },
  logs: {
    label: 'LOGS',
    desc: 'View game logs and diagnostic output',
    quoteLine1: 'Find Issues',
    quoteLine2: 'Fix Problems',
    bg: bgBannerLogs,
    icon: Terminal,
    iconColor: 'text-purple-400',
  },
  screenshots: {
    label: 'SCREENSHOTS',
    desc: 'View and manage your in-game screenshots',
    quoteLine1: 'Capture',
    quoteLine2: 'Your Journey',
    bg: bgBannerScreenshots,
    icon: Image,
    iconColor: 'text-blue-400',
  },
  settings: {
    label: 'SETTINGS',
    desc: 'Customize your instance and launcher settings',
    quoteLine1: 'Make It',
    quoteLine2: 'Your Own',
    bg: bgBannerSettings,
    icon: Settings,
    iconColor: 'text-violet-400',
  },
};

interface InstanceDetailViewProps {
  instance: Instance;
  onBack: () => void;
  onLaunch: (instance: Instance) => void;
  onKill: (instance: Instance) => void;
  onUpdateInstance: (instance: Instance) => Promise<void>;
  onDeleteInstance: (instanceId: string) => Promise<void>;
  onCloneInstance: (instanceId: string, options: CloneInstanceOptions) => Promise<void>;
  onOpenFolder: (instance: Instance, subDir?: string) => void;
  onNavigateToMarketplace: (type: 'mod' | 'shader' | 'resourcepack') => void;
  onShowToast: (toast: any) => void;
  detectedJava: JavaInstallation[];
}

type ContentCategory = 'all' | 'mods' | 'resourcepacks' | 'shaderpacks';
type SortOption = 'name_asc' | 'name_desc' | 'version' | 'size' | 'enabled_first';
type StatusFilter = 'all' | 'enabled' | 'disabled';

// Pixel-perfect Minecraft grass block SVG
const GrassBlockIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none">
    {/* Top Face - Grass green */}
    <path d="M12 2L21 7.2L12 12.4L3 7.2L12 2Z" fill="#5b8c32" />
    <path d="M12 4L18 7.5L12 11L6 7.5L12 4Z" fill="#72aa3e" opacity="0.6" />
    {/* Left Face - Dirt */}
    <path d="M3 7.2L12 12.4V22L3 16.8V7.2Z" fill="#866043" />
    {/* Left Face Grass Drips */}
    <path d="M3 7.2L12 12.4V15.5L10 14L8 16L6 14L3 15.5V7.2Z" fill="#4d7729" />
    {/* Right Face - Darker Dirt */}
    <path d="M12 12.4L21 7.2V16.8L12 22V12.4Z" fill="#694b34" />
    {/* Right Face Grass Drips */}
    <path d="M12 12.4L21 7.2V10.5L18 12L16 10L14 12.5L12 11.5V12.4Z" fill="#3f6121" />
  </svg>
);

// Authentic Java Coffee Cup Logo SVG with vibrant orange-red steam and cyan-blue cup
const JavaLogoSVG: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="javaSteam1" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ea580c" />
        <stop offset="60%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="javaSteam2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
      <linearGradient id="javaCup" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* Steam curves */}
    <path
      d="M38 18 C33 28, 48 34, 42 45 C38 52, 44 58, 48 62"
      stroke="url(#javaSteam1)"
      strokeWidth="4.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M50 14 C43 25, 62 30, 56 42 C51 50, 58 55, 62 59"
      stroke="url(#javaSteam2)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M62 20 C58 26, 70 31, 66 39"
      stroke="url(#javaSteam1)"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Cup top curve */}
    <path
      d="M26 62 C26 62, 50 56, 74 62 C74 62, 78 72, 68 76 C55 80, 42 80, 32 76 C24 72, 26 62, 26 62 Z"
      stroke="url(#javaCup)"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Cup bottom curve */}
    <path
      d="M30 75 C30 75, 40 85, 60 85 C72 85, 76 77, 76 77"
      stroke="url(#javaCup)"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Saucer / Plate bottom base */}
    <path
      d="M18 84 C35 94, 65 94, 82 84"
      stroke="url(#javaCup)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M26 91 C42 97, 58 97, 74 91"
      stroke="url(#javaCup)"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const THEME_ACCENT_OPTIONS = [
  { id: 'purple', hex: '#8b5cf6', bgClass: 'bg-[#8b5cf6]', ringClass: 'ring-purple-400', shadowClass: 'shadow-[0_0_12px_rgba(139,92,246,0.6)]' },
  { id: 'blue', hex: '#0ea5e9', bgClass: 'bg-[#0ea5e9]', ringClass: 'ring-cyan-400', shadowClass: 'shadow-[0_0_12px_rgba(14,165,233,0.6)]' },
  { id: 'green', hex: '#10b981', bgClass: 'bg-[#10b981]', ringClass: 'ring-emerald-400', shadowClass: 'shadow-[0_0_12px_rgba(16,185,129,0.6)]' },
  { id: 'orange', hex: '#f97316', bgClass: 'bg-[#f97316]', ringClass: 'ring-orange-400', shadowClass: 'shadow-[0_0_12px_rgba(249,115,22,0.6)]' },
  { id: 'pink', hex: '#ec4899', bgClass: 'bg-[#ec4899]', ringClass: 'ring-pink-400', shadowClass: 'shadow-[0_0_12px_rgba(236,72,153,0.6)]' }
];

const RESOLUTION_OPTIONS = [
  { label: '3840 x 2160 (4K UHD)', w: 3840, h: 2160 },
  { label: '2560 x 1440 (2K QHD)', w: 2560, h: 1440 },
  { label: '1920 x 1080 (Full HD)', w: 1920, h: 1080 },
  { label: '1280 x 720 (HD)', w: 1280, h: 720 },
  { label: '854 x 480 (Standard)', w: 854, h: 480 }
];

const FALLBACK_MC_VERSIONS = [
  '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
  '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
  '1.15.2', '1.14.4', '1.13.2', '1.12.2', '1.11.2', '1.10.2', '1.9.4', '1.8.9', '1.7.10'
];

import { resolveInstanceArtwork, PRESET_ARTWORKS } from '../../services/instanceArtwork';
export { PRESET_ARTWORKS };

export const InstanceDetailView: React.FC<InstanceDetailViewProps> = ({
  instance,
  onBack,
  onLaunch,
  onKill,
  onUpdateInstance,
  onDeleteInstance,
  onCloneInstance,
  onOpenFolder,
  onNavigateToMarketplace,
  onShowToast,
  detectedJava
}) => {
  // Navigation Tabs matching Modrinth App
  const [activeTab, setActiveTab] = useState<'content' | 'files' | 'worlds' | 'logs' | 'screenshots' | 'settings'>('content');
  
  // Data Assets
  const [mods, setMods] = useState<Mod[]>([]);
  const [resourcePacks, setResourcePacks] = useState<ResourcePack[]>([]);
  const [shaderPacks, setShaderPacks] = useState<ShaderPack[]>([]);
  const [worldSaves, setWorldSaves] = useState<WorldSave[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Content Table Filters & Sorting (Modrinth style)
  const [searchQuery, setSearchQuery] = useState('');
  const [contentCategory, setContentCategory] = useState<ContentCategory>('mods');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Multi-Selection State for Bulk Actions
  const [selectedFilenames, setSelectedFilenames] = useState<string[]>([]);

  // Header and Context Menus
  const [showHeaderMoreMenu, setShowHeaderMoreMenu] = useState(false);
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);

  // Screenshots & Modals
  const [screenshotSearch, setScreenshotSearch] = useState('');
  const [screenshotViewMode, setScreenshotViewMode] = useState<'grid' | 'list'>('grid');
  const [screenshotSort, setScreenshotSort] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  const [showScreenshotSortMenu, setShowScreenshotSortMenu] = useState(false);
  const [selectedScreenshotIds, setSelectedScreenshotIds] = useState<string[]>([]);
  const [activeScreenshotMenuId, setActiveScreenshotMenuId] = useState<string | null>(null);

  const toggleSelectScreenshot = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sounds.playClick();
    setSelectedScreenshotIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleTakeScreenshot = async () => {
    sounds.playClick();
    if (instance.isRunning) {
      onShowToast({
        id: Math.random().toString(),
        type: 'info',
        title: 'Minecraft is Running',
        message: 'Press F2 in Minecraft to capture high-res screenshots automatically!'
      });
      return;
    }
    try {
      if (window.galaxy?.selectMultipleFiles) {
        const files = await window.galaxy.selectMultipleFiles([
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
        ]);
        if (files && files.length > 0 && window.galaxy.importFiles) {
          const count = await window.galaxy.importFiles(instance.id, 'screenshots', files);
          sounds.playSuccess();
          await handleRefreshScreenshots();
          onShowToast({
            id: Math.random().toString(),
            type: 'success',
            title: 'Screenshots Imported',
            message: `Added ${count} screenshot${count === 1 ? '' : 's'} to this instance.`
          });
        }
      }
    } catch (err: any) {
      console.error('Import screenshot error:', err);
    }
  };

  const handleBulkDeleteScreenshots = async () => {
    if (selectedScreenshotIds.length === 0 || !window.galaxy?.deleteScreenshot) return;
    sounds.playClick();
    const toDelete = screenshots.filter((s) => selectedScreenshotIds.includes(s.id));
    for (const item of toDelete) {
      await window.galaxy.deleteScreenshot(item.filePath);
    }
    setSelectedScreenshotIds([]);
    sounds.playSuccess();
    await handleRefreshScreenshots();
    onShowToast({
      id: Math.random().toString(),
      type: 'info',
      title: 'Screenshots Deleted',
      message: `Removed ${toDelete.length} screenshot${toDelete.length === 1 ? '' : 's'}.`
    });
  };
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [copiedScreenshotId, setCopiedScreenshotId] = useState<string | null>(null);
  const [screenshotToDelete, setScreenshotToDelete] = useState<ScreenshotItem | null>(null);
  const [refreshingScreenshots, setRefreshingScreenshots] = useState(false);

  // Settings form state
  const [instName, setInstName] = useState(instance.name);
  const [mcVersion, setMcVersion] = useState(instance.version || '1.20.1');
  const [loader, setLoader] = useState<ModLoader>(instance.loader || 'fabric');
  const [loaderVersion, setLoaderVersion] = useState<string | undefined>(instance.loaderVersion);
  const [themeAccent, setThemeAccent] = useState(instance.iconBackground || 'purple');
  const [memoryMax, setMemoryMax] = useState(instance.memoryMax || 4096);
  const [perfPreset, setPerfPreset] = useState<'balanced' | 'high' | 'extreme' | 'potato'>(() => {
    if (!instance.memoryMax || instance.memoryMax === 4096) return 'balanced';
    if (instance.memoryMax <= 2048) return 'potato';
    if (instance.memoryMax >= 12288) return 'extreme';
    if (instance.memoryMax >= 8192) return 'high';
    return 'balanced';
  });
  const [resPreset, setResPreset] = useState(() => {
    if (instance.resolution?.width === 3840) return '3840 x 2160 (4K UHD)';
    if (instance.resolution?.width === 2560) return '2560 x 1440 (2K QHD)';
    if (instance.resolution?.width === 1280) return '1280 x 720 (HD)';
    if (instance.resolution?.width === 854) return '854 x 480 (Standard)';
    return '1920 x 1080 (Full HD)';
  });
  const [resWidth, setResWidth] = useState(instance.resolution?.width || 1920);
  const [resHeight, setResHeight] = useState(instance.resolution?.height || 1080);
  const [fullscreen, setFullscreen] = useState(instance.resolution?.fullscreen ?? true);
  const [vsync, setVsync] = useState(false);
  const [showLauncher, setShowLauncher] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupRetention, setBackupRetention] = useState('Keep 3 backups');
  const [jvmArgs, setJvmArgs] = useState(instance.jvmArgs || '-Xmx4G -XX:+UseG1GC -XX:+ParallelRefProcEnabled');
  const [jvmProfile, setJvmProfile] = useState<any>(instance.jvmProfile || 'aikar');
  const [javaPath, setJavaPath] = useState(instance.javaPath || '');
  const [openDropdown, setOpenDropdown] = useState<'version' | 'loader' | 'preset' | 'resolution' | 'retention' | 'java' | 'icon' | null>(null);
  const [chosenArtwork, setChosenArtwork] = useState<string>(() => resolveInstanceArtwork(instance));
  const [chosenArtworkId, setChosenArtworkId] = useState<string>(() => instance.iconBackground || '');

  useEffect(() => {
    setInstName(instance.name);
    setMcVersion(instance.version || '1.20.1');
    setLoader(instance.loader || 'fabric');
    setLoaderVersion(instance.loaderVersion);
    setMemoryMax(instance.memoryMax || 4096);
    setPerfPreset(!instance.memoryMax || instance.memoryMax === 4096 ? 'balanced' : instance.memoryMax <= 2048 ? 'potato' : instance.memoryMax >= 12288 ? 'extreme' : 'high');
    setFullscreen(instance.resolution?.fullscreen ?? true);
    setChosenArtwork(resolveInstanceArtwork(instance));
    setChosenArtworkId(instance.iconBackground || '');
    setThemeAccent(instance.iconBackground || 'purple');
  }, [instance.id, instance.name, instance.version, instance.loader, instance.loaderVersion, instance.icon, instance.banner, instance.iconBackground, instance.memoryMax, instance.resolution?.fullscreen]);

  // Dynamic versions list and search
  const [allMojangVersions, setAllMojangVersions] = useState<MinecraftVersion[]>([]);
  const [versionSearchTerm, setVersionSearchTerm] = useState('');

  useEffect(() => {
    let active = true;
    const fetchMojang = async () => {
      if (window.galaxy?.getMojangVersions) {
        try {
          const list = await window.galaxy.getMojangVersions();
          if (active && list && list.length > 0) {
            setAllMojangVersions(list);
          }
        } catch (e) {
          console.warn('Failed to load Mojang versions list:', e);
        }
      }
    };
    fetchMojang();
    return () => { active = false; };
  }, []);

  const displayVersions = useMemo(() => {
    let list: string[] = [];
    if (allMojangVersions.length > 0) {
      const releases = allMojangVersions.filter((v) => v.type === 'release').map((v) => v.id);
      list = releases.length > 0 ? releases : allMojangVersions.map((v) => v.id);
    } else {
      list = [...FALLBACK_MC_VERSIONS];
    }
    if (mcVersion && !list.includes(mcVersion)) {
      list.unshift(mcVersion);
    }
    if (versionSearchTerm.trim()) {
      const q = versionSearchTerm.toLowerCase().trim();
      return list.filter((v) => v.toLowerCase().includes(q));
    }
    return list;
  }, [allMojangVersions, mcVersion, versionSearchTerm]);

  // Click outside listener for all dropdowns to prevent layout shift
  useEffect(() => {
    if (!openDropdown) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-dropdown-container]')) {
        return;
      }
      setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [openDropdown]);

  const handleSelectVersion = async (ver: string) => {
    sounds.playClick();
    setMcVersion(ver);
    setOpenDropdown(null);
    setVersionSearchTerm('');

    if (loader === 'fabric' && window.galaxy?.getFabricVersions) {
      try {
        const fList = await window.galaxy.getFabricVersions(ver);
        if (fList && fList.length > 0) {
          setLoaderVersion(fList[0]);
        }
      } catch (err) {
        console.warn('Fabric version fetch note:', err);
      }
    } else if (loader === 'quilt' && window.galaxy?.getQuiltVersions) {
      try {
        const qList = await window.galaxy.getQuiltVersions(ver);
        if (qList && qList.length > 0) {
          setLoaderVersion(qList[0]);
        }
      } catch (err) {
        console.warn('Quilt version fetch note:', err);
      }
    }
  };

  const handleSelectLoader = async (ldId: ModLoader) => {
    sounds.playClick();
    setLoader(ldId);
    setOpenDropdown(null);

    if (ldId === 'fabric' && window.galaxy?.getFabricVersions) {
      try {
        const fList = await window.galaxy.getFabricVersions(mcVersion);
        if (fList && fList.length > 0) {
          setLoaderVersion(fList[0]);
        }
      } catch (err) {
        console.warn('Fabric version fetch note:', err);
      }
    } else if (ldId === 'quilt' && window.galaxy?.getQuiltVersions) {
      try {
        const qList = await window.galaxy.getQuiltVersions(mcVersion);
        if (qList && qList.length > 0) {
          setLoaderVersion(qList[0]);
        }
      } catch (err) {
        console.warn('Quilt version fetch note:', err);
      }
    } else {
      setLoaderVersion(undefined);
    }
  };
  const [showJvmExpanded, setShowJvmExpanded] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState<string | null>(null);
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [showDeleteInstanceModal, setShowDeleteInstanceModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [addContentType, setAddContentType] = useState<'mod' | 'shader' | 'resourcepack' | 'modpack'>('mod');
  const [showAddContentMenu, setShowAddContentMenu] = useState(false);

  const handleOpenAddContent = (type: 'mod' | 'shader' | 'resourcepack' | 'modpack') => {
    sounds.playClick();
    setAddContentType(type);
    setShowAddContentModal(true);
    setShowAddContentMenu(false);
  };
  const [modToDelete, setModToDelete] = useState<Mod | null>(null);
  const [resourcePackToDelete, setResourcePackToDelete] = useState<ResourcePack | null>(null);
  const [shaderPackToDelete, setShaderPackToDelete] = useState<ShaderPack | null>(null);
  const [backupToDelete, setBackupToDelete] = useState<any | null>(null);
  const [isDeletingInstance, setIsDeletingInstance] = useState(false);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<string[] | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [enrichedMetadataMap, setEnrichedMetadataMap] = useState<Record<string, EnrichedContentMetadata>>({});

  // Palette and Art Helpers
  const INSTANCE_BG_PALETTE = [bgVanilla, bgSunset, bgGalaxy, bgNether];
  const getInstanceArt = (inst: Instance): string => {
    if (inst.iconBackground && inst.iconBackground.startsWith('http')) {
      return inst.iconBackground;
    }
    const hash = (inst.id || inst.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return INSTANCE_BG_PALETTE[Math.abs(hash) % INSTANCE_BG_PALETTE.length];
  };

  // Total world size calculation
  const totalWorldSizeBytes = useMemo(() => {
    return worldSaves.reduce((acc, ws) => acc + (ws.sizeBytes || 0), 0);
  }, [worldSaves]);

  // Health state
  const healthState = useMemo(() => {
    if (instance.javaPath && !instance.javaPath.includes('javaw') && !instance.javaPath.includes('java')) {
      return { status: 'critical', label: 'Critical', dotColor: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]', badgeClass: 'bg-rose-500/15 border-rose-500/30 text-rose-300' };
    }
    if (instance.memoryMax && instance.memoryMax < 1024) {
      return { status: 'warning', label: 'Warning', dotColor: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]', badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-300' };
    }
    return { status: 'healthy', label: 'Healthy', dotColor: 'bg-emerald-400 shadow-[0_0_8px_#10b981]', badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' };
  }, [instance.javaPath, instance.memoryMax]);

  // Background online auto-enrichment for items lacking high-res icon
  useEffect(() => {
    if (!mods || mods.length === 0) return;
    mods.forEach((mod) => {
      const meta = resolveContentMetadata(mod.name, mod.filename, mod.icon, mod.description, mod.authors, 'mod');
      if (!meta.icon) {
        fetchMissingMetadataOnline(mod.name, mod.filename, 'mod', (fresh) => {
          setEnrichedMetadataMap((prev) => ({ ...prev, [mod.filename]: fresh }));
        });
      }
    });
  }, [mods]);

  useEffect(() => {
    if (!resourcePacks || resourcePacks.length === 0) return;
    resourcePacks.forEach((rp) => {
      const meta = resolveContentMetadata(rp.name, rp.filename, rp.icon, rp.description, rp.authors, 'resourcepack');
      if (!meta.icon) {
        fetchMissingMetadataOnline(rp.name, rp.filename, 'resourcepack', (fresh) => {
          setEnrichedMetadataMap((prev) => ({ ...prev, [rp.filename]: fresh }));
        });
      }
    });
  }, [resourcePacks]);

  useEffect(() => {
    if (!shaderPacks || shaderPacks.length === 0) return;
    shaderPacks.forEach((sp) => {
      const meta = resolveContentMetadata(sp.name, sp.filename, sp.icon, sp.description, sp.authors, 'shader');
      if (!meta.icon) {
        fetchMissingMetadataOnline(sp.name, sp.filename, 'shader', (fresh) => {
          setEnrichedMetadataMap((prev) => ({ ...prev, [sp.filename]: fresh }));
        });
      }
    });
  }, [shaderPacks]);

  const handleRenameInstance = async (newName: string) => {
    if (!newName.trim() || newName.trim() === instance.name) {
      setShowRenameModal(false);
      return;
    }
    sounds.playSuccess();
    const updated = { ...instance, name: newName.trim() };
    await onUpdateInstance(updated);
    setInstName(newName.trim());
    setShowRenameModal(false);
    onShowToast({
      id: Math.random().toString(),
      type: 'success',
      title: 'Instance Renamed',
      message: `Renamed instance to "${newName.trim()}".`
    });
  };

  useEffect(() => {
    loadInstanceData();
  }, [instance.id]);

  // Live fetch screenshots whenever switching to the screenshots tab or window refocuses
  useEffect(() => {
    if (activeTab === 'screenshots') {
      handleRefreshScreenshots();

      const onFocus = () => {
        handleRefreshScreenshots();
      };
      window.addEventListener('focus', onFocus);

      const interval = setInterval(async () => {
        if (window.galaxy?.getScreenshotsByInstance) {
          try {
            const list = await window.galaxy.getScreenshotsByInstance(instance.id);
            setScreenshots((prev) => {
              const prevIds = prev.map((x) => x.id).join(',');
              const freshIds = (list || []).map((x) => x.id).join(',');
              if (prevIds !== freshIds) {
                return list || [];
              }
              return prev;
            });
          } catch {}
        }
      }, 2000);

      return () => {
        window.removeEventListener('focus', onFocus);
        clearInterval(interval);
      };
    }
  }, [activeTab, instance.id]);

  // Clear multi-selection when category changes
  useEffect(() => {
    setSelectedFilenames([]);
  }, [contentCategory]);

  const loadInstanceData = async () => {
    setLoading(true);
    try {
      if (window.galaxy) {
        const [m, rp, sp, ws, bk, sc] = await Promise.all([
          window.galaxy.getMods(instance.id),
          window.galaxy.getResourcePacks(instance.id),
          window.galaxy.getShaderPacks(instance.id),
          window.galaxy.getWorldSaves(instance.id),
          window.galaxy.listWorldBackups ? window.galaxy.listWorldBackups(instance.id) : Promise.resolve([]),
          window.galaxy.getScreenshotsByInstance ? window.galaxy.getScreenshotsByInstance(instance.id) : Promise.resolve([])
        ]);
        setMods(m || []);
        setResourcePacks(rp || []);
        setShaderPacks(sp || []);
        setWorldSaves(ws || []);
        setBackups(bk || []);
        setScreenshots(sc || []);
      }
    } catch (err) {
      console.error('Failed to load instance assets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format Helpers
  const formatPlaytime = (minutes?: number) => {
    if (!minutes || minutes <= 0) return '0 minutes';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours} hours`;
  };

  const formatLastPlayed = (dateString?: string) => {
    if (!dateString) return 'Never played';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Played today';
      if (diffDays === 1) return 'Played yesterday';
      if (diffDays < 30) return `Last played ${diffDays} days ago`;
      return `Last played ${date.toLocaleDateString()}`;
    } catch {
      return dateString;
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatScreenshotDate = (dateStr?: string, filename?: string) => {
    if (dateStr) {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const day = d.getDate();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = months[d.getMonth()];
          const year = d.getFullYear();
          return `${day} ${month} ${year}`;
        }
      } catch {}
    }
    if (filename) {
      const match = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const year = match[1];
        const monthIndex = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${day} ${months[monthIndex]} ${year}`;
        }
      }
    }
    return 'Recent';
  };

  const getScreenshotDisplayName = (filename: string) => {
    const withoutExt = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
    if (/^\d{4}-\d{2}-\d{2}[_ ]\d{2}\.\d{2}\.\d{2}$/.test(withoutExt)) {
      return `Screenshot ${withoutExt.replace('_', ' ')}`;
    }
    return withoutExt.replace(/_/g, ' ');
  };

  const isCurrentVersion = (ver: MarketplaceVersion) => {
    if (!versionChangeItem) return false;
    const currentItem = versionChangeItem.item;
    const currentVerStr = (currentItem.version || '').toLowerCase().trim();
    const currentFile = (currentItem.filename || '').toLowerCase().trim();

    const hasMatchingFile = (ver.files || []).some(
      (f) => (f.filename || '').toLowerCase().trim() === currentFile
    );
    if (hasMatchingFile) return true;

    if (
      currentVerStr &&
      ((ver.versionNumber || '').toLowerCase().trim() === currentVerStr ||
        (ver.name || '').toLowerCase().trim() === currentVerStr)
    ) {
      return true;
    }

    return false;
  };

  // Content Filtering & Sorting
  const filteredAndSortedMods = useMemo(() => {
    let list = [...mods];

    // Status filter
    if (statusFilter === 'enabled') {
      list = list.filter((m) => m.enabled);
    } else if (statusFilter === 'disabled') {
      list = list.filter((m) => !m.enabled);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.filename.toLowerCase().includes(q) ||
          (m.authors && m.authors.some((a) => a.toLowerCase().includes(q))) ||
          (m.description && m.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'version':
          return b.version.localeCompare(a.version);
        case 'size':
          return b.sizeBytes - a.sizeBytes;
        case 'enabled_first':
          if (a.enabled === b.enabled) return a.name.localeCompare(b.name);
          return a.enabled ? -1 : 1;
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [mods, searchQuery, statusFilter, sortBy]);

  const filteredAndSortedResourcePacks = useMemo(() => {
    let list = [...resourcePacks];

    // Status filter
    if (statusFilter === 'enabled') {
      list = list.filter((rp) => rp.enabled);
    } else if (statusFilter === 'disabled') {
      list = list.filter((rp) => !rp.enabled);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (rp) =>
          rp.name.toLowerCase().includes(q) ||
          rp.filename.toLowerCase().includes(q) ||
          (rp.authors && rp.authors.some((a) => a.toLowerCase().includes(q))) ||
          (rp.description && rp.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'version':
          return (b.version || '').localeCompare(a.version || '');
        case 'size':
          return (b.sizeBytes || 0) - (a.sizeBytes || 0);
        case 'enabled_first':
          if (a.enabled === b.enabled) return a.name.localeCompare(b.name);
          return a.enabled ? -1 : 1;
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [resourcePacks, searchQuery, statusFilter, sortBy]);

  const filteredAndSortedShaderPacks = useMemo(() => {
    let list = [...shaderPacks];

    // Status filter
    if (statusFilter === 'enabled') {
      list = list.filter((sp) => sp.enabled);
    } else if (statusFilter === 'disabled') {
      list = list.filter((sp) => !sp.enabled);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (sp) =>
          sp.name.toLowerCase().includes(q) ||
          sp.filename.toLowerCase().includes(q) ||
          (sp.authors && sp.authors.some((a) => a.toLowerCase().includes(q))) ||
          (sp.description && sp.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'version':
          return (b.version || '').localeCompare(a.version || '');
        case 'size':
          return (b.sizeBytes || 0) - (a.sizeBytes || 0);
        case 'enabled_first':
          if (a.enabled === b.enabled) return a.name.localeCompare(b.name);
          return a.enabled ? -1 : 1;
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [shaderPacks, searchQuery, statusFilter, sortBy]);

  // Selection Handlers
  const handleToggleSelectAll = () => {
    sounds.playClick();
    if (contentCategory === 'mods') {
      if (selectedFilenames.length === filteredAndSortedMods.length) {
        setSelectedFilenames([]);
      } else {
        setSelectedFilenames(filteredAndSortedMods.map((m) => m.filename));
      }
    } else if (contentCategory === 'resourcepacks') {
      if (selectedFilenames.length === filteredAndSortedResourcePacks.length) {
        setSelectedFilenames([]);
      } else {
        setSelectedFilenames(filteredAndSortedResourcePacks.map((rp) => rp.filename));
      }
    } else if (contentCategory === 'shaderpacks') {
      if (selectedFilenames.length === filteredAndSortedShaderPacks.length) {
        setSelectedFilenames([]);
      } else {
        setSelectedFilenames(filteredAndSortedShaderPacks.map((sp) => sp.filename));
      }
    } else {
      const allFiles = [
        ...filteredAndSortedMods.map((m) => m.filename),
        ...filteredAndSortedResourcePacks.map((rp) => rp.filename),
        ...filteredAndSortedShaderPacks.map((sp) => sp.filename)
      ];
      if (selectedFilenames.length === allFiles.length) {
        setSelectedFilenames([]);
      } else {
        setSelectedFilenames(allFiles);
      }
    }
  };

  const handleToggleSelectItem = (filename: string) => {
    sounds.playClick();
    setSelectedFilenames((prev) =>
      prev.includes(filename) ? prev.filter((f) => f !== filename) : [...prev, filename]
    );
  };

  // Upload / Import Files Handler
  const handleUploadFiles = async () => {
    sounds.playClick();
    try {
      const targetSubDir =
        contentCategory === 'resourcepacks'
          ? 'resourcepacks'
          : contentCategory === 'shaderpacks'
          ? 'shaderpacks'
          : 'mods';

      const extensions =
        targetSubDir === 'mods'
          ? ['jar', 'zip']
          : ['zip'];

      if (window.galaxy?.selectMultipleFiles) {
        const filePaths = await window.galaxy.selectMultipleFiles([
          { name: 'Minecraft Files', extensions },
          { name: 'All Files', extensions: ['*'] }
        ]);

        if (filePaths && filePaths.length > 0) {
          if (window.galaxy.importFiles) {
            const count = await window.galaxy.importFiles(instance.id, targetSubDir, filePaths);
            sounds.playSuccess();
            await loadInstanceData();
            onShowToast({
              id: Math.random().toString(),
              type: 'success',
              title: 'Files Imported',
              message: `Successfully added ${count} file${count === 1 ? '' : 's'} to ${targetSubDir}.`
            });
          }
        }
      }
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Import Failed',
        message: err.message
      });
    }
  };

  // Mod Actions
  const handleToggleMod = async (mod: Mod) => {
    sounds.playSwitch();
    try {
      await window.galaxy.toggleMod(instance.id, mod.filename, !mod.enabled);
      await loadInstanceData();
      onShowToast({
        id: Math.random().toString(),
        type: 'info',
        title: mod.enabled ? `Disabled ${mod.name}` : `Enabled ${mod.name}`
      });
    } catch (err) {
      console.error('Failed to toggle mod:', err);
    }
  };

  const handleDeleteMod = (mod: Mod) => {
    sounds.playClick();
    setModToDelete(mod);
  };

  // Resource Pack Actions
  const handleToggleResourcePack = async (rp: ResourcePack) => {
    sounds.playSwitch();
    try {
      if (window.galaxy?.toggleResourcePack) {
        await window.galaxy.toggleResourcePack(instance.id, rp.filename, !rp.enabled);
        await loadInstanceData();
        onShowToast({
          id: Math.random().toString(),
          type: 'info',
          title: rp.enabled ? `Disabled ${rp.name}` : `Enabled ${rp.name}`
        });
      }
    } catch (err) {
      console.error('Failed to toggle resource pack:', err);
    }
  };

  const handleDeleteResourcePack = (rp: ResourcePack) => {
    sounds.playClick();
    setResourcePackToDelete(rp);
  };

  // Shader Pack Actions
  const handleToggleShaderPack = async (sp: ShaderPack) => {
    sounds.playSwitch();
    try {
      if (window.galaxy?.toggleShaderPack) {
        await window.galaxy.toggleShaderPack(instance.id, sp.filename, !sp.enabled);
        await loadInstanceData();
        onShowToast({
          id: Math.random().toString(),
          type: 'info',
          title: sp.enabled ? `Disabled ${sp.name}` : `Enabled ${sp.name}`
        });
      }
    } catch (err) {
      console.error('Failed to toggle shader pack:', err);
    }
  };

  const handleDeleteShaderPack = (sp: ShaderPack) => {
    sounds.playClick();
    setShaderPackToDelete(sp);
  };

  // In-place Version Change Modal state
  const [versionChangeItem, setVersionChangeItem] = useState<{
    item: Mod | ResourcePack | ShaderPack;
    type: 'mod' | 'shader' | 'resourcepack';
  } | null>(null);
  const [itemVersions, setItemVersions] = useState<MarketplaceVersion[]>([]);
  const [loadingItemVersions, setLoadingItemVersions] = useState(false);
  const [switchingVersionId, setSwitchingVersionId] = useState<string | null>(null);
  const [versionModalSearch, setVersionModalSearch] = useState('');
  const [versionModalLoader, setVersionModalLoader] = useState('all');
  const [versionModalOnlyCompat, setVersionModalOnlyCompat] = useState(true);

  // Open Exact Project Web Page in Browser
  const handleOpenWebLink = async (
    item: { name: string; filename: string; url?: string; id?: string },
    type: 'mod' | 'shader' | 'resourcepack'
  ) => {
    sounds.playClick();
    let targetUrl = item.url;
    const typeSlug = type === 'resourcepack' ? 'resourcepack' : type === 'shader' ? 'shader' : 'mod';

    if (!targetUrl || targetUrl.includes('?q=')) {
      const cleanId = (item.id || '').trim().toLowerCase();

      // 1. Try to search or match exact slug via Modrinth API
      try {
        if (window.galaxy?.searchMarketplace) {
          const searchQuery = cleanId && !cleanId.includes(' ') ? cleanId : item.name.replace(/[-_]/g, ' ').trim();
          const searchRes = await window.galaxy.searchMarketplace({
            query: searchQuery,
            projectType: type,
            limit: 3
          });

          if (searchRes && searchRes.projects && searchRes.projects.length > 0) {
            const match =
              searchRes.projects.find((p) => {
                const pSlug = (p.slug || '').toLowerCase();
                const pTitle = (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const itemTitleNorm = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                return pSlug === cleanId || pTitle === itemTitleNorm || (cleanId && pSlug.includes(cleanId));
              }) || searchRes.projects[0];

            if (match) {
              const projectTypeSlug = match.projectType || typeSlug;
              targetUrl = `https://modrinth.com/${projectTypeSlug}/${match.slug || match.id}`;
            }
          }
        }
      } catch (err) {
        console.warn('Failed to lookup exact Modrinth project slug:', err);
      }

      // 2. Fallback: If no URL resolved yet, construct direct modrinth slug from id or clean name
      if (!targetUrl) {
        const slug = (item.id || item.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        targetUrl = `https://modrinth.com/${typeSlug}/${slug}`;
      }
    }

    try {
      if (window.galaxy?.openExternal) {
        await window.galaxy.openExternal(targetUrl);
      } else {
        window.open(targetUrl, '_blank');
      }
      onShowToast({
        id: Math.random().toString(),
        type: 'info',
        title: `Opening ${item.name}`,
        message: 'Redirecting to project page in browser.'
      });
    } catch (err) {
      console.error('Failed to open external url:', err);
    }
  };

  // Open in-place Version Switcher Modal
  const handleOpenVersionSwitcher = async (
    item: Mod | ResourcePack | ShaderPack,
    type: 'mod' | 'shader' | 'resourcepack'
  ) => {
    sounds.playClick();
    setVersionChangeItem({ item, type });
    setLoadingItemVersions(true);
    setItemVersions([]);
    setVersionModalSearch('');
    setVersionModalLoader('all');
    setVersionModalOnlyCompat(true);

    try {
      if (window.galaxy) {
        let fetchedVersions: MarketplaceVersion[] = [];
        const cleanId = (item.id || '').trim();

        // 1. Try fetching versions by mod id / slug directly
        if (cleanId && !cleanId.includes(' ') && window.galaxy.getMarketplaceVersions) {
          try {
            fetchedVersions = await window.galaxy.getMarketplaceVersions(cleanId);
          } catch {}
        }

        // 2. If no versions found, search Modrinth for the project
        if ((!fetchedVersions || fetchedVersions.length === 0) && window.galaxy.searchMarketplace) {
          try {
            const searchRes = await window.galaxy.searchMarketplace({
              query: cleanId && !cleanId.includes(' ') ? cleanId : item.name.replace(/[-_]/g, ' ').trim(),
              projectType: type,
              limit: 5
            });

            if (searchRes && searchRes.projects && searchRes.projects.length > 0) {
              const matchedProject =
                searchRes.projects.find((p) => {
                  const pSlug = (p.slug || '').toLowerCase();
                  const pTitle = (p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const itemTitleNorm = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  return pSlug === cleanId.toLowerCase() || pTitle === itemTitleNorm || pSlug.includes(cleanId.toLowerCase());
                }) || searchRes.projects[0];

              if (matchedProject) {
                fetchedVersions = await window.galaxy.getMarketplaceVersions(matchedProject.id);
              }
            }
          } catch {}
        }

        setItemVersions(fetchedVersions || []);
      }
    } catch (err) {
      console.error('Failed to load versions for item:', err);
    } finally {
      setLoadingItemVersions(false);
    }
  };

  const filteredItemVersions = useMemo(() => {
    if (!itemVersions || itemVersions.length === 0) return [];

    return itemVersions.filter((ver) => {
      // 1. Compatibility with instance version & loader
      if (versionModalOnlyCompat && versionChangeItem?.type !== 'resourcepack') {
        const instMcVer = instance.version;
        const instLoader = instance.loader?.toLowerCase();

        if (instMcVer && ver.gameVersions && ver.gameVersions.length > 0) {
          if (!ver.gameVersions.includes(instMcVer)) return false;
        }

        if (instLoader && instLoader !== 'vanilla' && ver.loaders && ver.loaders.length > 0) {
          const verLoaders = ver.loaders.map((l) => l.toLowerCase());
          if (!verLoaders.includes(instLoader)) return false;
        }
      }

      // 2. Loader filter
      if (versionModalLoader !== 'all') {
        const verLoaders = (ver.loaders || []).map((l) => l.toLowerCase());
        if (!verLoaders.includes(versionModalLoader.toLowerCase())) return false;
      }

      // 3. Search query
      if (versionModalSearch.trim()) {
        const q = versionModalSearch.toLowerCase().trim();
        const nameMatch = (ver.name || '').toLowerCase().includes(q);
        const verNumMatch = (ver.versionNumber || '').toLowerCase().includes(q);
        const mcMatch = (ver.gameVersions || []).some((gv) => gv.toLowerCase().includes(q));
        const loaderMatch = (ver.loaders || []).some((l) => l.toLowerCase().includes(q));
        const fileMatch = (ver.files || []).some((f) => (f.filename || '').toLowerCase().includes(q));
        if (!nameMatch && !verNumMatch && !mcMatch && !loaderMatch && !fileMatch) {
          return false;
        }
      }

      return true;
    });
  }, [itemVersions, versionModalOnlyCompat, versionModalLoader, versionModalSearch, instance, versionChangeItem]);

  const handleSwitchVersionAction = async (ver: MarketplaceVersion) => {
    if (!versionChangeItem || !ver || !ver.files || ver.files.length === 0) return;
    const file = ver.files.find((f) => f.primary) || ver.files[0];
    if (!file) return;

    sounds.playSuccess();
    setSwitchingVersionId(ver.id);

    try {
      if (versionChangeItem.type === 'mod') {
        await window.galaxy.installMarketplaceModWithDependencies(
          instance.id,
          file.url,
          file.filename,
          file.hashes?.sha1,
          ver.dependencies,
          instance.loader,
          instance.version
        );
      } else {
        await window.galaxy.installMarketplaceItem(
          instance.id,
          versionChangeItem.type,
          file.url,
          file.filename,
          file.hashes?.sha1
        );
      }

      await loadInstanceData();
      sounds.playSuccess();
      onShowToast({
        id: Math.random().toString(),
        type: 'success',
        title: `Switched ${versionChangeItem.item.name}`,
        message: `Version updated to ${ver.name || ver.versionNumber} in "${instance.name}".`
      });
      setVersionChangeItem(null);
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Failed to switch version',
        message: err.message
      });
    } finally {
      setSwitchingVersionId(null);
    }
  };

  // Bulk Operations
  const handleBulkEnable = async () => {
    sounds.playSwitch();
    for (const filename of selectedFilenames) {
      if (contentCategory === 'mods' || contentCategory === 'all') {
        const mod = mods.find((m) => m.filename === filename);
        if (mod && !mod.enabled) {
          await window.galaxy.toggleMod(instance.id, mod.filename, true);
        }
      }
      if (contentCategory === 'resourcepacks' || contentCategory === 'all') {
        const rp = resourcePacks.find((r) => r.filename === filename);
        if (rp && !rp.enabled && window.galaxy?.toggleResourcePack) {
          await window.galaxy.toggleResourcePack(instance.id, rp.filename, true);
        }
      }
      if (contentCategory === 'shaderpacks' || contentCategory === 'all') {
        const sp = shaderPacks.find((s) => s.filename === filename);
        if (sp && !sp.enabled && window.galaxy?.toggleShaderPack) {
          await window.galaxy.toggleShaderPack(instance.id, sp.filename, true);
        }
      }
    }
    await loadInstanceData();
    sounds.playSuccess();
    onShowToast({
      id: Math.random().toString(),
      type: 'success',
      title: 'Bulk Action Completed',
      message: `Enabled ${selectedFilenames.length} items.`
    });
    setSelectedFilenames([]);
  };

  const handleBulkDisable = async () => {
    sounds.playSwitch();
    for (const filename of selectedFilenames) {
      if (contentCategory === 'mods' || contentCategory === 'all') {
        const mod = mods.find((m) => m.filename === filename);
        if (mod && mod.enabled) {
          await window.galaxy.toggleMod(instance.id, mod.filename, false);
        }
      }
      if (contentCategory === 'resourcepacks' || contentCategory === 'all') {
        const rp = resourcePacks.find((r) => r.filename === filename);
        if (rp && rp.enabled && window.galaxy?.toggleResourcePack) {
          await window.galaxy.toggleResourcePack(instance.id, rp.filename, false);
        }
      }
      if (contentCategory === 'shaderpacks' || contentCategory === 'all') {
        const sp = shaderPacks.find((s) => s.filename === filename);
        if (sp && sp.enabled && window.galaxy?.toggleShaderPack) {
          await window.galaxy.toggleShaderPack(instance.id, sp.filename, false);
        }
      }
    }
    await loadInstanceData();
    sounds.playSuccess();
    onShowToast({
      id: Math.random().toString(),
      type: 'success',
      title: 'Bulk Action Completed',
      message: `Disabled ${selectedFilenames.length} items.`
    });
    setSelectedFilenames([]);
  };

  const handleBulkDeleteConfirm = async () => {
    if (!bulkDeleteTarget) return;
    const targets = bulkDeleteTarget;
    setBulkDeleteTarget(null);
    sounds.playClick();
    try {
      for (const filename of targets) {
        if (contentCategory === 'mods') {
          await window.galaxy.deleteMod(instance.id, filename);
        } else if (contentCategory === 'resourcepacks') {
          await window.galaxy.deleteResourcePack(instance.id, filename);
        } else if (contentCategory === 'shaderpacks') {
          await window.galaxy.deleteShaderPack(instance.id, filename);
        }
      }
      await loadInstanceData();
      sounds.playSuccess();
      setSelectedFilenames([]);
      onShowToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'Deleted Items',
        message: `Removed ${targets.length} items from instance.`
      });
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Delete Failed',
        message: err.message
      });
    }
  };

  // Screenshot Actions
  const handleRefreshScreenshots = async () => {
    sounds.playClick();
    setRefreshingScreenshots(true);
    try {
      if (window.galaxy?.getScreenshotsByInstance) {
        const list = await window.galaxy.getScreenshotsByInstance(instance.id);
        setScreenshots(list || []);
      }
    } catch (err) {
      console.error('Failed to refresh screenshots:', err);
    } finally {
      setRefreshingScreenshots(false);
    }
  };

  const handleCopyScreenshot = async (item: ScreenshotItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sounds.playClick();
    try {
      if (window.galaxy?.copyScreenshotToClipboard) {
        await window.galaxy.copyScreenshotToClipboard(item.filePath);
        sounds.playSuccess();
        setCopiedScreenshotId(item.id);
        setTimeout(() => setCopiedScreenshotId(null), 2500);
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'Copied to Clipboard',
          message: `${item.filename} is ready to paste.`
        });
      }
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Copy Failed',
        message: err.message
      });
    }
  };

  const handleDeleteScreenshotConfirm = async () => {
    if (!screenshotToDelete) return;
    const target = screenshotToDelete;
    setScreenshotToDelete(null);
    try {
      if (window.galaxy?.deleteScreenshot) {
        await window.galaxy.deleteScreenshot(target.filePath);
        setScreenshots((prev) => prev.filter((s) => s.id !== target.id));
        if (activeLightboxIndex !== null) {
          setActiveLightboxIndex(null);
        }
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'info',
          title: 'Screenshot Deleted'
        });
      }
    } catch (err) {
      sounds.playError();
    }
  };

  // World Backup Handlers
  const handleCreateBackup = async (worldFolderName: string) => {
    sounds.playClick();
    setCreatingBackup(worldFolderName);
    try {
      if (window.galaxy?.createWorldBackup) {
        const backup = await window.galaxy.createWorldBackup(instance.id, worldFolderName);
        setBackups((prev) => [backup, ...prev]);
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'World Backup Created',
          message: `Saved ${worldFolderName} (${(backup.sizeBytes / (1024 * 1024)).toFixed(2)} MB)`
        });
      }
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Backup Failed',
        message: err.message
      });
    } finally {
      setCreatingBackup(null);
    }
  };

  const handleRestoreBackup = async (backupFilename: string) => {
    sounds.playClick();
    try {
      if (window.galaxy?.restoreWorldBackup) {
        await window.galaxy.restoreWorldBackup(instance.id, backupFilename);
        const ws = await window.galaxy.getWorldSaves(instance.id);
        setWorldSaves(ws);
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'World Restored Successfully',
          message: `Restored ${backupFilename}`
        });
      }
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Restore Failed',
        message: err.message
      });
    }
  };

  // Dynamic Local Java State & Download Progress
  const [localDetectedJava, setLocalDetectedJava] = useState<JavaInstallation[]>(detectedJava || []);
  const [downloadingJava, setDownloadingJava] = useState(false);
  const [javaDownloadProgress, setJavaDownloadProgress] = useState<{ percent: number; step: string } | null>(null);

  useEffect(() => {
    if (detectedJava && detectedJava.length > 0) {
      setLocalDetectedJava(detectedJava);
    }
  }, [detectedJava]);

  useEffect(() => {
    if (activeTab === 'settings' && window.galaxy?.detectAllJava) {
      window.galaxy.detectAllJava().then((list) => {
        if (list && list.length > 0) {
          setLocalDetectedJava(list);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  const recommendedJavaMajor = useMemo(() => {
    const clean = (mcVersion || '').trim();
    const parts = clean.split('.').map((p) => parseInt(p, 10));
    const major = parts[0] || 1;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    if (major >= 25 || clean.startsWith('25') || clean.startsWith('26') || clean.startsWith('27')) return 25;
    if (major === 1) {
      if (minor >= 21 || (minor === 20 && patch >= 5)) return 21;
      if (minor >= 18) return 17;
      if (minor >= 17) return 16;
      return 8;
    }
    return 21;
  }, [mcVersion]);

  // Settings Helpers & Handlers
  const activeJavaInfo = useMemo((): {
    path: string;
    version: string;
    majorVersion: number;
    vendor: string;
    arch: string;
    isDetected: boolean;
    needsDownload: boolean;
  } => {
    if (javaPath) {
      const match = localDetectedJava.find((j) => j.path.toLowerCase() === javaPath.toLowerCase());
      if (match) {
        return {
          path: match.path,
          version: match.version,
          majorVersion: match.majorVersion,
          vendor: match.vendor,
          arch: match.arch,
          isDetected: true,
          needsDownload: false
        };
      }
      return {
        path: javaPath,
        version: `${recommendedJavaMajor}.0.0`,
        majorVersion: recommendedJavaMajor,
        vendor: 'Custom / OpenJDK',
        arch: '64-Bit',
        isDetected: true,
        needsDownload: false
      };
    }

    if (localDetectedJava && localDetectedJava.length > 0) {
      // Find matching or compatible Java for this instance's Minecraft version
      const exact = localDetectedJava.find((j) => j.majorVersion === recommendedJavaMajor);
      if (exact) {
        return {
          path: exact.path,
          version: exact.version,
          majorVersion: exact.majorVersion,
          vendor: exact.vendor,
          arch: exact.arch,
          isDetected: true,
          needsDownload: false
        };
      }
      const higher = localDetectedJava.find((j) => j.majorVersion >= recommendedJavaMajor);
      if (higher) {
        return {
          path: higher.path,
          version: higher.version,
          majorVersion: higher.majorVersion,
          vendor: higher.vendor,
          arch: higher.arch,
          isDetected: true,
          needsDownload: false
        };
      }
      const fallback = localDetectedJava[0];
      return {
        path: fallback.path,
        version: fallback.version,
        majorVersion: fallback.majorVersion,
        vendor: fallback.vendor,
        arch: fallback.arch,
        isDetected: true,
        needsDownload: false
      };
    }

    // No Java detected on user's system
    return {
      path: `Auto-Download Eclipse Adoptium Java ${recommendedJavaMajor} LTS`,
      version: `${recommendedJavaMajor}.0.0`,
      majorVersion: recommendedJavaMajor,
      vendor: 'Eclipse Adoptium',
      arch: '64-Bit',
      isDetected: false,
      needsDownload: true
    };
  }, [javaPath, localDetectedJava, recommendedJavaMajor]);

  const handleDownloadJava = async (major?: number) => {
    const targetMajor = major || recommendedJavaMajor || 21;
    if (!window.galaxy?.downloadJava) return;
    sounds.playClick();
    setDownloadingJava(true);
    setJavaDownloadProgress({ percent: 5, step: `Connecting to Eclipse Adoptium for Java ${targetMajor}...` });

    const unsubscribe = window.galaxy.onJavaDownloadProgress ? window.galaxy.onJavaDownloadProgress((p) => {
      setJavaDownloadProgress(p);
    }) : () => {};

    try {
      const installed = await window.galaxy.downloadJava(targetMajor);
      unsubscribe();
      setDownloadingJava(false);
      setJavaDownloadProgress(null);
      if (installed && installed.path) {
        setJavaPath(installed.path);
        const freshList = await window.galaxy.detectAllJava();
        if (freshList) setLocalDetectedJava(freshList);
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Java ${targetMajor} LTS Installed`,
          message: `Ready for launch: ${installed.path}`
        });
      }
    } catch (err: any) {
      unsubscribe();
      setDownloadingJava(false);
      setJavaDownloadProgress(null);
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Java Download Failed',
        message: err?.message || 'Failed to download Java runtime'
      });
    }
  };

  const handleChangeJava = async () => {
    sounds.playClick();
    setOpenDropdown(openDropdown === 'java' ? null : 'java');
  };

  const applyPerfPreset = (preset: 'balanced' | 'high' | 'extreme' | 'potato') => {
    sounds.playClick();
    setPerfPreset(preset);
    setOpenDropdown(null);
    switch (preset) {
      case 'balanced':
        setMemoryMax(4096);
        setJvmArgs('-Xmx4G -XX:+UseG1GC -XX:+ParallelRefProcEnabled');
        break;
      case 'high':
        setMemoryMax(8192);
        setJvmArgs('-Xmx8G -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200');
        break;
      case 'extreme':
        setMemoryMax(12288);
        setJvmArgs('-Xmx12G -XX:+UseZGC -XX:+AlwaysPreTouch');
        break;
      case 'potato':
        setMemoryMax(2048);
        setJvmArgs('-Xmx2G -XX:+UseSerialGC');
        break;
    }
  };

  const applyResPreset = (label: string, w: number, h: number) => {
    sounds.playClick();
    setResPreset(label);
    setResWidth(w);
    setResHeight(h);
    setOpenDropdown(null);
  };

  const handleDiscardChanges = () => {
    sounds.playClick();
    setInstName(instance.name);
    setMcVersion(instance.version || '1.20.1');
    setLoader(instance.loader || 'fabric');
    setLoaderVersion(instance.loaderVersion);
    setMemoryMax(instance.memoryMax || 4096);
    setPerfPreset(!instance.memoryMax || instance.memoryMax === 4096 ? 'balanced' : instance.memoryMax <= 2048 ? 'potato' : instance.memoryMax >= 12288 ? 'extreme' : 'high');
    setJvmArgs(instance.jvmArgs || '-Xmx4G -XX:+UseG1GC -XX:+ParallelRefProcEnabled');
    setJavaPath(instance.javaPath || '');
    setResWidth(instance.resolution?.width || 1920);
    setResHeight(instance.resolution?.height || 1080);
    setResPreset(
      instance.resolution?.width === 3840 ? '3840 x 2160 (4K UHD)' :
      instance.resolution?.width === 2560 ? '2560 x 1440 (2K QHD)' :
      instance.resolution?.width === 1280 ? '1280 x 720 (HD)' :
      instance.resolution?.width === 854 ? '854 x 480 (Standard)' :
      '1920 x 1080 (Full HD)'
    );
    setFullscreen(instance.resolution?.fullscreen ?? true);
    setChosenArtwork(resolveInstanceArtwork(instance));
    setChosenArtworkId(instance.iconBackground || '');
    setVsync(false);
    setShowLauncher(true);
    setAutoBackup(false);
    setThemeAccent(instance.iconBackground || 'purple');
    setOpenDropdown(null);
    onShowToast({
      id: Math.random().toString(),
      type: 'info',
      title: 'Changes Discarded',
      message: 'Settings have been reset to current values.'
    });
  };

  const handleRestoreDefaults = () => {
    sounds.playClick();
    setMemoryMax(4096);
    setPerfPreset('balanced');
    setResWidth(1920);
    setResHeight(1080);
    setResPreset('1920 x 1080 (Full HD)');
    setFullscreen(true);
    setVsync(false);
    setShowLauncher(true);
    setJvmArgs('-Xmx4G -XX:+UseG1GC -XX:+ParallelRefProcEnabled');
    setAutoBackup(false);
    setBackupRetention('Keep 3 backups');
    setChosenArtwork(resolveInstanceArtwork(instance));
    setChosenArtworkId(instance.iconBackground || '');
    setThemeAccent('purple');
    setOpenDropdown(null);
    onShowToast({
      id: Math.random().toString(),
      type: 'info',
      title: 'Defaults Restored',
      message: 'All settings reset to recommended defaults (1080p, Balanced, Fullscreen ON, V-Sync OFF, Show Launcher ON).'
    });
  };

  // Settings Save
  const handleSaveSettings = async () => {
    sounds.playSuccess();
    try {
      const updated: Instance = {
        ...instance,
        name: instName.trim() || instance.name,
        icon: chosenArtwork || instance.icon,
        banner: chosenArtwork || instance.banner,
        iconBackground: chosenArtworkId || instance.iconBackground || themeAccent,
        version: mcVersion,
        loader: loader as any,
        loaderVersion: loaderVersion ?? instance.loaderVersion,
        memoryMax,
        jvmArgs,
        javaPath: javaPath || undefined,
        resolution: {
          width: resWidth,
          height: resHeight,
          fullscreen
        }
      };
      await onUpdateInstance(updated);
      onShowToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'Settings Saved',
        message: `Instance updated to Minecraft ${mcVersion} (${loader.toUpperCase()}).`
      });
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save settings.'
      });
    }
  };
  // Sort label display
  const sortLabels: Record<SortOption, string> = {
    name_asc: 'Name (A-Z)',
    name_desc: 'Name (Z-A)',
    version: 'Version',
    size: 'File Size',
    enabled_first: 'Enabled First'
  };

  const totalContentCount =
    contentCategory === 'mods'
      ? mods.length
      : contentCategory === 'resourcepacks'
      ? resourcePacks.length
      : contentCategory === 'shaderpacks'
      ? shaderPacks.length
      : mods.length + resourcePacks.length + shaderPacks.length;

  const isAllSelected =
    contentCategory === 'mods'
      ? filteredAndSortedMods.length > 0 && selectedFilenames.length === filteredAndSortedMods.length
      : contentCategory === 'resourcepacks'
      ? filteredAndSortedResourcePacks.length > 0 && selectedFilenames.length === filteredAndSortedResourcePacks.length
      : contentCategory === 'shaderpacks'
      ? filteredAndSortedShaderPacks.length > 0 && selectedFilenames.length === filteredAndSortedShaderPacks.length
      : (filteredAndSortedMods.length + filteredAndSortedResourcePacks.length + filteredAndSortedShaderPacks.length > 0) &&
        selectedFilenames.length === (filteredAndSortedMods.length + filteredAndSortedResourcePacks.length + filteredAndSortedShaderPacks.length);

  const currentBannerConfig = TAB_BANNER_CONFIG[activeTab] || TAB_BANNER_CONFIG.content;

  return (
    <div className="w-full min-h-full flex flex-col select-none p-4 sm:p-5 lg:p-5 gap-3 sm:gap-3.5 font-sans pb-10">
      {/* ========================================================================= */}
      {/* HERO BANNER CARD — Unified panoramic banner with dedicated subpage artwork */}
      {/* ========================================================================= */}
      <div className="w-full relative rounded-3xl border border-white/[0.1] shadow-2xl h-[200px] sm:h-[215px] lg:h-[225px] xl:h-[235px] group shrink-0 z-30">
        {/* Background Minecraft Subpage Art — Clipped to rounded card corners */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <img
            src={currentBannerConfig.bg}
            alt={currentBannerConfig.label}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000 select-none pointer-events-none"
          />
          {/* Soft dark gradient on the left to ensure crisp text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070a1c]/80 via-[#070a1c]/30 via-28% to-transparent" />
        </div>

        {/* Top Right Quote */}
        <div className="absolute top-5 right-6 sm:right-8 xl:right-9 text-right hidden sm:block pointer-events-none select-none z-10">
          <p className="text-xs sm:text-[13px] xl:text-sm font-display font-medium text-slate-300/85 italic tracking-wider leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
            "{' '}{currentBannerConfig.quoteLine1}<br />{currentBannerConfig.quoteLine2}{' '}"
          </p>
        </div>

        <div className="relative h-full flex flex-col justify-between pl-5 sm:pl-6 xl:pl-7 pr-6 sm:pr-8 xl:pr-9 py-5 sm:py-6 z-10">
          {/* Top section: Back button + Title + Meta info with spacious breathing room */}
          <div className="flex items-center gap-5 sm:gap-6 xl:gap-7 min-w-0">
            {/* Back Button — Positioned comfortably on the left */}
            <button
              onClick={() => { sounds.playClick(); onBack(); }}
              className="w-11 h-11 rounded-2xl bg-[#0f1638]/90 hover:bg-[#182356] text-slate-300 hover:text-white border border-[#233374] hover:border-cyan-500/40 flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-md hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
              title="Back to instances"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            </button>

            {/* Info */}
            <div className="space-y-1.5 sm:space-y-2 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl xl:text-4xl font-display font-extrabold text-white tracking-tight truncate drop-shadow-md leading-tight">
                  {instance.name}
                </h1>
                <button
                  onClick={() => { sounds.playClick(); setShowRenameModal(true); }}
                  className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  title="Rename instance"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {instance.isFavorite && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    <span>Favorite</span>
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm text-slate-300 font-medium">
                <span className="flex items-center gap-1.5 text-white/90">
                  <Box className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="capitalize">{instance.loader}</span>
                  <span>{instance.version}</span>
                </span>
                <span className="text-white/30 select-none">•</span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{formatPlaytime(instance.playTimeMinutes)}</span>
                </span>
                <span className="text-white/30 select-none">•</span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{formatLastPlayed(instance.lastPlayed)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Badges & Action Buttons strictly on the left, leaving the right artwork completely visible */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap pt-2 z-10">
            {/* Badges row */}
            <button
              onClick={() => { sounds.playClick(); setShowHealthModal(true); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)] hover:scale-105 transition-all cursor-pointer shrink-0"
              title="View instance health report"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
              <span>Healthy</span>
            </button>

            <button
              onClick={() => setActiveTab('content')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0f1638] hover:bg-[#182356] border border-[#233374] text-slate-300 transition-colors cursor-pointer shrink-0"
            >
              <span>{mods.length} Mods</span>
            </button>

            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0f1638] border border-[#233374] text-slate-300 shrink-0">
              <span>{totalWorldSizeBytes > 0 ? formatBytes(totalWorldSizeBytes) : '15 MB'}</span>
            </span>

            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#0f1638] border border-[#233374] text-slate-300 shrink-0">
              <span>{backups.length > 0 ? `${backups.length} backups` : 'No backups'}</span>
            </span>

            {/* Action Buttons alongside badges */}
            <div className="flex items-center gap-2 sm:gap-2.5 ml-1 sm:ml-2 shrink-0">
              {instance.isRunning ? (
                <button
                  onClick={() => onKill(instance)}
                  className="px-5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-[0_0_16px_rgba(225,29,72,0.4)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={() => onLaunch(instance)}
                  className="px-5 py-1.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-[#052e16] font-black text-xs shadow-[0_0_20px_rgba(0,230,118,0.55)] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-[#052e16] stroke-[#052e16]" />
                  <span>Play</span>
                </button>
              )}

              <button
                onClick={() => { sounds.playClick(); setShowShareModal(true); }}
                className="px-3.5 py-1.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] text-cyan-200 border border-[#233374] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Share Instance Code"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => { sounds.playClick(); setShowHeaderMoreMenu(!showHeaderMoreMenu); }}
                  className="px-3 py-1.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] text-cyan-200 border border-[#233374] text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                  title="More Options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                </button>

                {showHeaderMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowHeaderMoreMenu(false)} />
                    <div className="absolute left-0 top-full mt-2 w-56 rounded-2xl bg-[#0b102c]/98 border border-[#233374] shadow-[0_16px_50px_rgba(0,0,0,0.95)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
                      <button onClick={() => { setShowHeaderMoreMenu(false); sounds.playClick(); setShowHealthModal(true); }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                        <Stethoscope className="w-4 h-4 text-emerald-400" /><span>Run Health Checkup</span>
                      </button>
                      <button onClick={() => { setShowHeaderMoreMenu(false); onOpenFolder(instance); }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                        <FolderOpen className="w-4 h-4 text-cyan-400" /><span>Open Instance Folder</span>
                      </button>
                      <button onClick={() => { setShowHeaderMoreMenu(false); sounds.playClick(); setShowCloneModal(true); }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                        <Copy className="w-4 h-4 text-purple-400" /><span>Clone Instance</span>
                      </button>
                      <button onClick={async () => { setShowHeaderMoreMenu(false); sounds.playClick(); if (window.galaxy?.toggleInstanceFavorite) { await window.galaxy.toggleInstanceFavorite(instance.id); const updated = { ...instance, isFavorite: !instance.isFavorite }; await onUpdateInstance(updated); onShowToast({ id: Math.random().toString(), type: 'info', title: updated.isFavorite ? 'Starred as Favorite' : 'Removed from Favorites', message: `${instance.name} ${updated.isFavorite ? 'pinned in favorites' : 'unstarred'}.` }); } }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                        <Star className="w-4 h-4 text-amber-400" /><span>{instance.isFavorite ? 'Unfavorite Instance' : 'Star as Favorite'}</span>
                      </button>
                      <div className="my-1 border-t border-white/[0.08]" />
                      <button onClick={() => { setShowHeaderMoreMenu(false); sounds.playClick(); setShowDeleteInstanceModal(true); }} className="w-full px-3.5 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2.5 cursor-pointer">
                        <Trash2 className="w-4 h-4 text-rose-400" /><span>Delete Instance</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INSTANCE NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 px-1 shrink-0">
        {[
          { id: 'content', label: 'Content', icon: Box, count: undefined },
          { id: 'files', label: 'Files', icon: Folder },
          { id: 'worlds', label: 'Worlds', icon: Globe, count: worldSaves.length },
          { id: 'logs', label: 'Logs', icon: Terminal },
          { id: 'screenshots', label: 'Screenshots', icon: Image, count: screenshots.length },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playSwitch();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 border border-blue-400/50 text-white shadow-[0_0_22px_rgba(37,99,235,0.6)]'
                  : 'bg-[#0c1233]/80 hover:bg-[#152055] text-slate-300 hover:text-white border border-[#1e2d6b]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-blue-700/90 text-white' : 'bg-[#172255] text-blue-200'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT BODY */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* ----------------------------------------------------------------------- */}
        {/* CONTENT TAB */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'content' && (
          <div className="rounded-2xl border border-[#1e2d6b] bg-[#070b22]/95 backdrop-blur-xl shadow-2xl p-5 space-y-4 animate-in fade-in duration-150">
            {/* Search Bar & Action Buttons Row */}
            <div className="flex items-center justify-between gap-3">
              {/* Search input: "Search 16 mods..." */}
              <div className="relative w-80 md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${contentCategory === 'mods' ? mods.length : contentCategory === 'resourcepacks' ? resourcePacks.length : contentCategory === 'shaderpacks' ? shaderPacks.length : totalContentCount} ${contentCategory === 'mods' ? 'mods' : 'projects'}...`}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#0a0f2e] border border-[#233374] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 shadow-inner transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Install Mod, Add from File, Browse Mods */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => handleOpenAddContent(contentCategory === 'resourcepacks' ? 'resourcepack' : contentCategory === 'shaderpacks' ? 'shader' : 'mod')}
                  className="px-4 py-2.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] text-white border border-[#233374] hover:border-blue-400/50 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
                  title="Install from Modrinth / CurseForge"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  <span>{contentCategory === 'resourcepacks' ? 'Install Pack' : contentCategory === 'shaderpacks' ? 'Install Shader' : 'Install Mod'}</span>
                </button>

                <button
                  onClick={handleUploadFiles}
                  className="px-4 py-2.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] text-white border border-[#233374] hover:border-blue-400/50 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
                  title="Add jar/zip files from computer"
                >
                  <Folder className="w-4 h-4 text-blue-400" />
                  <span>Add from File</span>
                </button>

                <button
                  onClick={() => onNavigateToMarketplace(contentCategory === 'resourcepacks' ? 'resourcepack' : contentCategory === 'shaderpacks' ? 'shader' : 'mod')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_22px_rgba(37,99,235,0.65)] border border-blue-400/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  title="Browse Marketplace"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>{contentCategory === 'resourcepacks' ? 'Browse Packs' : contentCategory === 'shaderpacks' ? 'Browse Shaders' : 'Browse Mods'}</span>
                </button>
              </div>
            </div>

            {/* Filter & Sort Row (Sub-toolbar) */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Left: Sort + Filter + Category Pills */}
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowSortDropdown(!showSortDropdown);
                      setShowFilterDropdown(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] border border-[#233374] text-xs text-white font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sortLabels[sortBy] || 'Name (A-Z)'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showSortDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowSortDropdown(false)} />
                      <div className="absolute left-0 mt-1.5 w-44 rounded-xl bg-[#0e1329] border border-[#233374] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {(['name_asc', 'name_desc', 'version', 'size', 'enabled_first']).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              sounds.playClick();
                              setSortBy(opt as SortOption);
                              setShowSortDropdown(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between cursor-pointer ${
                              sortBy === opt ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span>{sortLabels[opt]}</span>
                            {sortBy === opt && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Filter Funnel Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowFilterDropdown(!showFilterDropdown);
                      setShowSortDropdown(false);
                    }}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      statusFilter !== 'all'
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                        : 'bg-[#0f1638] hover:bg-[#182356] text-slate-300 hover:text-white border-[#233374]'
                    }`}
                    title="Filter by status"
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>

                  {showFilterDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowFilterDropdown(false)} />
                      <div className="absolute left-0 mt-1.5 w-40 rounded-xl bg-[#0e1329] border border-[#233374] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {['all', 'enabled', 'disabled'].map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              sounds.playClick();
                              setStatusFilter(st as StatusFilter);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs capitalize flex items-center justify-between cursor-pointer ${
                              statusFilter === st ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span>{st === 'all' ? 'All Status' : st}</span>
                            {statusFilter === st && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 ml-2">
                  {[
                    { id: 'all', label: 'All', count: mods.length + resourcePacks.length + shaderPacks.length },
                    { id: 'mods', label: 'Mods', count: mods.length },
                    { id: 'resourcepacks', label: 'Resource Packs', count: resourcePacks.length },
                    { id: 'shaderpacks', label: 'Shaders', count: shaderPacks.length }
                  ].map((cat) => {
                    const isActive = contentCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setContentCategory(cat.id as ContentCategory);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 border border-blue-400/60 text-white shadow-[0_0_16px_rgba(37,99,235,0.55)]'
                            : 'bg-[#0f1638] hover:bg-[#182356] text-slate-300 hover:text-white border border-[#233374]'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-1 rounded-full ${
                            isActive ? 'bg-blue-700/80 text-white' : 'text-slate-400'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Update All & Refresh */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onShowToast({
                      id: Math.random().toString(),
                      type: 'info',
                      title: 'Projects are up to date',
                      message: 'All installed projects are on their latest compatible versions.'
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] border border-[#233374] text-cyan-400 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Update All</span>
                </button>

                <button
                  onClick={async () => {
                    sounds.playClick();
                    await loadInstanceData();
                    onShowToast({
                      id: Math.random().toString(),
                      type: 'info',
                      title: 'Refreshed content list'
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] border border-[#233374] text-slate-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''} text-slate-400`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Bulk Selection Bar */}
            {selectedFilenames.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 shadow-lg shadow-blue-950/50 animate-in fade-in duration-150">
                <span className="text-xs font-semibold text-blue-200">
                  {selectedFilenames.length} item{selectedFilenames.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkEnable}
                    className="px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Enable Selected
                  </button>
                  <button
                    onClick={handleBulkDisable}
                    className="px-3 py-1 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Disable Selected
                  </button>
                  <button
                    onClick={() => setBulkDeleteTarget(selectedFilenames)}
                    className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedFilenames([])}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Table Header: 5-column layout */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#1b2658]">
              <div className="col-span-4 flex items-center gap-3">
                <button
                  onClick={handleToggleSelectAll}
                  className="w-4 h-4 rounded-md border border-[#2c3d7e] bg-[#0c1334] flex items-center justify-center hover:border-blue-400 transition-colors cursor-pointer shrink-0"
                  title={isAllSelected ? 'Deselect All' : 'Select All'}
                >
                  {isAllSelected && (
                    <div className="w-full h-full bg-blue-600 rounded-[5px] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
                <span>{contentCategory === 'resourcepacks' ? 'PACK NAME' : contentCategory === 'shaderpacks' ? 'SHADER NAME' : 'MOD NAME'}</span>
              </div>
              <div className="col-span-2"><span>VERSION</span></div>
              <div className="col-span-2"><span>AUTHOR</span></div>
              <div className="col-span-2 flex items-center justify-between pr-4 pl-1"><span>STATUS</span><span className="text-[9px] text-slate-500 font-mono tracking-wider">TOGGLE</span></div>
              <div className="col-span-2 text-right pr-3"><span>ACTIONS</span></div>
            </div>

            {/* MODS LISTING */}
            {(contentCategory === 'mods' || contentCategory === 'all') && (
              filteredAndSortedMods.length === 0 && contentCategory === 'mods' ? (
                <div className="rounded-2xl border border-dashed border-[#233374] p-12 flex flex-col items-center justify-center text-center space-y-3 bg-[#0a0f2e]/50">
                  <Package className="w-10 h-10 text-slate-500" />
                  <div className="text-sm font-bold text-white">No Mods Found</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {searchQuery
                      ? `No mods matched "${searchQuery}".`
                      : 'This instance does not have any mods installed yet.'}
                  </p>
                  <button
                    onClick={() => onNavigateToMarketplace('mod')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Discover Mods</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {contentCategory === 'all' && filteredAndSortedMods.length > 0 && (
                    <div className="px-2 pt-2 pb-1 text-xs font-bold text-blue-400 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <span>Mods ({filteredAndSortedMods.length})</span>
                    </div>
                  )}
                  {filteredAndSortedMods.map((mod) => {
                    const isSelected = selectedFilenames.includes(mod.filename);
                    const isRowMenuOpen = activeRowMenu === mod.filename;
                    const enriched = enrichedMetadataMap[mod.filename] || resolveContentMetadata(mod.name, mod.filename, mod.icon, mod.description, mod.authors, 'mod');
                    const iconSrc = enriched.icon || mod.icon;
                    const authorName = enriched.author || (mod.authors && mod.authors[0]) || '';
                    const authorAvatar = enriched.authorAvatar;
                    const descriptionText = enriched.description || mod.description || '';

                    return (
                      <div
                        key={mod.filename}
                        className={`group grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500/50 shadow-sm'
                            : mod.enabled
                            ? 'border-transparent hover:border-[#223377] hover:bg-[#0f163b]/70 border-b border-[#162152]/60'
                            : 'border-transparent hover:border-[#223377] bg-[#070b1e]/50 hover:bg-[#0c1230]/60 border-b border-[#162152]/40 opacity-60'
                        }`}
                      >
                        {/* Checkbox + Icon + Title + Description */}
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectItem(mod.filename)}
                            className="w-4 h-4 rounded-md border border-[#2c3d7e] bg-[#0c1334] flex items-center justify-center hover:border-blue-400 transition-colors cursor-pointer shrink-0"
                          >
                            {isSelected && (
                              <div className="w-full h-full bg-blue-600 rounded-[5px] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              </div>
                            )}
                          </button>
                          <div className="w-12 h-12 rounded-xl bg-[#121a42] border border-[#243575] flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                            {iconSrc ? (
                              <img src={iconSrc} alt={mod.name} className="w-full h-full object-cover rounded-xl" loading="lazy" onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                            ) : (
                              <Package className="w-6 h-6 text-blue-400/80" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button type="button" onClick={() => handleOpenWebLink(mod, 'mod')} className="text-left inline-flex items-center gap-1 max-w-full text-xs font-bold text-white hover:text-blue-300 transition-colors cursor-pointer" title="Open mod page">
                              <span className="truncate">{mod.name}</span>
                            </button>
                            {descriptionText && <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">{descriptionText}</p>}
                          </div>
                        </div>

                        {/* VERSION */}
                        <div className="col-span-2 min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate font-mono">{mod.version || '—'}</div>
                          <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5" title={mod.filename}>{mod.filename}</div>
                        </div>

                        {/* AUTHOR */}
                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center border border-white/10 shrink-0">
                            {authorAvatar ? (
                              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                            ) : (
                              <span className="text-[9px] text-white/80 font-bold">{authorName ? authorName.charAt(0).toUpperCase() : '?'}</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-300 truncate font-medium">{authorName || '—'}</span>
                        </div>

                        {/* STATUS */}
                        <div className="col-span-2 flex items-center justify-between pr-4 pl-1">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${
                            mod.enabled
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${mod.enabled ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'}`} />
                            <span>{mod.enabled ? 'Enabled' : 'Disabled'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleMod(mod)}
                            className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer shrink-0 ${
                              mod.enabled
                                ? 'bg-[#00e676] shadow-[0_0_14px_rgba(0,230,118,0.55)]'
                                : 'bg-[#151c3a] border border-[#27366d] hover:border-slate-500'
                            }`}
                            title={mod.enabled ? 'Disable' : 'Enable'}
                          >
                            <div
                              className={`w-4 h-4 rounded-full shadow-md transition-all duration-300 ease-in-out transform ${
                                mod.enabled
                                  ? 'translate-x-5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                  : 'translate-x-0 bg-slate-400'
                              }`}
                            />
                          </button>
                        </div>

                        {/* ACTIONS: 4 Distinct Card Buttons */}
                        <div className="col-span-2 flex items-center justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenFolder(instance, 'mods')}
                            className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Open in folder"
                          >
                            <Folder className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWebLink(mod, 'mod')}
                            className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMod(mod)}
                            className="w-10 h-10 rounded-xl bg-[#27121b] border border-[#ef4444]/35 hover:border-rose-400/70 hover:bg-[#3d1625] text-[#f87171] hover:text-rose-200 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Remove Mod"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { sounds.playClick(); setActiveRowMenu(isRowMenuOpen ? null : mod.filename); }}
                              className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {isRowMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveRowMenu(null)} />
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#0e1329] border border-[#253575] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                  <button onClick={() => { setActiveRowMenu(null); handleOpenVersionSwitcher(mod, 'mod'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" /><span>Change Version</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); onOpenFolder(instance, 'mods'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /><span>Show in Explorer</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); handleOpenWebLink(mod, 'mod'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <Globe className="w-3.5 h-3.5 text-blue-400" /><span>Open in Browser</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); handleToggleMod(mod); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <Power className="w-3.5 h-3.5 text-amber-400" /><span>{mod.enabled ? 'Disable Mod' : 'Enable Mod'}</span>
                                  </button>
                                  <div className="my-1 border-t border-white/10" />
                                  <button onClick={() => { setActiveRowMenu(null); handleDeleteMod(mod); }} className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /><span>Remove Mod</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* RESOURCE PACKS LISTING (Same 5-column layout with 4-button cards) */}
            {(contentCategory === 'resourcepacks' || contentCategory === 'all') && (
              filteredAndSortedResourcePacks.length === 0 && contentCategory === 'resourcepacks' ? (
                <div className="rounded-2xl border border-dashed border-[#233374] p-12 flex flex-col items-center justify-center text-center space-y-3 bg-[#0a0f2e]/50">
                  <Layers className="w-10 h-10 text-slate-500" />
                  <div className="text-sm font-bold text-white">No Resource Packs Found</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {searchQuery
                      ? `No resource packs matched "${searchQuery}".`
                      : 'This instance does not have any resource packs installed yet.'}
                  </p>
                  <button
                    onClick={() => onNavigateToMarketplace('resourcepack')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Discover Resource Packs</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {contentCategory === 'all' && filteredAndSortedResourcePacks.length > 0 && (
                    <div className="px-2 pt-3 pb-1 text-xs font-bold text-purple-400 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>Resource Packs ({filteredAndSortedResourcePacks.length})</span>
                    </div>
                  )}
                  {filteredAndSortedResourcePacks.map((rp) => {
                    const isSelected = selectedFilenames.includes(rp.filename);
                    const isRowMenuOpen = activeRowMenu === rp.filename;
                    const enriched = enrichedMetadataMap[rp.filename] || resolveContentMetadata(rp.name, rp.filename, rp.icon, rp.description, rp.authors, 'resourcepack');
                    const iconSrc = enriched.icon || rp.icon;
                    const authorName = enriched.author || (rp.authors && rp.authors[0]) || '';
                    const authorAvatar = enriched.authorAvatar;
                    const descriptionText = enriched.description || rp.description || '';

                    return (
                      <div
                        key={rp.filename}
                        className={`group grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500/50 shadow-sm'
                            : rp.enabled
                            ? 'border-transparent hover:border-[#223377] hover:bg-[#0f163b]/70 border-b border-[#162152]/60'
                            : 'border-transparent hover:border-[#223377] bg-[#070b1e]/50 hover:bg-[#0c1230]/60 border-b border-[#162152]/40 opacity-60'
                        }`}
                      >
                        {/* Checkbox + Icon + Title + Description */}
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectItem(rp.filename)}
                            className="w-4 h-4 rounded-md border border-[#2c3d7e] bg-[#0c1334] flex items-center justify-center hover:border-blue-400 transition-colors cursor-pointer shrink-0"
                          >
                            {isSelected && (
                              <div className="w-full h-full bg-blue-600 rounded-[5px] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              </div>
                            )}
                          </button>
                          <div className="w-12 h-12 rounded-xl bg-[#121a42] border border-[#243575] flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                            {iconSrc ? (
                              <img src={iconSrc} alt={rp.name} className="w-full h-full object-cover rounded-xl" loading="lazy" onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                            ) : (
                              <Layers className="w-6 h-6 text-purple-400/80" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button type="button" onClick={() => handleOpenWebLink(rp, 'resourcepack')} className="text-left inline-flex items-center gap-1 max-w-full text-xs font-bold text-white hover:text-purple-300 transition-colors cursor-pointer" title="Open pack page">
                              <span className="truncate">{rp.name}</span>
                            </button>
                            {descriptionText && <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">{descriptionText}</p>}
                          </div>
                        </div>

                        {/* VERSION */}
                        <div className="col-span-2 min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate font-mono">{rp.version || 'Release'}</div>
                          <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5" title={rp.filename}>{rp.filename}</div>
                        </div>

                        {/* AUTHOR */}
                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center border border-white/10 shrink-0">
                            {authorAvatar ? (
                              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                            ) : (
                              <span className="text-[9px] text-white/80 font-bold">{authorName ? authorName.charAt(0).toUpperCase() : '?'}</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-300 truncate font-medium">{authorName || '—'}</span>
                        </div>

                        {/* STATUS */}
                        <div className="col-span-2 flex items-center justify-between pr-4 pl-1">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${
                            rp.enabled
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${rp.enabled ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'}`} />
                            <span>{rp.enabled ? 'Enabled' : 'Disabled'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleResourcePack(rp)}
                            className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer shrink-0 ${
                              rp.enabled
                                ? 'bg-[#00e676] shadow-[0_0_14px_rgba(0,230,118,0.55)]'
                                : 'bg-[#151c3a] border border-[#27366d] hover:border-slate-500'
                            }`}
                            title={rp.enabled ? 'Disable' : 'Enable'}
                          >
                            <div
                              className={`w-4 h-4 rounded-full shadow-md transition-all duration-300 ease-in-out transform ${
                                rp.enabled
                                  ? 'translate-x-5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                  : 'translate-x-0 bg-slate-400'
                              }`}
                            />
                          </button>
                        </div>

                        {/* ACTIONS: 4 Distinct Card Buttons */}
                        <div className="col-span-2 flex items-center justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenFolder(instance, 'resourcepacks')}
                            className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Open in folder"
                          >
                            <Folder className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWebLink(rp, 'resourcepack')}
                            className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteResourcePack(rp)}
                            className="w-10 h-10 rounded-xl bg-[#27121b] border border-[#ef4444]/35 hover:border-rose-400/70 hover:bg-[#3d1625] text-[#f87171] hover:text-rose-200 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Remove Resource Pack"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { sounds.playClick(); setActiveRowMenu(isRowMenuOpen ? null : rp.filename); }}
                              className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {isRowMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveRowMenu(null)} />
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#0e1329] border border-[#253575] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                  <button onClick={() => { setActiveRowMenu(null); handleOpenVersionSwitcher(rp, 'resourcepack'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" /><span>Change Version</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); onOpenFolder(instance, 'resourcepacks'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /><span>Show in Explorer</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); handleOpenWebLink(rp, 'resourcepack'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <Globe className="w-3.5 h-3.5 text-purple-400" /><span>Open in Browser</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); handleToggleResourcePack(rp); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <Power className="w-3.5 h-3.5 text-amber-400" /><span>{rp.enabled ? 'Disable Pack' : 'Enable Pack'}</span>
                                  </button>
                                  <div className="my-1 border-t border-white/10" />
                                  <button onClick={() => { setActiveRowMenu(null); handleDeleteResourcePack(rp); }} className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /><span>Remove Resource Pack</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* SHADER PACKS LISTING (Same 5-column layout with 4-button cards) */}
            {(contentCategory === 'shaderpacks' || contentCategory === 'all') && (
              filteredAndSortedShaderPacks.length === 0 && contentCategory === 'shaderpacks' ? (
                <div className="rounded-2xl border border-dashed border-[#233374] p-12 flex flex-col items-center justify-center text-center space-y-3 bg-[#0a0f2e]/50">
                  <Sparkles className="w-10 h-10 text-slate-500" />
                  <div className="text-sm font-bold text-white">No Shader Packs Found</div>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {searchQuery
                      ? `No shaders matched "${searchQuery}".`
                      : 'This instance does not have any shader packs installed yet.'}
                  </p>
                  <button
                    onClick={() => onNavigateToMarketplace('shader')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Discover Shaders</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {contentCategory === 'all' && filteredAndSortedShaderPacks.length > 0 && (
                    <div className="px-2 pt-3 pb-1 text-xs font-bold text-cyan-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Shader Packs ({filteredAndSortedShaderPacks.length})</span>
                    </div>
                  )}
                  {filteredAndSortedShaderPacks.map((sp) => {
                    const isSelected = selectedFilenames.includes(sp.filename);
                    const isRowMenuOpen = activeRowMenu === sp.filename;
                    const enriched = enrichedMetadataMap[sp.filename] || resolveContentMetadata(sp.name, sp.filename, sp.icon, sp.description, sp.authors, 'shader');
                    const iconSrc = enriched.icon || sp.icon;
                    const authorName = enriched.author || (sp.authors && sp.authors[0]) || '';
                    const authorAvatar = enriched.authorAvatar;
                    const descriptionText = enriched.description || sp.description || '';

                    return (
                      <div
                        key={sp.filename}
                        className={`group grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/50 shadow-sm'
                            : sp.enabled
                            ? 'border-transparent hover:border-[#223377] hover:bg-[#0f163b]/70 border-b border-[#162152]/60'
                            : 'border-transparent hover:border-[#223377] bg-[#070b1e]/50 hover:bg-[#0c1230]/60 border-b border-[#162152]/40 opacity-60'
                        }`}
                      >
                        {/* Checkbox + Icon + Title + Description */}
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectItem(sp.filename)}
                            className="w-4 h-4 rounded-md border border-[#2c3d7e] bg-[#0c1334] flex items-center justify-center hover:border-blue-400 transition-colors cursor-pointer shrink-0"
                          >
                            {isSelected && (
                              <div className="w-full h-full bg-blue-600 rounded-[5px] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              </div>
                            )}
                          </button>
                          <div className="w-12 h-12 rounded-xl bg-[#121a42] border border-[#243575] flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                            {iconSrc ? (
                              <img src={iconSrc} alt={sp.name} className="w-full h-full object-cover rounded-xl" loading="lazy" onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                            ) : (
                              <Sparkles className="w-6 h-6 text-cyan-400/80" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button type="button" onClick={() => handleOpenWebLink(sp, 'shader')} className="text-left inline-flex items-center gap-1 max-w-full text-xs font-bold text-white hover:text-cyan-300 transition-colors cursor-pointer" title="Open shader page">
                              <span className="truncate">{sp.name}</span>
                            </button>
                            {descriptionText && <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">{descriptionText}</p>}
                          </div>
                        </div>

                        {/* VERSION */}
                        <div className="col-span-2 min-w-0">
                          <div className="text-xs font-bold text-slate-200 truncate font-mono">{sp.version || 'Release'}</div>
                          <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5" title={sp.filename}>{sp.filename}</div>
                        </div>

                        {/* AUTHOR */}
                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center border border-white/10 shrink-0">
                            {authorAvatar ? (
                              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                            ) : (
                              <span className="text-[9px] text-white/80 font-bold">{authorName ? authorName.charAt(0).toUpperCase() : '?'}</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-300 truncate font-medium">{authorName || '—'}</span>
                        </div>

                        {/* STATUS */}
                        <div className="col-span-2 flex items-center justify-between pr-4 pl-1">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${
                            sp.enabled
                              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-white/5 border-white/10 text-slate-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sp.enabled ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'}`} />
                            <span>{sp.enabled ? 'Enabled' : 'Disabled'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleShaderPack(sp)}
                            className={`relative w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ease-in-out cursor-pointer shrink-0 ${
                              sp.enabled
                                ? 'bg-[#00e676] shadow-[0_0_14px_rgba(0,230,118,0.55)]'
                                : 'bg-[#151c3a] border border-[#27366d] hover:border-slate-500'
                            }`}
                            title={sp.enabled ? 'Disable' : 'Enable'}
                          >
                            <div
                              className={`w-4 h-4 rounded-full shadow-md transition-all duration-300 ease-in-out transform ${
                                sp.enabled
                                  ? 'translate-x-5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                  : 'translate-x-0 bg-slate-400'
                              }`}
                            />
                          </button>
                        </div>

                        {/* ACTIONS: 4 Distinct Card Buttons */}
                        <div className="col-span-2 flex items-center justify-end gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onOpenFolder(instance, 'shaderpacks')}
                            className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Open in folder"
                          >
                            <Folder className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWebLink(sp, 'shader')}
                            className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteShaderPack(sp)}
                            className="w-10 h-10 rounded-xl bg-[#27121b] border border-[#ef4444]/35 hover:border-rose-400/70 hover:bg-[#3d1625] text-[#f87171] hover:text-rose-200 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Remove Shader"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => { sounds.playClick(); setActiveRowMenu(isRowMenuOpen ? null : sp.filename); }}
                              className="w-10 h-10 rounded-xl bg-[#111736] border border-[#253575] hover:border-blue-400/60 hover:bg-[#192455] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {isRowMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveRowMenu(null)} />
                                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#0e1329] border border-[#253575] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                  <button onClick={() => { setActiveRowMenu(null); handleOpenVersionSwitcher(sp, 'shader'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" /><span>Change Version</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); onOpenFolder(instance, 'shaderpacks'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /><span>Show in Explorer</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); handleOpenWebLink(sp, 'shader'); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <Globe className="w-3.5 h-3.5 text-cyan-400" /><span>Open in Browser</span>
                                  </button>
                                  <button onClick={() => { setActiveRowMenu(null); handleToggleShaderPack(sp); }} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                    <Power className="w-3.5 h-3.5 text-amber-400" /><span>{sp.enabled ? 'Disable Shader' : 'Enable Shader'}</span>
                                  </button>
                                  <div className="my-1 border-t border-white/10" />
                                  <button onClick={() => { setActiveRowMenu(null); handleDeleteShaderPack(sp); }} className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /><span>Remove Shader</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        )}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'files' && (
          <div className="rounded-2xl border border-[#1e2d6b] bg-[#070b22]/95 backdrop-blur-xl shadow-2xl p-5 space-y-4 animate-in fade-in duration-150">
            <div className="p-6 rounded-2xl bg-galaxy-900/70 border border-white/[0.08] flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                  <span>Instance Directory</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Explore instance data folders, configurations, mods, and worlds in your system file explorer.
                </p>
              </div>

              <button
                onClick={() => onOpenFolder(instance)}
                className="px-4 py-2 rounded-xl bg-[#1BD96A] hover:bg-[#15b757] text-black font-bold text-xs flex items-center space-x-2 transition-all active:scale-95"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Open in File Explorer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { name: 'Mods Folder', sub: 'mods', icon: Package, count: `${mods.length} files` },
                { name: 'Config Folder', sub: 'config', icon: Sliders, count: 'Configuration' },
                { name: 'World Saves', sub: 'saves', icon: Globe, count: `${worldSaves.length} saves` },
                { name: 'Resource Packs', sub: 'resourcepacks', icon: Layers, count: `${resourcePacks.length} packs` },
                { name: 'Shader Packs', sub: 'shaderpacks', icon: Sparkles, count: `${shaderPacks.length} shaders` },
                { name: 'Logs & Crashes', sub: 'logs', icon: Terminal, count: 'Log files' }
              ].map((folder) => {
                const Icon = folder.icon;
                return (
                  <button
                    key={folder.sub}
                    onClick={() => onOpenFolder(instance, folder.sub)}
                    className="p-4 rounded-2xl bg-galaxy-900/60 hover:bg-galaxy-800 border border-white/[0.06] hover:border-white/[0.2] transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-galaxy-950 text-cyan-300 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 group-hover:text-white">{folder.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{folder.count}</div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* WORLDS TAB */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'worlds' && (
          <div className="rounded-2xl border border-[#1e2d6b] bg-[#070b22]/95 backdrop-blur-xl shadow-2xl p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">World Saves & Backups</span>
              <button
                onClick={() => onOpenFolder(instance, 'saves')}
                className="px-3 py-1.5 rounded-xl bg-galaxy-900 border border-white/[0.08] text-xs text-slate-300 hover:text-white flex items-center space-x-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Saves Folder</span>
              </button>
            </div>

            {worldSaves.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center space-y-3 bg-galaxy-900/20">
                <Globe className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-200">No Worlds Found</div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Launch the game and create a singleplayer world to see it here!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {worldSaves.map((ws) => (
                  <div
                    key={ws.folderName}
                    className="p-4 rounded-2xl bg-galaxy-900/70 border border-white/[0.08] hover:border-white/[0.2] transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-100">{ws.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{ws.folderName}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-400">
                        {(ws.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {ws.lastPlayed ? new Date(ws.lastPlayed).toLocaleDateString() : 'Unknown date'}
                      </span>

                      <button
                        onClick={() => handleCreateBackup(ws.folderName)}
                        disabled={creatingBackup === ws.folderName}
                        className="px-3 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-semibold flex items-center space-x-1.5 transition-all"
                      >
                        <HardDrive className="w-3 h-3" />
                        <span>{creatingBackup === ws.folderName ? 'Saving...' : 'Backup'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Backups List */}
            {backups.length > 0 && (
              <div className="space-y-2 pt-4">
                <h4 className="text-xs font-display font-bold text-slate-300 flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>World Backups ({backups.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {backups.map((b) => (
                    <div
                      key={b.filename}
                      className="p-3 rounded-xl bg-galaxy-900/50 border border-white/[0.06] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{b.worldName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{b.filename} â€¢ {(b.sizeBytes / (1024 * 1024)).toFixed(2)} MB</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleRestoreBackup(b.filename)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => setBackupToDelete(b)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* LOGS TAB */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'logs' && (
          <div className="rounded-2xl border border-[#1e2d6b] bg-[#070b22]/95 backdrop-blur-xl shadow-2xl p-5 space-y-4 animate-in fade-in duration-150">
            <div className="p-6 rounded-2xl bg-galaxy-900/70 border border-white/[0.08] flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Game Logs & Diagnostic Output</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Inspect crash reports, latest.log, and JVM output for debugging issues.
                </p>
              </div>

              <button
                onClick={() => onOpenFolder(instance, 'logs')}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-slate-200 flex items-center space-x-2"
              >
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Open Logs Folder</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SCREENSHOTS TAB */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'screenshots' && (() => {
          const filtered = screenshots
            .filter((s) => s.filename.toLowerCase().includes(screenshotSearch.toLowerCase()))
            .sort((a, b) => {
              if (screenshotSort === 'oldest') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              }
              if (screenshotSort === 'name') {
                return a.filename.localeCompare(b.filename);
              }
              if (screenshotSort === 'size') {
                return (b.sizeBytes || 0) - (a.sizeBytes || 0);
              }
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

          const sortLabels: Record<string, string> = {
            newest: 'Newest First',
            oldest: 'Oldest First',
            name: 'Name (A-Z)',
            size: 'File Size'
          };

          return (
            <div className="w-full flex-1 flex flex-col space-y-4 animate-in fade-in duration-200">
              {/* Modern Screenshots Sub-Toolbar matching Reference Design */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                {/* Search Box */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={screenshotSearch}
                    onChange={(e) => setScreenshotSearch(e.target.value)}
                    placeholder="Search screenshots..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0b102b] border border-[#233374] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors shadow-inner"
                  />
                  {screenshotSearch && (
                    <button
                      onClick={() => setScreenshotSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Action Buttons: Take Screenshot, Open Folder, Grid/List, Sort */}
                <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
                  {/* Take / Import Screenshot Button */}
                  <button
                    onClick={handleTakeScreenshot}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_22px_rgba(37,99,235,0.65)] border border-blue-400/50 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                    title="Take or Import Screenshot"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Take Screenshot</span>
                  </button>

                  {/* Open Folder Button */}
                  <button
                    onClick={() => onOpenFolder(instance, 'screenshots')}
                    className="px-4 py-2.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] text-white border border-[#233374] hover:border-blue-400/50 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
                    title="Open screenshots folder in File Explorer"
                  >
                    <FolderOpen className="w-4 h-4 text-cyan-400" />
                    <span>Open Folder</span>
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex items-center p-1 rounded-xl bg-[#0f1638] border border-[#233374]">
                    <button
                      onClick={() => { sounds.playClick(); setScreenshotViewMode('grid'); }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        screenshotViewMode === 'grid'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { sounds.playClick(); setScreenshotViewMode('list'); }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        screenshotViewMode === 'list'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => { sounds.playClick(); setShowScreenshotSortMenu(!showScreenshotSortMenu); }}
                      className="px-3.5 py-2.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] border border-[#233374] text-xs text-white font-medium flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>{sortLabels[screenshotSort]}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {showScreenshotSortMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowScreenshotSortMenu(false)} />
                        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#0e1329] border border-[#233374] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                          {['newest', 'oldest', 'name', 'size'].map((sOpt) => (
                            <button
                              key={sOpt}
                              onClick={() => {
                                sounds.playClick();
                                setScreenshotSort(sOpt as any);
                                setShowScreenshotSortMenu(false);
                              }}
                              className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between cursor-pointer ${
                                screenshotSort === sOpt ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <span>{sortLabels[sOpt]}</span>
                              {screenshotSort === sOpt && <Check className="w-3.5 h-3.5 text-blue-400" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk Selection Action Bar */}
              {selectedScreenshotIds.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 shadow-lg shadow-blue-950/50 animate-in fade-in duration-150 shrink-0">
                  <span className="text-xs font-semibold text-blue-200">
                    {selectedScreenshotIds.length} screenshot{selectedScreenshotIds.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkDeleteScreenshots}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Delete Selected
                    </button>
                    <button
                      onClick={() => setSelectedScreenshotIds([])}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Screenshots Content Display */}
              {filtered.length === 0 ? (
                <div className="w-full flex-1 min-h-[420px] rounded-2xl border border-dashed border-[#233374] p-12 flex flex-col items-center justify-center text-center space-y-4 bg-[#0a0f2e]/60 backdrop-blur-xl shadow-xl">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <div className="text-base font-bold text-white">No Screenshots in this Instance</div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Press <span className="font-mono text-cyan-300 font-bold bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">F2</span> while playing Minecraft to capture screenshots. They will automatically appear here!
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleTakeScreenshot}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Take / Import Screenshot</span>
                    </button>
                    <button
                      onClick={() => onOpenFolder(instance, 'screenshots')}
                      className="px-4 py-2.5 rounded-xl bg-[#0f1638] hover:bg-[#182356] border border-[#233374] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-cyan-400" />
                      <span>Open Folder</span>
                    </button>
                  </div>
                </div>
              ) : screenshotViewMode === 'grid' ? (
                /* 3-Column Grid matching Target Mockup */
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((item, idx) => {
                    const isSelected = selectedScreenshotIds.includes(item.id);
                    const previewSrc = item.previewUrl || `galaxy-file://image?path=${encodeURIComponent(item.filePath)}`;
                    const displayName = getScreenshotDisplayName(item.filename);
                    const isMenuOpen = activeScreenshotMenuId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`relative rounded-2xl border bg-[#0b102b]/95 backdrop-blur-md overflow-hidden shadow-xl group transition-all flex flex-col ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-[0_0_22px_rgba(37,99,235,0.4)]'
                            : 'border-[#1e2d6b] hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(37,99,235,0.25)]'
                        }`}
                      >
                        {/* Top: 16:9 Image Area */}
                        <div
                          className="relative aspect-video w-full overflow-hidden bg-black/60 cursor-pointer"
                          onClick={() => setActiveLightboxIndex(idx)}
                        >
                          <img
                            src={previewSrc}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = '0';
                            }}
                          />

                          {/* Top-Left Selection Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => toggleSelectScreenshot(item.id, e)}
                            className={`absolute top-3 left-3 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer z-10 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                                : 'border-white/30 bg-black/40 backdrop-blur-md text-transparent hover:border-white hover:bg-black/60'
                            }`}
                            title={isSelected ? 'Deselect' : 'Select'}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          {/* Top-Right 3-Dots Options Menu */}
                          <div className="absolute top-3 right-3 z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playClick();
                                setActiveScreenshotMenuId(isMenuOpen ? null : item.id);
                              }}
                              className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-black/70 hover:border-white/50 transition-all cursor-pointer shadow-md"
                              title="Options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveScreenshotMenuId(null); }} />
                                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#0e1329] border border-[#233374] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveScreenshotMenuId(null);
                                      handleCopyScreenshot(item, e);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                                    <span>Copy Image</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveScreenshotMenuId(null);
                                      window.galaxy?.openScreenshotFolder?.(item.filePath);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                                  >
                                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>Show in Explorer</span>
                                  </button>
                                  <div className="my-1 border-t border-white/10" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveScreenshotMenuId(null);
                                      setScreenshotToDelete(item);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Title, Action Buttons & Meta Info */}
                        <div className="p-4 bg-[#090d24]/95 border-t border-[#182352] flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div
                              onClick={() => setActiveLightboxIndex(idx)}
                              className="text-xs sm:text-sm font-bold text-white truncate hover:text-blue-300 transition-colors cursor-pointer"
                              title={item.filename}
                            >
                              {displayName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-1 truncate">
                              <span>{formatScreenshotDate(item.createdAt, item.filename)}</span>
                              <span className="text-slate-600 font-bold">•</span>
                              <span>1920 × 1080</span>
                              <span className="text-slate-600 font-bold">•</span>
                              <span>{formatBytes(item.sizeBytes)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => setActiveLightboxIndex(idx)}
                              className="p-2 rounded-xl bg-[#101738] hover:bg-blue-600/30 border border-[#233374] hover:border-blue-400/50 text-blue-400 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
                              title="Preview Screenshot"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.galaxy?.openScreenshotFolder?.(item.filePath)}
                              className="p-2 rounded-xl bg-[#101738] hover:bg-[#182356] border border-[#233374] hover:border-blue-400/50 text-blue-400 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
                              title="Show in Folder"
                            >
                              <Folder className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setScreenshotToDelete(item)}
                              className="p-2 rounded-xl bg-[#101738] hover:bg-rose-500/20 border border-[#233374] hover:border-rose-500/50 text-rose-400 hover:text-rose-200 transition-all active:scale-95 cursor-pointer shadow-sm"
                              title="Delete Screenshot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-2">
                  {filtered.map((item, idx) => {
                    const isSelected = selectedScreenshotIds.includes(item.id);
                    const previewSrc = item.previewUrl || `galaxy-file://image?path=${encodeURIComponent(item.filePath)}`;
                    const displayName = getScreenshotDisplayName(item.filename);

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border bg-[#0b102b]/95 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-950/40 shadow-sm'
                            : 'border-[#1e2d6b] hover:border-blue-500/40 hover:bg-[#131b40]/80'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => toggleSelectScreenshot(item.id, e)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                                : 'border-white/30 bg-black/40 text-transparent hover:border-white'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <div
                            className="w-18 h-12 rounded-xl overflow-hidden bg-black/60 shrink-0 cursor-pointer"
                            onClick={() => setActiveLightboxIndex(idx)}
                          >
                            <img
                              src={previewSrc}
                              alt=""
                              className="w-full h-full object-cover select-none"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = '0';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div
                              onClick={() => setActiveLightboxIndex(idx)}
                              className="text-xs sm:text-sm font-bold text-white truncate hover:text-blue-300 cursor-pointer"
                            >
                              {displayName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                              <span>{formatScreenshotDate(item.createdAt, item.filename)}</span>
                              <span className="text-slate-600 font-bold">•</span>
                              <span>1920 × 1080</span>
                              <span className="text-slate-600 font-bold">•</span>
                              <span>{formatBytes(item.sizeBytes)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setActiveLightboxIndex(idx)}
                            className="p-2 rounded-xl bg-[#101738] hover:bg-blue-600/30 border border-[#233374] hover:border-blue-400/50 text-blue-400 hover:text-white transition-all cursor-pointer"
                            title="Preview Screenshot"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.galaxy?.openScreenshotFolder?.(item.filePath)}
                            className="p-2 rounded-xl bg-[#101738] hover:bg-[#182356] border border-[#233374] hover:border-blue-400/50 text-blue-400 hover:text-white transition-all cursor-pointer"
                            title="Show in Folder"
                          >
                            <Folder className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setScreenshotToDelete(item)}
                            className="p-2 rounded-xl bg-[#101738] hover:bg-rose-500/20 border border-[#233374] hover:border-rose-500/50 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
                            title="Delete Screenshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ----------------------------------------------------------------------- */}
        {/* SETTINGS TAB (High-Density Non-Scrolling Design with Authentic Java Logo) */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'settings' && (() => {
          const isCard1Active = openDropdown === 'icon';
          const isCard2Active = openDropdown === 'version' || openDropdown === 'loader';
          const isCard3Active = openDropdown === 'preset';
          const isCard4Active = openDropdown === 'resolution';
          const isCard5Active = openDropdown === 'java';
          const isCard6Active = openDropdown === 'retention';

          return (
            <div className="relative w-full flex-1 min-h-0 flex flex-col justify-between gap-2.5 sm:gap-3 pb-1 animate-in fade-in duration-200">
              {/* ROW 1: INSTANCE IDENTITY & MINECRAFT CONFIGURATION */}
              <div className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-3.5 relative items-stretch ${openDropdown && (isCard1Active || isCard2Active) ? 'z-40' : 'z-20'}`}>
                {/* 1. INSTANCE IDENTITY */}
                <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#0e1122]/90 backdrop-blur-xl border border-white/[0.07] shadow-lg flex flex-col justify-between relative ${isCard1Active ? 'z-50' : 'z-10'}`}>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Instance Identity</h3>
                      <p className="text-[11px] text-slate-400 leading-tight">Customize your instance name, icon and appearance.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end my-auto pt-1">
                    {/* Instance Name */}
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Instance Name</label>
                      <input
                        type="text"
                        value={instName}
                        onChange={(e) => setInstName(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl bg-[#090b16] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-blue-500 transition-colors font-medium"
                        placeholder="Instance Name"
                      />
                    </div>

                    {/* Instance Icon */}
                    <div className="sm:col-span-3" data-dropdown-container="true">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Instance Icon</label>
                      <div className="flex items-center space-x-1.5 relative">
                        <div
                          onClick={() => { sounds.playClick(); setOpenDropdown(openDropdown === 'icon' ? null : 'icon'); }}
                          className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/20 shadow-md bg-black/40 shrink-0 cursor-pointer group hover:border-cyan-400 transition-colors"
                          title="Click to change artwork"
                        >
                          <img
                            src={chosenArtwork || resolveInstanceArtwork(instance)}
                            alt={instName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setOpenDropdown(openDropdown === 'icon' ? null : 'icon');
                          }}
                          className="h-9 px-2 rounded-xl bg-[#090b16] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-[11px] font-medium text-slate-200 flex items-center space-x-1 transition-all shrink-0 cursor-pointer"
                        >
                          <Palette className="w-3 h-3 text-slate-300" />
                          <span>Icon</span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openDropdown === 'icon' ? 'rotate-180 text-cyan-400' : ''}`} />
                        </button>

                        {/* High-End Diorama Artwork Selector Popup */}
                        {openDropdown === 'icon' && (
                          <div data-dropdown-container="true" className="absolute left-0 top-full mt-1.5 z-50 w-80 p-3 rounded-2xl bg-[#0b0f24] border border-white/[0.15] shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/[0.08]">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Choose Instance Artwork</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">Diorama Icons</span>
                            </div>

                            {/* Preset 3D Diorama Icons Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-2.5">
                              {PRESET_ARTWORKS.map((art) => {
                                const currentArtSrc = chosenArtwork || resolveInstanceArtwork(instance);
                                const isCurrent = currentArtSrc === art.src || currentArtSrc === art.id || chosenArtworkId === art.id || instance.iconBackground === art.id;
                                return (
                                  <button
                                    key={art.id}
                                    type="button"
                                    onClick={async () => {
                                      sounds.playSuccess();
                                      setOpenDropdown(null);
                                      setChosenArtwork(art.src);
                                      setChosenArtworkId(art.id);
                                      const updated = {
                                        ...instance,
                                        icon: art.src,
                                        banner: art.src,
                                        iconBackground: art.id
                                      };
                                      await onUpdateInstance(updated);
                                      onShowToast({
                                        id: Math.random().toString(),
                                        type: 'success',
                                        title: 'Instance Icon Updated',
                                        message: `Applied "${art.name}" as instance artwork.`
                                      });
                                    }}
                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group cursor-pointer ${
                                      isCurrent
                                        ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.5)] scale-105'
                                        : 'border-white/10 hover:border-white/40 hover:scale-105'
                                    }`}
                                    title={art.name}
                                  >
                                    <img src={art.src} alt={art.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                                      <span className="text-[8px] text-white font-medium truncate leading-none">{art.name}</span>
                                    </div>
                                    {isCurrent && (
                                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 flex items-center justify-center shadow-md">
                                        <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-1 pt-1 border-t border-white/[0.08]">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  setOpenDropdown(null);
                                  setShowIconEditor(true);
                                }}
                                className="w-full py-1.5 px-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-all cursor-pointer"
                              >
                                <div className="flex items-center space-x-2">
                                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Open 3D Voxel Icon Studio</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  setOpenDropdown(null);
                                  if (window.galaxy?.selectMultipleFiles) {
                                    const files = await window.galaxy.selectMultipleFiles([
                                      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
                                    ]);
                                    if (files && files[0]) {
                                      sounds.playSuccess();
                                      const normalized = files[0];
                                      setChosenArtwork(normalized);
                                      setChosenArtworkId(normalized);
                                      const updated = { ...instance, icon: normalized, banner: normalized, iconBackground: normalized };
                                      await onUpdateInstance(updated);
                                      onShowToast({
                                        id: Math.random().toString(),
                                        type: 'success',
                                        title: 'Custom Icon Uploaded',
                                        message: 'Applied your custom image as instance icon.'
                                      });
                                    }
                                  }
                                }}
                                className="w-full py-1.5 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white flex items-center space-x-2 transition-all cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5 text-blue-400" />
                                <span>Upload Custom Image from PC...</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Theme Accent */}
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Theme Accent</label>
                      <div className="flex items-center space-x-2 h-9">
                        {THEME_ACCENT_OPTIONS.map((theme) => {
                          const isSelected = themeAccent === theme.id || themeAccent === theme.hex;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => { sounds.playClick(); setThemeAccent(theme.id); }}
                              className={`w-4.5 h-4.5 rounded-full transition-all cursor-pointer ${theme.bgClass} ${
                                isSelected
                                  ? `ring-2 ${theme.ringClass} ring-offset-2 ring-offset-[#0d1021] ${theme.shadowClass} scale-110`
                                  : 'opacity-70 hover:opacity-100 hover:scale-105'
                              }`}
                              title={`Theme: ${theme.id}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. MINECRAFT CONFIGURATION */}
                <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#0e1122]/90 backdrop-blur-xl border border-white/[0.07] shadow-lg flex flex-col justify-between relative ${isCard2Active ? 'z-50' : 'z-10'}`}>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Box className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Minecraft Configuration</h3>
                      <p className="text-[11px] text-slate-400 leading-tight">Select the Minecraft version and loader for this instance.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-auto pt-1">
                    {/* Minecraft Version */}
                    <div data-dropdown-container="true">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Minecraft Version</label>
                      <div className="relative" data-dropdown-container="true">
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setOpenDropdown(openDropdown === 'version' ? null : 'version'); }}
                          className="w-full h-9 px-3 rounded-xl bg-[#090b16] border border-white/[0.08] hover:border-white/[0.15] text-xs text-white flex items-center justify-between transition-all cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <GrassBlockIcon className="w-4 h-4" />
                            <span className="font-semibold text-slate-100">{mcVersion}</span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdown === 'version' ? 'rotate-180 text-blue-400' : ''}`} />
                        </button>

                        {openDropdown === 'version' && (
                          <div data-dropdown-container="true" className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl bg-[#0b0f24] border border-white/[0.15] shadow-[0_16px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl overflow-hidden flex flex-col max-h-64">
                            {/* Search bar inside version dropdown */}
                            <div className="p-2 border-b border-white/[0.08] bg-black/20 shrink-0">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  value={versionSearchTerm}
                                  onChange={(e) => setVersionSearchTerm(e.target.value)}
                                  placeholder="Search version (e.g. 1.20)..."
                                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#070a18] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            <div className="py-1 overflow-y-auto max-h-52">
                              {displayVersions.length === 0 ? (
                                <div className="px-3 py-2.5 text-center text-xs text-slate-400">
                                  No versions found matching "{versionSearchTerm}"
                                </div>
                              ) : (
                                displayVersions.map((ver) => (
                                  <button
                                    key={ver}
                                    type="button"
                                    onClick={() => handleSelectVersion(ver)}
                                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-white/[0.08] transition-colors cursor-pointer ${
                                      mcVersion === ver ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                                    }`}
                                  >
                                    <span className="flex items-center space-x-2 truncate">
                                      <GrassBlockIcon className="w-3.5 h-3.5" />
                                      <span className="truncate">{ver}</span>
                                    </span>
                                    {mcVersion === ver && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Loader */}
                    <div data-dropdown-container="true">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Loader</label>
                      <div className="relative" data-dropdown-container="true">
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setOpenDropdown(openDropdown === 'loader' ? null : 'loader'); }}
                          className="w-full h-9 px-3 rounded-xl bg-[#090b16] border border-white/[0.08] hover:border-white/[0.15] text-xs text-white flex items-center justify-between transition-all capitalize cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Scroll className="w-3.5 h-3.5 text-amber-200/90" />
                            <span className="font-semibold text-slate-100">{loader}</span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${openDropdown === 'loader' ? 'rotate-180 text-blue-400' : ''}`} />
                        </button>

                        {openDropdown === 'loader' && (
                          <div data-dropdown-container="true" className="absolute top-full left-0 right-0 mt-1.5 z-50 py-1.5 rounded-xl bg-[#0b0f24] border border-white/[0.15] shadow-[0_16px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                            {[
                              { id: 'fabric', label: 'Fabric' },
                              { id: 'forge', label: 'Forge' },
                              { id: 'neoforge', label: 'NeoForge' },
                              { id: 'quilt', label: 'Quilt' },
                              { id: 'vanilla', label: 'Vanilla' }
                            ].map((ld) => (
                              <button
                                key={ld.id}
                                type="button"
                                onClick={() => handleSelectLoader(ld.id as any)}
                                className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-white/[0.08] transition-colors cursor-pointer ${
                                  loader === ld.id ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                                }`}
                              >
                                <span className="flex items-center space-x-2">
                                  <Scroll className="w-3.5 h-3.5 text-amber-300" />
                                  <span>{ld.label}</span>
                                </span>
                                {loader === ld.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 2: MEMORY & PERFORMANCE & DISPLAY SETTINGS */}
              <div className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-3.5 relative items-stretch ${openDropdown && (isCard3Active || isCard4Active) ? 'z-30' : 'z-10'}`}>
                {/* 3. MEMORY & PERFORMANCE */}
                <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#0e1122]/90 backdrop-blur-xl border border-white/[0.07] shadow-lg flex flex-col justify-between relative ${isCard3Active ? 'z-50' : 'z-10'}`}>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Memory &amp; Performance</h3>
                      <p className="text-[11px] text-slate-400 leading-tight">Allocate memory and configure performance settings.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-auto pt-1">
                    {/* RAM Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-300 text-[11px]">RAM Allocation</span>
                        <span className="font-bold text-cyan-400 text-xs">
                          {Math.round(memoryMax / 1024)} GB
                        </span>
                      </div>
                      <div className="relative py-1">
                        <input
                          type="range"
                          min="1024"
                          max="16384"
                          step="512"
                          value={memoryMax}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setMemoryMax(val);
                            setJvmArgs((prev) => prev.replace(/-Xmx\d+G/i, `-Xmx${Math.round(val / 1024)}G`));
                          }}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none accent-cyan-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_#38bdf8] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-sky-400"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #38bdf8 ${Math.min(100, Math.max(0, ((memoryMax - 1024) / (16384 - 1024)) * 100))}%, #1e293b ${Math.min(100, Math.max(0, ((memoryMax - 1024) / (16384 - 1024)) * 100))}%, #1e293b 100%)`
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>1 GB</span>
                        <span>16 GB</span>
                      </div>
                    </div>

                    {/* Performance Preset */}
                    <div data-dropdown-container="true">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Performance Preset</label>
                      <div className="relative" data-dropdown-container="true">
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setOpenDropdown(openDropdown === 'preset' ? null : 'preset'); }}
                          className="w-full h-9 px-3 rounded-xl bg-[#090b16] border border-white/[0.08] hover:border-white/[0.15] text-xs text-white flex items-center justify-between transition-all cursor-pointer"
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="font-medium text-slate-100 truncate text-[11px]">
                              {perfPreset === 'balanced' && 'Balanced (Recommended)'}
                              {perfPreset === 'high' && 'High Performance'}
                              {perfPreset === 'extreme' && 'Extreme (12GB+)'}
                              {perfPreset === 'potato' && 'Low End / Potato (2GB)'}
                            </span>
                          </div>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${openDropdown === 'preset' ? 'rotate-180 text-blue-400' : ''}`} />
                        </button>

                        {openDropdown === 'preset' && (
                          <div data-dropdown-container="true" className="absolute top-full left-0 right-0 mt-1.5 z-50 py-1.5 rounded-xl bg-[#0b0f24] border border-white/[0.15] shadow-[0_16px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                            {[
                              { id: 'extreme', label: 'Extreme (12GB+)', desc: '12GB heavy allocation for high-end PCs' },
                              { id: 'high', label: 'High Performance', desc: '8GB allocation for modpacks and shaders' },
                              { id: 'balanced', label: 'Balanced (Recommended)', desc: 'Stable 4GB setup for smooth gameplay' },
                              { id: 'potato', label: 'Low End / Potato (2GB)', desc: '2GB lightweight optimization' }
                            ].map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  applyPerfPreset(p.id as any);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-white/[0.08] transition-colors cursor-pointer ${
                                  perfPreset === p.id ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <span>{p.label}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                                </div>
                                {perfPreset === p.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight truncate">
                        {perfPreset === 'extreme' && '12GB heavy allocation for high-end PCs & shaders.'}
                        {perfPreset === 'high' && '8GB allocation for modpacks & shaders.'}
                        {perfPreset === 'balanced' && 'A balanced setup for stable performance and smooth gameplay.'}
                        {perfPreset === 'potato' && '2GB lightweight optimization for low-end PCs.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. DISPLAY SETTINGS */}
                <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#0e1122]/90 backdrop-blur-xl border border-white/[0.07] shadow-lg flex flex-col justify-between relative ${isCard4Active ? 'z-50' : 'z-10'}`}>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Monitor className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Display Settings</h3>
                      <p className="text-[11px] text-slate-400 leading-tight">Configure game window and display options.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-auto pt-1">
                    {/* Default Resolution */}
                    <div data-dropdown-container="true">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Default Resolution</label>
                      <div className="relative" data-dropdown-container="true">
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setOpenDropdown(openDropdown === 'resolution' ? null : 'resolution'); }}
                          className="w-full h-9 px-3 rounded-xl bg-[#090b16] border border-white/[0.08] hover:border-white/[0.15] text-xs text-white flex items-center justify-between transition-all cursor-pointer"
                        >
                          <span className="font-medium text-slate-100 truncate text-[11px]">{resPreset}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${openDropdown === 'resolution' ? 'rotate-180 text-blue-400' : ''}`} />
                        </button>

                        {openDropdown === 'resolution' && (
                          <div data-dropdown-container="true" className="absolute top-full left-0 right-0 mt-1.5 z-50 py-1.5 rounded-xl bg-[#0b0f24] border border-white/[0.15] shadow-[0_16px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                            {RESOLUTION_OPTIONS.map((res) => (
                              <button
                                key={res.label}
                                type="button"
                                onClick={() => {
                                  applyResPreset(res.label, res.w, res.h);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-white/[0.08] transition-colors cursor-pointer ${
                                  resPreset === res.label ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                                }`}
                              >
                                <span>{res.label}</span>
                                {resPreset === res.label && <Check className="w-3.5 h-3.5 text-blue-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                        This will be used when launching the game.
                      </p>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-1.5">
                      {/* Fullscreen (Default ON) */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-300">Fullscreen</span>
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setFullscreen(!fullscreen); }}
                          className={`w-8 h-4.5 rounded-full transition-colors duration-300 relative p-0.5 focus:outline-none shrink-0 cursor-pointer ${
                            fullscreen ? 'bg-emerald-500' : 'bg-slate-700/80'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                              fullscreen ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* VSync (Default OFF) */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-300">VSync</span>
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setVsync(!vsync); }}
                          className={`w-8 h-4.5 rounded-full transition-colors duration-300 relative p-0.5 focus:outline-none shrink-0 cursor-pointer ${
                            vsync ? 'bg-emerald-500' : 'bg-slate-700/80'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                              vsync ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Show Launcher (Default ON) */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span className="text-[11px] font-medium text-slate-300">Show Launcher</span>
                          <div className="relative group cursor-help">
                            <Info className="w-3 h-3 text-slate-400 hover:text-slate-200 transition-colors" />
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block z-50 bg-black/90 text-white text-[10px] px-2 py-0.5 rounded border border-white/10 whitespace-nowrap shadow-xl">
                              Keep launcher open while game is running
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setShowLauncher(!showLauncher); }}
                          className={`w-8 h-4.5 rounded-full transition-colors duration-300 relative p-0.5 focus:outline-none shrink-0 cursor-pointer ${
                            showLauncher ? 'bg-emerald-500' : 'bg-slate-700/80'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                              showLauncher ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: JAVA RUNTIME & LAUNCH OPTIONS / BACKUP */}
              <div className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-3.5 relative items-stretch ${openDropdown && (isCard5Active || isCard6Active) ? 'z-30' : 'z-10'}`}>
                {/* 5. JAVA RUNTIME (With Authentic Java Logo & Live Auto-Download) */}
                <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#0e1122]/90 backdrop-blur-xl border border-white/[0.07] shadow-lg flex flex-col justify-between relative ${isCard5Active ? 'z-50' : 'z-10'}`}>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Coffee className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Java Runtime</h3>
                      <p className="text-[11px] text-slate-400 leading-tight">Manage the Java version used to launch this instance.</p>
                    </div>
                  </div>

                  <div className="bg-[#090b16] border border-white/[0.08] hover:border-white/[0.12] rounded-xl p-2.5 sm:p-3 flex items-center justify-between transition-all my-auto">
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Authentic Java Logo Container matching target image */}
                      <div className="w-10 h-10 rounded-xl bg-[#0b1029] border border-[#1e2d6b] flex items-center justify-center shrink-0 shadow-inner">
                        <JavaLogoSVG className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white truncate">
                            Java {activeJavaInfo.version || `${recommendedJavaMajor}.0.0`} ({activeJavaInfo.arch || '64-bit'})
                          </span>
                          {activeJavaInfo.isDetected ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Detected
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Auto-Install
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5 max-w-[260px]" title={activeJavaInfo.path}>
                          {activeJavaInfo.path}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3 relative" data-dropdown-container="true">
                      {activeJavaInfo.needsDownload && !downloadingJava ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadJava(recommendedJavaMajor)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Install Java {recommendedJavaMajor}</span>
                        </button>
                      ) : downloadingJava ? (
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-xs text-blue-300">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="font-mono text-xs">{javaDownloadProgress?.percent || 0}%</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleChangeJava}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span>Change Java</span>
                        </button>
                      )}

                      {openDropdown === 'java' && (
                        <div data-dropdown-container="true" className="absolute right-0 bottom-full mb-1.5 z-50 py-1.5 w-84 rounded-xl bg-[#0b0f24] border border-white/[0.15] shadow-[0_16px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl max-h-64 overflow-y-auto">
                          {localDetectedJava.length === 0 ? (
                            <div className="px-3.5 py-2.5 text-xs text-slate-400 text-center">
                              No Java runtimes found on system.
                            </div>
                          ) : (
                            localDetectedJava.map((j) => (
                              <button
                                key={j.path}
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  setJavaPath(j.path);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-white/[0.08] transition-colors cursor-pointer ${
                                  (javaPath === j.path || (!javaPath && activeJavaInfo.path === j.path)) ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-semibold text-white">Java {j.version}</span>
                                    <span className="text-[10px] text-slate-400">({j.vendor})</span>
                                    {j.majorVersion === recommendedJavaMajor && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">Recommended</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">{j.path}</p>
                                </div>
                                {(javaPath === j.path || (!javaPath && activeJavaInfo.path === j.path)) && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                              </button>
                            ))
                          )}
                          <div className="border-t border-white/[0.08] my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(null);
                              handleDownloadJava(recommendedJavaMajor);
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-cyan-300 hover:bg-white/[0.08] flex items-center space-x-2 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Download &amp; Install Java {recommendedJavaMajor} LTS (Adoptium)</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              setOpenDropdown(null);
                              if (window.galaxy?.selectMultipleFiles) {
                                const files = await window.galaxy.selectMultipleFiles([{ name: 'Java Executable', extensions: ['exe', ''] }]);
                                if (files && files[0]) setJavaPath(files[0]);
                              }
                            }}
                            className="w-full px-3 py-1.5 text-left text-xs text-blue-400 hover:bg-white/[0.08] flex items-center space-x-2 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Browse for java.exe on PC...</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. LAUNCH OPTIONS & BACKUP RECOVERY (Integrated Compact Card) */}
                <div className={`p-3.5 sm:p-4 rounded-2xl bg-[#0e1122]/90 backdrop-blur-xl border border-white/[0.07] shadow-lg flex flex-col justify-between relative ${isCard6Active ? 'z-50' : 'z-10'}`}>
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Terminal className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">Launch &amp; Backup</h3>
                      <p className="text-[11px] text-slate-400 leading-tight">JVM arguments, memory options &amp; automatic backup.</p>
                    </div>
                  </div>

                  {/* Controls Container */}
                  <div className="space-y-2 my-auto pt-1">
                    {/* Top: JVM Args */}
                    <div className="relative">
                      <div className="bg-[#090b16] border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-1.5 px-3 flex items-center justify-between transition-all">
                        <input
                          type="text"
                          value={jvmArgs}
                          onChange={(e) => setJvmArgs(e.target.value)}
                          className="w-full bg-transparent font-mono text-[11px] text-slate-200 focus:outline-none pr-2"
                          placeholder="-Xmx4G -XX:+UseG1GC -XX:+ParallelRefProcEnabled"
                        />
                        <button
                          type="button"
                          onClick={() => setShowJvmExpanded(!showJvmExpanded)}
                          className="text-slate-400 hover:text-white p-1 transition-colors shrink-0 cursor-pointer"
                          title={showJvmExpanded ? "Collapse" : "Expand JVM Options"}
                        >
                          {showJvmExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {showJvmExpanded && (
                        <div className="mt-1.5 p-2 bg-[#090b16] border border-white/[0.1] rounded-xl">
                          <textarea
                            rows={2}
                            value={jvmArgs}
                            onChange={(e) => setJvmArgs(e.target.value)}
                            className="w-full bg-black/40 border border-white/[0.08] rounded-lg p-1.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                            placeholder="-Xmx4G -XX:+UseG1GC -XX:+ParallelRefProcEnabled"
                          />
                        </div>
                      )}
                    </div>

                    {/* Bottom: Auto Backup & Retention & View Backups */}
                    <div className="flex items-center justify-between pt-1 gap-2 border-t border-white/[0.06]">
                      {/* Auto Backup switch */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setAutoBackup(!autoBackup); }}
                          className={`w-8 h-4.5 rounded-full transition-colors duration-300 relative p-0.5 focus:outline-none shrink-0 cursor-pointer ${
                            autoBackup ? 'bg-emerald-500' : 'bg-slate-700/80'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                              autoBackup ? 'translate-x-3.5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] font-medium text-slate-300">Auto Backup</span>
                      </div>

                      {/* Retention Dropdown */}
                      <div className="relative" data-dropdown-container="true">
                        <button
                          type="button"
                          onClick={() => { sounds.playClick(); setOpenDropdown(openDropdown === 'retention' ? null : 'retention'); }}
                          className="px-2.5 py-1 rounded-xl bg-[#090b16] border border-white/[0.08] hover:border-white/[0.15] text-[11px] text-white font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <span className="truncate max-w-[100px]">{backupRetention}</span>
                          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${openDropdown === 'retention' ? 'rotate-180 text-blue-400' : ''}`} />
                        </button>

                        {openDropdown === 'retention' && (
                          <div data-dropdown-container="true" className="absolute bottom-full right-0 mb-1.5 z-50 py-1 w-44 rounded-xl bg-[#0b0f24] border border-white/[0.15] shadow-[0_16px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
                            {['Keep 1 backup', 'Keep 3 backups', 'Keep 5 backups', 'Keep 10 backups', 'Keep unlimited'].map((ret) => (
                              <button
                                key={ret}
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  setBackupRetention(ret);
                                  setOpenDropdown(null);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-white/[0.08] transition-colors cursor-pointer ${
                                  backupRetention === ret ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-300'
                                }`}
                              >
                                <span>{ret}</span>
                                {backupRetention === ret && <Check className="w-3.5 h-3.5 text-blue-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* View Backups Button */}
                      <button
                        type="button"
                        onClick={() => { sounds.playClick(); setActiveTab('worlds'); }}
                        className="px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] font-semibold text-slate-200 flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
                      >
                        <FolderOpen className="w-3 h-3 text-blue-400" />
                        <span>Backups</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM ACTION BAR */}
              <div className="flex items-center justify-between pt-1 relative z-10 shrink-0">
                {/* Left: Restore Defaults */}
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="px-4 py-2.5 rounded-xl border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-semibold text-xs flex items-center space-x-2 transition-all shadow-sm group cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
                  <span>Restore Defaults</span>
                </button>

                {/* Right: Discard Changes & Save Changes */}
                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={handleDiscardChanges}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white font-medium text-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                    <span>Discard Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center space-x-2 shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:shadow-[0_0_26px_rgba(59,130,246,0.8)] transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING BULK ACTIONS BAR (When 1 or more items are selected) */}
      {/* ========================================================================= */}
      {selectedFilenames.length > 0 && activeTab === 'content' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-galaxy-900/95 border border-white/[0.15] backdrop-blur-2xl px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[11px] font-extrabold">
              {selectedFilenames.length}
            </span>
            <span>selected</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {contentCategory === 'mods' && (
            <>
              <button
                onClick={handleBulkEnable}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enable</span>
              </button>

              <button
                onClick={handleBulkDisable}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Disable</span>
              </button>
            </>
          )}

          <button
            onClick={() => setBulkDeleteTarget(selectedFilenames)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            onClick={() => setSelectedFilenames([])}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & OVERLAYS */}
      {/* ========================================================================= */}

      {/* 3D Voxel Icon Studio Modal */}
      <IconEditorModal
        isOpen={showIconEditor}
        initialIcon={instance.icon || 'backpack'}
        initialBackground={instance.iconBackground || 'blue'}
        onSave={async (icon, bg) => {
          const updated = {
            ...instance,
            icon,
            iconBackground: bg
          };
          await onUpdateInstance(updated);
          onShowToast({
            id: Math.random().toString(),
            type: 'success',
            title: 'Icon Updated',
            message: 'Custom 3D voxel icon applied to instance.'
          });
        }}
        onClose={() => setShowIconEditor(false)}
      />

      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(bulkDeleteTarget)}
        title="Delete Selected Items"
        subtitle={`Permanently remove ${bulkDeleteTarget?.length} items`}
        type="danger"
        confirmText="Delete Selected"
        cancelText="Cancel"
        icon={<Trash2 className="w-4 h-4 text-rose-300" />}
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to permanently delete <span className="font-bold text-white">{bulkDeleteTarget?.length}</span> selected items from this instance?
            </p>
          </div>
        }
        onConfirm={handleBulkDeleteConfirm}
        onClose={() => setBulkDeleteTarget(null)}
      />

      {/* Delete Mod Modal */}
      <ConfirmModal
        isOpen={Boolean(modToDelete)}
        title="Remove Mod"
        subtitle={modToDelete?.name}
        type="danger"
        confirmText="Remove Mod"
        cancelText="Cancel"
        icon={<Trash2 className="w-4 h-4 text-rose-300" />}
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to remove <span className="font-bold text-white">"{modToDelete?.name}"</span> from this instance?
            </p>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] text-[11px] font-mono text-emerald-300 truncate">
              {modToDelete?.filename}
            </div>
          </div>
        }
        onConfirm={async () => {
          if (!modToDelete) return;
          const target = modToDelete;
          setModToDelete(null);
          try {
            await window.galaxy.deleteMod(instance.id, target.filename);
            await loadInstanceData();
            sounds.playSuccess();
            onShowToast({
              id: Math.random().toString(),
              type: 'success',
              title: `Deleted ${target.name}`
            });
          } catch (err) {
            console.error('Failed to delete mod:', err);
          }
        }}
        onClose={() => setModToDelete(null)}
      />

      {/* Delete Resource Pack Modal */}
      <ConfirmModal
        isOpen={Boolean(resourcePackToDelete)}
        title="Remove Resource Pack"
        subtitle={resourcePackToDelete?.name}
        type="danger"
        confirmText="Remove Resource Pack"
        cancelText="Cancel"
        icon={<Trash2 className="w-4 h-4 text-rose-300" />}
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to remove <span className="font-bold text-white">"{resourcePackToDelete?.name}"</span> from this instance?
            </p>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] text-[11px] font-mono text-purple-300 truncate">
              {resourcePackToDelete?.filename}
            </div>
          </div>
        }
        onConfirm={async () => {
          if (!resourcePackToDelete) return;
          const target = resourcePackToDelete;
          setResourcePackToDelete(null);
          try {
            await window.galaxy.deleteResourcePack(instance.id, target.filename);
            await loadInstanceData();
            sounds.playSuccess();
            onShowToast({
              id: Math.random().toString(),
              type: 'success',
              title: `Deleted ${target.name}`
            });
          } catch (err) {
            console.error('Failed to delete resource pack:', err);
          }
        }}
        onClose={() => setResourcePackToDelete(null)}
      />

      {/* Delete Shader Pack Modal */}
      <ConfirmModal
        isOpen={Boolean(shaderPackToDelete)}
        title="Remove Shader"
        subtitle={shaderPackToDelete?.name}
        type="danger"
        confirmText="Remove Shader"
        cancelText="Cancel"
        icon={<Trash2 className="w-4 h-4 text-rose-300" />}
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to remove <span className="font-bold text-white">"{shaderPackToDelete?.name}"</span> from this instance?
            </p>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] text-[11px] font-mono text-cyan-300 truncate">
              {shaderPackToDelete?.filename}
            </div>
          </div>
        }
        onConfirm={async () => {
          if (!shaderPackToDelete) return;
          const target = shaderPackToDelete;
          setShaderPackToDelete(null);
          try {
            await window.galaxy.deleteShaderPack(instance.id, target.filename);
            await loadInstanceData();
            sounds.playSuccess();
            onShowToast({
              id: Math.random().toString(),
              type: 'success',
              title: `Deleted ${target.name}`
            });
          } catch (err) {
            console.error('Failed to delete shader pack:', err);
          }
        }}
        onClose={() => setShaderPackToDelete(null)}
      />

      {/* Delete World Backup Modal */}
      <ConfirmModal
        isOpen={Boolean(backupToDelete)}
        title="Delete World Backup"
        subtitle={backupToDelete?.worldName}
        type="danger"
        confirmText="Delete Backup"
        cancelText="Cancel"
        icon={<Trash2 className="w-4 h-4 text-rose-300" />}
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to delete the backup for world <span className="font-bold text-white">"{backupToDelete?.worldName}"</span>?
            </p>
          </div>
        }
        onConfirm={async () => {
          if (!backupToDelete) return;
          const target = backupToDelete;
          setBackupToDelete(null);
          try {
            await window.galaxy.deleteWorldBackup(instance.id, target.filename);
            setBackups((prev) => prev.filter((b) => b.filename !== target.filename));
            onShowToast({
              id: Math.random().toString(),
              type: 'info',
              title: 'Backup Deleted'
            });
          } catch (err) {
            sounds.playError();
          }
        }}
        onClose={() => setBackupToDelete(null)}
      />

      {/* Delete Instance Modal */}
      <ConfirmModal
        isOpen={showDeleteInstanceModal}
        title="Delete Instance"
        subtitle={instance.name}
        type="danger"
        confirmText={isDeletingInstance ? 'Deleting...' : 'Delete Permanently'}
        cancelText="Cancel"
        icon={<Trash2 className="w-4 h-4 text-rose-300" />}
        description={
          <div className="space-y-2">
            <p>
              Are you sure you want to delete <span className="font-bold text-white">"{instance.name}"</span>?
            </p>
            <p className="text-xs text-rose-400">
              All installed mods, world saves, screenshots, and configuration files will be permanently removed. This action cannot be undone.
            </p>
          </div>
        }
        onConfirm={async () => {
          setIsDeletingInstance(true);
          try {
            await onDeleteInstance(instance.id);
            setShowDeleteInstanceModal(false);
          } finally {
            setIsDeletingInstance(false);
          }
        }}
        onClose={() => setShowDeleteInstanceModal(false)}
      />

      {/* Delete Screenshot Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(screenshotToDelete)}
        title="Delete Screenshot"
        subtitle={screenshotToDelete?.filename}
        type="danger"
        confirmText="Delete Screenshot"
        cancelText="Cancel"
        icon={<Trash2 className="w-4 h-4 text-rose-300" />}
        description={
          <div className="space-y-2">
            <p>Are you sure you want to permanently delete this screenshot?</p>
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] text-[11px] font-mono text-slate-300 truncate">
              {screenshotToDelete?.filePath}
            </div>
          </div>
        }
        onConfirm={handleDeleteScreenshotConfirm}
        onClose={() => setScreenshotToDelete(null)}
      />

      {/* Screenshot Fullscreen Lightbox Modal */}
      {activeLightboxIndex !== null && (() => {
        const filteredScreenshots = screenshots
          .filter((s) => s.filename.toLowerCase().includes(screenshotSearch.toLowerCase()))
          .sort((a, b) => {
            if (screenshotSort === 'oldest') {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            if (screenshotSort === 'name') {
              return a.filename.localeCompare(b.filename);
            }
            if (screenshotSort === 'size') {
              return (b.sizeBytes || 0) - (a.sizeBytes || 0);
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        const currentShot = filteredScreenshots[activeLightboxIndex];
        if (!currentShot) return null;

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 select-none"
            onClick={() => setActiveLightboxIndex(null)}
          >
            <div
              className="relative max-w-6xl w-full max-h-[92vh] flex flex-col bg-galaxy-950/95 border border-white/[0.15] rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-black/50">
                <div className="min-w-0 pr-4">
                  <h3 className="text-sm font-bold text-white truncate">{getScreenshotDisplayName(currentShot.filename)}</h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {instance.name} • 1920 × 1080 • {formatBytes(currentShot.sizeBytes)} • {formatScreenshotDate(currentShot.createdAt, currentShot.filename)}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={(e) => handleCopyScreenshot(currentShot, e)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-glow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedScreenshotId === currentShot.id ? 'Copied!' : 'Copy Image'}</span>
                  </button>
                  <button
                    onClick={() => window.galaxy?.openScreenshotFolder?.(currentShot.filePath)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-colors"
                    title="Open in File Explorer"
                  >
                    <FolderOpen className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => setScreenshotToDelete(currentShot)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                    title="Delete Screenshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveLightboxIndex(null)}
                    className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border border-white/[0.1] transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative flex-1 bg-black/80 flex items-center justify-center p-4 overflow-hidden min-h-[300px]">
                <img
                  src={currentShot.previewUrl || `galaxy-file://image?path=${encodeURIComponent(currentShot.filePath)}`}
                  alt=""
                  className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl"
                />

                {filteredScreenshots.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveLightboxIndex((prev) =>
                          prev !== null && prev > 0 ? prev - 1 : filteredScreenshots.length - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-110"
                      title="Previous"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() =>
                        setActiveLightboxIndex((prev) =>
                          prev !== null && prev < filteredScreenshots.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-all shadow-xl hover:scale-110"
                      title="Next"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* IN-PLACE VERSION SWITCHER MODAL */}
      {/* =================================================================== */}
      {versionChangeItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (!switchingVersionId) {
                sounds.playClick();
                setVersionChangeItem(null);
              }
            }}
          />

          <div className="relative w-full max-w-3xl max-h-[85vh] bg-galaxy-900 border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-galaxy-950/60">
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                    versionChangeItem.type === 'shader'
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : versionChangeItem.type === 'resourcepack'
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  {versionChangeItem.type === 'shader' ? (
                    <Sparkles className="w-5 h-5" />
                  ) : versionChangeItem.type === 'resourcepack' ? (
                    <Palette className="w-5 h-5" />
                  ) : (
                    <Package className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-display font-bold text-white truncate">
                      Change Version: {versionChangeItem.item.name}
                    </h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                        versionChangeItem.type === 'shader'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : versionChangeItem.type === 'resourcepack'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {versionChangeItem.type === 'resourcepack' ? 'Resource Pack' : versionChangeItem.type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5 font-mono truncate">
                    <span className="text-slate-500">Current:</span>
                    <span className="text-slate-300 truncate">{versionChangeItem.item.filename}</span>
                    {versionChangeItem.item.version && (
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        v{versionChangeItem.item.version}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!switchingVersionId) {
                    sounds.playClick();
                    setVersionChangeItem(null);
                  }
                }}
                disabled={switchingVersionId !== null}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08] transition-colors disabled:opacity-50"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-galaxy-900/80 border-b border-white/[0.06] space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search query */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={versionModalSearch}
                    onChange={(e) => setVersionModalSearch(e.target.value)}
                    placeholder="Search version name, game version, file..."
                    className="w-full pl-9 pr-4 py-2 bg-galaxy-950/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1BD96A]/50 transition-colors"
                  />
                  {versionModalSearch && (
                    <button
                      onClick={() => setVersionModalSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Compatibility Toggle */}
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none bg-white/[0.04] hover:bg-white/[0.07] px-3 py-2 rounded-xl border border-white/[0.08] transition-colors shrink-0">
                  <input
                    type="checkbox"
                    checked={versionModalOnlyCompat}
                    onChange={(e) => setVersionModalOnlyCompat(e.target.checked)}
                    className="rounded border-white/20 text-[#1BD96A] focus:ring-0 focus:ring-offset-0 bg-black/40"
                  />
                  <span className="font-medium">
                    Compatible only <span className="text-[#1BD96A]">({instance.version})</span>
                  </span>
                </label>
              </div>

              {/* Loader selector pills (for mods) */}
              {versionChangeItem.type === 'mod' && (
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono mr-1">
                    Loader:
                  </span>
                  {['all', 'fabric', 'forge', 'neoforge', 'quilt'].map((loaderName) => {
                    const active = versionModalLoader === loaderName;
                    return (
                      <button
                        key={loaderName}
                        onClick={() => {
                          sounds.playClick();
                          setVersionModalLoader(loaderName);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all border ${
                          active
                            ? 'bg-[#1BD96A]/20 border-[#1BD96A]/40 text-[#1BD96A] font-bold'
                            : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        {loaderName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Version List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[250px] max-h-[50vh] custom-scrollbar">
              {loadingItemVersions ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#1BD96A] animate-spin" />
                  <p className="text-xs text-slate-400 font-medium animate-pulse">
                    Fetching available versions from Modrinth...
                  </p>
                </div>
              ) : filteredItemVersions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Box className="w-10 h-10 text-slate-600" />
                  <div className="text-sm font-bold text-slate-300">No versions found</div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {versionModalOnlyCompat
                      ? `No versions found matching Minecraft ${instance.version} (${instance.loader || 'Fabric'}). Try disabling "Compatible only" to view all available releases.`
                      : 'No versions matched your search criteria.'}
                  </p>
                  {versionModalOnlyCompat && (
                    <button
                      onClick={() => setVersionModalOnlyCompat(false)}
                      className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 border border-white/[0.1] transition-all"
                    >
                      Show All Versions
                    </button>
                  )}
                </div>
              ) : (
                filteredItemVersions.map((ver) => {
                  const isCurrent = isCurrentVersion(ver);
                  const isSwitching = switchingVersionId === ver.id;
                  const primaryFile = ver.files?.find((f) => f.primary) || ver.files?.[0];
                  const verType = (ver.versionType || 'release').toLowerCase();

                  return (
                    <div
                      key={ver.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                          : 'bg-galaxy-950/60 hover:bg-galaxy-800/80 border-white/[0.06] hover:border-white/[0.14]'
                      }`}
                    >
                      {/* Version Info */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-sm font-bold text-white font-display">
                            {ver.name || ver.versionNumber}
                          </span>

                          {/* Version Type Badge */}
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                              verType === 'release'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : verType === 'beta'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {verType}
                          </span>

                          {/* Version Number */}
                          <span className="text-xs font-mono text-slate-400 font-semibold bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
                            {ver.versionNumber}
                          </span>

                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <Check className="w-3 h-3 mr-0.5" />
                              <span>Current Version</span>
                            </span>
                          )}
                        </div>

                        {/* Meta Tags: Minecraft versions & Loaders */}
                        <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-slate-400">
                          {/* MC Versions */}
                          {ver.gameVersions && ver.gameVersions.length > 0 && (
                            <div className="flex items-center space-x-1 font-mono">
                              <span className="text-slate-500">MC:</span>
                              <div className="flex flex-wrap gap-1">
                                {ver.gameVersions.slice(0, 5).map((gv) => (
                                  <span
                                    key={gv}
                                    className={`px-1.5 py-0.2 rounded text-[10px] border ${
                                      gv === instance.version
                                        ? 'bg-[#1BD96A]/20 border-[#1BD96A]/40 text-[#1BD96A] font-bold'
                                        : 'bg-white/[0.04] border-white/[0.06] text-slate-300'
                                    }`}
                                  >
                                    {gv}
                                  </span>
                                ))}
                                {ver.gameVersions.length > 5 && (
                                  <span className="text-[10px] text-slate-500">
                                    +{ver.gameVersions.length - 5}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Loaders */}
                          {ver.loaders && ver.loaders.length > 0 && (
                            <div className="flex items-center space-x-1 font-mono ml-2">
                              <span className="text-slate-500">Loaders:</span>
                              <div className="flex flex-wrap gap-1">
                                {ver.loaders.map((ld) => (
                                  <span
                                    key={ld}
                                    className="px-1.5 py-0.2 rounded text-[10px] bg-white/[0.04] border border-white/[0.06] text-slate-300 capitalize"
                                  >
                                    {ld}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Published date & file size */}
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono ml-auto">
                            {ver.datePublished && <span>{formatDate(ver.datePublished)}</span>}
                            {primaryFile?.size && <span>â€¢ {formatBytes(primaryFile.size)}</span>}
                          </div>
                        </div>

                        {/* Filename display */}
                        {primaryFile?.filename && (
                          <div className="text-[10px] font-mono text-slate-500 truncate">
                            {primaryFile.filename}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0 sm:self-center">
                        {isCurrent ? (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSwitchVersionAction(ver)}
                            disabled={switchingVersionId !== null}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs shadow-glow-sm flex items-center space-x-1.5 transition-all disabled:opacity-50"
                          >
                            {isSwitching ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Installing...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Switch Version</span>
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
                {filteredItemVersions.length} version{filteredItemVersions.length === 1 ? '' : 's'} available
              </span>
              <button
                onClick={() => {
                  if (!switchingVersionId) {
                    sounds.playClick();
                    setVersionChangeItem(null);
                  }
                }}
                disabled={switchingVersionId !== null}
                className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-medium border border-white/[0.1] transition-colors disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Instance Share Code Modal */}
      {showShareModal && (
        <ShareInstanceModal
          instance={instance}
          onClose={() => setShowShareModal(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* Clone Instance Modal */}
      {showCloneModal && (
        <CloneInstanceModal
          isOpen={showCloneModal}
          onClose={() => setShowCloneModal(false)}
          instance={instance}
          onClone={async (instId, options) => {
            await onCloneInstance(instId, options);
          }}
        />
      )}

      {/* Direct In-Place Add Content Modal */}
      {showAddContentModal && (
        <AddContentModal
          isOpen={showAddContentModal}
          onClose={() => setShowAddContentModal(false)}
          instance={instance}
          initialType={addContentType}
          onContentChanged={loadInstanceData}
          onShowToast={onShowToast}
        />
      )}

      {/* Instance Health Checkup & Conflict Diagnostics Modal */}
      {showHealthModal && (
        <InstanceHealthModal
          instance={instance}
          onClose={() => setShowHealthModal(false)}
          onInstanceUpdated={async (updatedInst) => {
            await onUpdateInstance(updatedInst);
            await loadInstanceData();
          }}
        />
      )}
      {/* Instance Rename Modal */}
      {showRenameModal && (
        <PromptModal
          isOpen={showRenameModal}
          title="Rename Instance"
          subtitle="Choose a new name for this instance"
          label="Instance Name"
          placeholder="e.g. My Survival World"
          defaultValue={instance.name}
          confirmText="Rename"
          onConfirm={handleRenameInstance}
          onClose={() => setShowRenameModal(false)}
        />
      )}
    </div>
  );
};
