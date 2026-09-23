import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Play,
  Square,
  FolderOpen,
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
  Stethoscope
} from 'lucide-react';
import { Instance, Mod, ResourcePack, ShaderPack, WorldSave, JavaInstallation, ScreenshotItem, MarketplaceVersion, CloneInstanceOptions } from '../../types';
import { sounds } from '../../services/soundEngine';
import { InstanceIconRenderer, IconEditorModal, IsometricSymbolSVG } from './instanceIcons';
import { ConfirmModal } from '../common/ConfirmModal';
import { PromptModal } from '../common/PromptModal';
import { ShareInstanceModal } from './ShareInstanceModal';
import { AddContentModal } from './AddContentModal';
import { CloneInstanceModal } from './CloneInstanceModal';
import { InstanceHealthModal } from './InstanceHealthModal';

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
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [copiedScreenshotId, setCopiedScreenshotId] = useState<string | null>(null);
  const [screenshotToDelete, setScreenshotToDelete] = useState<ScreenshotItem | null>(null);
  const [refreshingScreenshots, setRefreshingScreenshots] = useState(false);

  // Settings form state
  const [instName, setInstName] = useState(instance.name);
  const [memoryMax, setMemoryMax] = useState(instance.memoryMax || 4096);
  const [jvmArgs, setJvmArgs] = useState(instance.jvmArgs || '');
  const [jvmProfile, setJvmProfile] = useState<any>(instance.jvmProfile || 'aikar');
  const [javaPath, setJavaPath] = useState(instance.javaPath || '');
  const [resWidth, setResWidth] = useState(instance.resolution?.width || 1280);
  const [resHeight, setResHeight] = useState(instance.resolution?.height || 720);
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

  useEffect(() => {
    loadInstanceData();
  }, [instance.id]);

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

  // Settings Save
  const handleSaveSettings = async () => {
    sounds.playSuccess();
    try {
      const updated: Instance = {
        ...instance,
        name: instName,
        memoryMax,
        jvmArgs,
        javaPath: javaPath || undefined,
        resolution: {
          ...instance.resolution,
          width: resWidth,
          height: resHeight
        }
      };
      await onUpdateInstance(updated);
      onShowToast({
        id: Math.random().toString(),
        type: 'success',
        title: 'Settings Saved'
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
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

  return (
    <div className="flex-1 h-full flex flex-col select-none overflow-hidden bg-galaxy-950/60 font-sans">
      {/* ========================================================================= */}
      {/* TOP HEADER BAR (Modrinth App Aesthetic) */}
      {/* ========================================================================= */}
      <div className="px-6 py-4 border-b border-white/[0.08] bg-galaxy-950/80 backdrop-blur-xl flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          {/* Back Navigation Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-galaxy-900/90 hover:bg-galaxy-800 text-slate-400 hover:text-white border border-white/[0.08] transition-all active:scale-95"
            title="Back to instances"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Instance Custom 3D Voxel Icon Tile */}
          <div
            onClick={() => {
              sounds.playClick();
              setShowIconEditor(true);
            }}
            className="group relative cursor-pointer"
            title="Click to edit 3D icon & color palette"
          >
            <InstanceIconRenderer
              icon={instance.icon || 'backpack'}
              background={instance.iconBackground || 'blue'}
              size="md"
              className="w-12 h-12 rounded-2xl group-hover:scale-105 transition-all shadow-md"
            />
            <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Palette className="w-4 h-4 text-cyan-300" />
            </div>
          </div>

          {/* Instance Title & Metadata */}
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-display font-black text-white tracking-tight">
                {instance.name}
              </h2>
              {instance.isFavorite && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>Favorite</span>
                </span>
              )}
            </div>

            {/* Modrinth-style Metadata Row */}
            <div className="flex items-center space-x-3 mt-0.5 text-xs text-slate-400 font-mono">
              <span className="flex items-center space-x-1 text-slate-300">
                <Box className="w-3.5 h-3.5 text-purple-400" />
                <span className="capitalize">{instance.loader}</span>
                <span>{instance.version}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatPlaytime(instance.playTimeMinutes)}</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center space-x-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{formatLastPlayed(instance.lastPlayed)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Action Suite */}
        <div className="flex items-center space-x-3">
          {/* Main Action: Emerald Green Play Button or Red Stop */}
          {instance.isRunning ? (
            <button
              onClick={() => onKill(instance)}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-glow-sm flex items-center space-x-2 transition-all active:scale-95"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={() => onLaunch(instance)}
              className="px-7 py-2.5 rounded-xl bg-[#1BD96A] hover:bg-[#15b757] text-black font-extrabold text-sm shadow-[0_0_20px_rgba(27,217,106,0.35)] hover:shadow-[0_0_25px_rgba(27,217,106,0.55)] flex items-center space-x-2 transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-black stroke-black" />
              <span>Play</span>
            </button>
          )}

          {/* 1-Click Share Instance Code Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowShareModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="1-Click Instance Share Code (GLX-XXXX)"
          >
            <Share2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Instance Health Checkup & Diagnostics Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowHealthModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            title="Instance Health Checkup & Diagnostics"
          >
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Health Check</span>
          </button>

          {/* Quick Settings Gear Icon */}
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('settings');
            }}
            className={`p-2.5 rounded-xl border transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600/30 border-blue-400 text-blue-300'
                : 'bg-galaxy-900/90 hover:bg-galaxy-800 text-slate-400 hover:text-white border-white/[0.08]'
            }`}
            title="Instance Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* More Header Options Menu */}
          <div className="relative">
            <button
              onClick={() => {
                sounds.playClick();
                setShowHeaderMoreMenu(!showHeaderMoreMenu);
              }}
              className="p-2.5 rounded-xl bg-galaxy-900/90 hover:bg-galaxy-800 text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showHeaderMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowHeaderMoreMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-galaxy-900 border border-white/[0.1] shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setShowHeaderMoreMenu(false);
                      sounds.playClick();
                      setShowHealthModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5"
                  >
                    <Stethoscope className="w-4 h-4 text-emerald-400" />
                    <span>Run Health Checkup</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowHeaderMoreMenu(false);
                      sounds.playClick();
                      setShowShareModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5"
                  >
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>Share Instance Code</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowHeaderMoreMenu(false);
                      onOpenFolder(instance);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5"
                  >
                    <FolderOpen className="w-4 h-4 text-cyan-400" />
                    <span>Open Instance Folder</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowHeaderMoreMenu(false);
                      sounds.playClick();
                      setShowCloneModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5"
                  >
                    <Copy className="w-4 h-4 text-purple-400" />
                    <span>Clone Instance</span>
                  </button>

                  <button
                    onClick={async () => {
                      setShowHeaderMoreMenu(false);
                      sounds.playClick();
                      if (window.galaxy?.toggleInstanceFavorite) {
                        await window.galaxy.toggleInstanceFavorite(instance.id);
                        const updated = { ...instance, isFavorite: !instance.isFavorite };
                        await onUpdateInstance(updated);
                        onShowToast({
                          id: Math.random().toString(),
                          type: 'info',
                          title: updated.isFavorite ? 'Starred as Favorite' : 'Removed from Favorites',
                          message: `${instance.name} ${updated.isFavorite ? 'pinned in favorites' : 'unstarred'}.`
                        });
                      }
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5"
                  >
                    <Star className="w-4 h-4 text-amber-400" />
                    <span>{instance.isFavorite ? 'Unfavorite Instance' : 'Star as Favorite'}</span>
                  </button>

                  <div className="my-1 border-t border-white/[0.08]" />

                  <button
                    onClick={() => {
                      setShowHeaderMoreMenu(false);
                      sounds.playClick();
                      setShowDeleteInstanceModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2.5"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete Instance</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INSTANCE NAVIGATION TABS (Modrinth Style Pills) */}
      {/* ========================================================================= */}
      <div className="flex items-center px-6 border-b border-white/[0.06] bg-galaxy-950/40 space-x-2 text-xs py-2.5">
        {[
          { id: 'content', label: 'Content', icon: Package, count: totalContentCount },
          { id: 'files', label: 'Files', icon: FolderOpen },
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
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-[#1BD96A]/15 text-[#1BD96A] border border-[#1BD96A]/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#1BD96A]/20 text-[#1BD96A]' : 'bg-white/[0.06] text-slate-400'
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
      <div className="flex-1 overflow-y-auto p-6">
        {/* ----------------------------------------------------------------------- */}
        {/* CONTENT TAB (Exact Modrinth Content Table layout) */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'content' && (
          <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-150">
            {/* Action Bar / Search Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search input matching Modrinth: "Search 40 projects..." */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${totalContentCount} projects...`}
                  className="w-full pl-10 pr-9 py-2 rounded-xl bg-galaxy-900/90 border border-white/[0.08] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#1BD96A]/60 transition-colors shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload & Direct Add Content Action Buttons */}
              <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleUploadFiles}
                  className="px-3.5 py-2 rounded-xl bg-galaxy-900/90 hover:bg-galaxy-800 border border-white/[0.08] text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                  title="Upload jar/zip files directly to instance"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Upload</span>
                </button>

                {/* Direct Action Button tailored to active category tab */}
                {contentCategory === 'resourcepacks' ? (
                  <button
                    onClick={() => handleOpenAddContent('resourcepack')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Palette className="w-4 h-4" />
                    <span>+ Add Resource Packs</span>
                  </button>
                ) : contentCategory === 'shaderpacks' ? (
                  <button
                    onClick={() => handleOpenAddContent('shader')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>+ Add Shaders</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenAddContent('mod')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-glow-emerald flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Add Mods</span>
                  </button>
                )}

                {/* Quick Add Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowAddContentMenu(!showAddContentMenu)}
                    className="p-2 rounded-xl bg-galaxy-900/90 hover:bg-galaxy-800 border border-white/[0.08] text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                    title="Add Mods, Shaders, Resource Packs or Modpacks"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showAddContentMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowAddContentMenu(false)}
                      />
                      <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-galaxy-900 border border-white/[0.12] shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => handleOpenAddContent('mod')}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Mods</span>
                        </button>
                        <button
                          onClick={() => handleOpenAddContent('shader')}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-amber-500/20 hover:text-amber-300 flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Add Shaders</span>
                        </button>
                        <button
                          onClick={() => handleOpenAddContent('resourcepack')}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-purple-500/20 hover:text-purple-300 flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                          <Palette className="w-3.5 h-3.5 text-purple-400" />
                          <span>Add Resource Packs</span>
                        </button>
                        <button
                          onClick={() => handleOpenAddContent('modpack')}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center space-x-2 transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Add Modpacks</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Filter & Sort Controls Sub-Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-white/[0.04] pb-3">
              <div className="flex items-center space-x-2">
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowSortDropdown(!showSortDropdown);
                      setShowFilterDropdown(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-galaxy-900/80 hover:bg-galaxy-800 border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sortLabels[sortBy]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showSortDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowSortDropdown(false)}
                      />
                      <div className="absolute left-0 mt-1.5 w-44 rounded-xl bg-galaxy-900 border border-white/[0.1] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {(['name_asc', 'name_desc', 'version', 'size', 'enabled_first'] as SortOption[]).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              sounds.playClick();
                              setSortBy(opt);
                              setShowSortDropdown(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between ${
                              sortBy === opt
                                ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                                : 'text-slate-300 hover:bg-white/[0.06]'
                            }`}
                          >
                            <span>{sortLabels[opt]}</span>
                            {sortBy === opt && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Filter Icon Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowFilterDropdown(!showFilterDropdown);
                      setShowSortDropdown(false);
                    }}
                    className={`p-2 rounded-xl border transition-colors ${
                      statusFilter !== 'all'
                        ? 'bg-[#1BD96A]/20 border-[#1BD96A]/40 text-[#1BD96A]'
                        : 'bg-galaxy-900/80 hover:bg-galaxy-800 text-slate-400 hover:text-white border-white/[0.08]'
                    }`}
                    title="Filter by status"
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>

                  {showFilterDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowFilterDropdown(false)}
                      />
                      <div className="absolute left-0 mt-1.5 w-40 rounded-xl bg-galaxy-900 border border-white/[0.1] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {(['all', 'enabled', 'disabled'] as StatusFilter[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              sounds.playClick();
                              setStatusFilter(st);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-xs capitalize flex items-center justify-between ${
                              statusFilter === st
                                ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                                : 'text-slate-300 hover:bg-white/[0.06]'
                            }`}
                          >
                            <span>{st === 'all' ? 'All Status' : st}</span>
                            {statusFilter === st && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Content Category Filter Pills matching Modrinth */}
                <div className="flex items-center space-x-1.5">
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
                        className={`px-3 py-1 rounded-xl text-xs font-medium transition-all border flex items-center space-x-1.5 ${
                          isActive
                            ? 'bg-[#1BD96A]/20 border-[#1BD96A]/40 text-[#1BD96A] font-bold shadow-sm'
                            : 'bg-galaxy-900/60 border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`text-[10px] px-1 rounded-full ${
                            isActive ? 'bg-[#1BD96A]/20 text-[#1BD96A]' : 'bg-white/[0.06] text-slate-500'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Links on Right: Update all & Refresh */}
              <div className="flex items-center space-x-3 text-xs">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onShowToast({
                      id: Math.random().toString(),
                      type: 'info',
                      title: 'Mods are up to date',
                      message: 'All installed projects are on their latest compatible versions.'
                    });
                  }}
                  className="flex items-center space-x-1.5 text-slate-400 hover:text-[#1BD96A] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Update all</span>
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
                  className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* =================================================================== */}
            {/* CONTENT TABLE: MODS LISTING */}
            {/* =================================================================== */}
            {(contentCategory === 'mods' || contentCategory === 'all') && (
              <div className="space-y-2 pt-1">
                {contentCategory === 'all' && (
                  <div className="flex items-center justify-between px-1 pt-1">
                    <h4 className="text-xs font-display font-bold text-slate-300 flex items-center space-x-2">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <span>Mods ({filteredAndSortedMods.length})</span>
                    </h4>
                  </div>
                )}

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  <div className="col-span-6 sm:col-span-7 flex items-center space-x-3">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#1BD96A]" />
                      ) : (
                        <SquareIcon className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <span>Project</span>
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <span>Version</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span>Actions</span>
                  </div>
                </div>

                {/* Empty State */}
                {filteredAndSortedMods.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-3 bg-galaxy-900/30">
                    <Package className="w-10 h-10 text-slate-600" />
                    <div className="text-sm font-bold text-slate-200">No Mods Found</div>
                    <p className="text-xs text-slate-500 max-w-xs">
                      {searchQuery
                        ? `No mods matched "${searchQuery}".`
                        : 'This instance does not have any mods installed yet.'}
                    </p>
                    <button
                      onClick={() => onNavigateToMarketplace('mod')}
                      className="px-5 py-2.5 rounded-xl bg-[#1BD96A] hover:bg-[#15b757] text-black font-bold text-xs shadow-glow-sm flex items-center space-x-1.5 transition-all mt-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Discover Mods</span>
                    </button>
                  </div>
                ) : (
                  /* Mod Rows matching Modrinth exactly */
                  <div className="space-y-1.5">
                    {filteredAndSortedMods.map((mod) => {
                      const isSelected = selectedFilenames.includes(mod.filename);
                      const isRowMenuOpen = activeRowMenu === mod.filename;

                      return (
                        <div
                          key={mod.filename}
                          className={`group grid grid-cols-12 gap-4 items-center px-4 py-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                              : mod.enabled
                              ? 'bg-galaxy-900/70 hover:bg-galaxy-800/80 border-white/[0.06] hover:border-white/[0.15]'
                              : 'bg-galaxy-950/40 border-white/[0.03] opacity-60'
                          }`}
                        >
                          {/* Project Column (Checkbox + Thumbnail + Clickable Name + Author) */}
                          <div className="col-span-6 sm:col-span-7 flex items-center space-x-3.5 min-w-0">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleToggleSelectItem(mod.filename)}
                              className="text-slate-400 hover:text-white shrink-0 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#1BD96A]" />
                              ) : (
                                <SquareIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                              )}
                            </button>

                            {/* Mod Thumbnail Icon */}
                            <div className="w-10 h-10 rounded-xl bg-galaxy-950/80 border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                              {mod.icon ? (
                                <img
                                  src={mod.icon}
                                  alt={mod.name}
                                  className="w-8 h-8 object-contain rounded-lg"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-7 h-7 flex items-center justify-center">
                                  <IsometricSymbolSVG
                                    symbolId={
                                      mod.name.toLowerCase().includes('skin')
                                        ? 'steve'
                                        : mod.name.toLowerCase().includes('apple')
                                        ? 'apple'
                                        : mod.name.toLowerCase().includes('stat')
                                        ? 'bookshelf'
                                        : mod.name.toLowerCase().includes('f3')
                                        ? 'axes_gizmo'
                                        : mod.name.toLowerCase().includes('chat')
                                        ? 'alex'
                                        : mod.name.toLowerCase().includes('cloth') || mod.name.toLowerCase().includes('config')
                                        ? 'wrench'
                                        : mod.name.toLowerCase().includes('compose')
                                        ? 'cyber_cube'
                                        : mod.name.toLowerCase().includes('fps')
                                        ? 'quantum_tesseract'
                                        : 'backpack'
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            {/* Mod Title (Clickable & Hoverable for Web Redirection) & Author Tag */}
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleOpenWebLink(mod, 'mod')}
                                className="text-left group/title inline-flex items-center gap-1.5 max-w-full text-xs font-bold text-slate-100 group-hover:text-white group-hover/title:text-[#1BD96A] transition-colors cursor-pointer"
                                title="Click to open mod page in browser"
                              >
                                <span className="truncate group-hover/title:underline decoration-[#1BD96A]/50 underline-offset-2">
                                  {mod.name}
                                </span>
                                <ExternalLink className="w-3 h-3 text-[#1BD96A] opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                              </button>
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                                {mod.authors && mod.authors.length > 0 ? (
                                  <>
                                    <div className="w-3.5 h-3.5 rounded-full bg-white/[0.08] flex items-center justify-center text-[9px] text-slate-300 font-mono shrink-0">
                                      {mod.authors[0].charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate text-slate-400 font-medium">
                                      {mod.authors.join(', ')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="truncate text-slate-500 font-mono">
                                    {mod.id || mod.description || 'Installed Mod'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Version Column (Version string + .jar filename) */}
                          <div className="col-span-4 sm:col-span-3 min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate font-mono">
                              {mod.version}
                            </div>
                            <div
                              className="text-[11px] text-slate-500 font-mono truncate"
                              title={mod.filename}
                            >
                              {mod.filename}
                            </div>
                          </div>

                          {/* Actions Column (Sync + Modrinth Toggle Switch + Trash + Menu) */}
                          <div className="col-span-2 flex items-center justify-end space-x-2 shrink-0">
                            {/* Version Switcher / Sync Icon */}
                            <button
                              onClick={() => {
                                sounds.playClick();
                                handleOpenVersionSwitcher(mod, 'mod');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors hidden sm:flex items-center justify-center"
                              title="Change version"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Modrinth-Style Sleek Green Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleMod(mod)}
                              className={`relative w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                                mod.enabled
                                  ? 'bg-[#1BD96A]'
                                  : 'bg-zinc-800 border border-white/[0.1]'
                              }`}
                              title={mod.enabled ? 'Click to Disable' : 'Click to Enable'}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 transform ${
                                  mod.enabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            {/* Delete / Trash Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMod(mod)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete mod"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Context Row Menu Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  setActiveRowMenu(isRowMenuOpen ? null : mod.filename);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                title="More options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {isRowMenuOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setActiveRowMenu(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-galaxy-900 border border-white/[0.1] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleOpenVersionSwitcher(mod, 'mod');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Change Version</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        onOpenFolder(instance, 'mods');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>Show in Explorer</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleOpenWebLink(mod, 'mod');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <Globe className="w-3.5 h-3.5 text-[#1BD96A]" />
                                      <span>Open in Browser</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleToggleMod(mod);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <Power className="w-3.5 h-3.5 text-amber-400" />
                                      <span>{mod.enabled ? 'Disable Mod' : 'Enable Mod'}</span>
                                    </button>
                                    <div className="my-1 border-t border-white/[0.06]" />
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleDeleteMod(mod);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Delete Mod</span>
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
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* CONTENT TABLE: RESOURCE PACKS LISTING */}
            {/* =================================================================== */}
            {(contentCategory === 'resourcepacks' || (contentCategory === 'all' && resourcePacks.length > 0)) && (
              <div className="space-y-2 pt-2">
                {/* Section Header if in All view or table header */}
                {contentCategory === 'all' && (
                  <div className="flex items-center justify-between px-1 pt-2">
                    <h4 className="text-xs font-display font-bold text-slate-300 flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Resource Packs ({filteredAndSortedResourcePacks.length})</span>
                    </h4>
                  </div>
                )}

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  <div className="col-span-6 sm:col-span-7 flex items-center space-x-3">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#1BD96A]" />
                      ) : (
                        <SquareIcon className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <span>Project</span>
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <span>Version</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span>Actions</span>
                  </div>
                </div>

                {filteredAndSortedResourcePacks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-3 bg-galaxy-900/30">
                    <Layers className="w-10 h-10 text-slate-600" />
                    <div className="text-sm font-bold text-slate-200">No Resource Packs Found</div>
                    <p className="text-xs text-slate-500 max-w-xs">
                      {searchQuery
                        ? `No resource packs matched "${searchQuery}".`
                        : 'This instance does not have any resource packs installed yet.'}
                    </p>
                    <button
                      onClick={() => onNavigateToMarketplace('resourcepack')}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-1.5 transition-all mt-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Discover Resource Packs</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredAndSortedResourcePacks.map((rp) => {
                      const isSelected = selectedFilenames.includes(rp.filename);
                      const isRowMenuOpen = activeRowMenu === rp.filename;

                      return (
                        <div
                          key={rp.filename}
                          className={`group grid grid-cols-12 gap-4 items-center px-4 py-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
                              : rp.enabled
                              ? 'bg-galaxy-900/70 hover:bg-galaxy-800/80 border-white/[0.06] hover:border-white/[0.15]'
                              : 'bg-galaxy-950/40 border-white/[0.03] opacity-60'
                          }`}
                        >
                          {/* Project Column (Checkbox + Pack Icon + Clickable Name + Author) */}
                          <div className="col-span-6 sm:col-span-7 flex items-center space-x-3.5 min-w-0">
                            <button
                              onClick={() => handleToggleSelectItem(rp.filename)}
                              className="text-slate-400 hover:text-white shrink-0 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#1BD96A]" />
                              ) : (
                                <SquareIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                              )}
                            </button>

                            {/* Resource Pack Thumbnail Icon */}
                            <div className="w-10 h-10 rounded-xl bg-galaxy-950/80 border border-purple-500/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform relative">
                              <div className="w-7 h-7 flex items-center justify-center text-purple-400">
                                <IsometricSymbolSVG symbolId="emerald" />
                              </div>
                              {rp.icon && (
                                <img
                                  src={rp.icon}
                                  alt={rp.name}
                                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                            </div>

                            {/* Resource Pack Title (Clickable & Hoverable for Web Redirection) & Description */}
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleOpenWebLink(rp, 'resourcepack')}
                                className="text-left group/title inline-flex items-center gap-1.5 max-w-full text-xs font-bold text-slate-100 group-hover:text-white group-hover/title:text-purple-400 transition-colors cursor-pointer"
                                title="Click to open resource pack page in browser"
                              >
                                <span className="truncate group-hover/title:underline decoration-purple-400/50 underline-offset-2">
                                  {rp.name}
                                </span>
                                <ExternalLink className="w-3 h-3 text-purple-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                              </button>
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                                {rp.authors && rp.authors.length > 0 ? (
                                  <>
                                    <div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-[9px] font-mono shrink-0">
                                      {rp.authors[0].charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate text-slate-400 font-medium">
                                      {rp.authors.join(', ')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="truncate text-slate-500 font-mono">
                                    {rp.description || 'Resource Pack'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Version Column */}
                          <div className="col-span-4 sm:col-span-3 min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate font-mono">
                              {rp.version || 'Latest'}
                            </div>
                            <div
                              className="text-[11px] text-slate-500 font-mono truncate"
                              title={rp.filename}
                            >
                              {rp.filename}
                            </div>
                          </div>

                          {/* Actions Column */}
                          <div className="col-span-2 flex items-center justify-end space-x-2 shrink-0">
                            {/* Version Switcher */}
                            <button
                              onClick={() => {
                                sounds.playClick();
                                handleOpenVersionSwitcher(rp, 'resourcepack');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors hidden sm:flex items-center justify-center"
                              title="Change version"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Enable / Disable Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleResourcePack(rp)}
                              className={`relative w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                                rp.enabled
                                  ? 'bg-[#1BD96A]'
                                  : 'bg-zinc-800 border border-white/[0.1]'
                              }`}
                              title={rp.enabled ? 'Click to Disable' : 'Click to Enable'}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 transform ${
                                  rp.enabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteResourcePack(rp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete pack"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Context Menu Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  setActiveRowMenu(isRowMenuOpen ? null : rp.filename);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                title="More options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {isRowMenuOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setActiveRowMenu(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-galaxy-900 border border-white/[0.1] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleOpenVersionSwitcher(rp, 'resourcepack');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
                                      <span>Change Version</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        onOpenFolder(instance, 'resourcepacks');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>Show in Explorer</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleOpenWebLink(rp, 'resourcepack');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                                      <span>Open in Browser</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleToggleResourcePack(rp);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <Power className="w-3.5 h-3.5 text-amber-400" />
                                      <span>{rp.enabled ? 'Disable Pack' : 'Enable Pack'}</span>
                                    </button>
                                    <div className="my-1 border-t border-white/[0.06]" />
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleDeleteResourcePack(rp);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Delete Pack</span>
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
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* CONTENT TABLE: SHADER PACKS LISTING */}
            {/* =================================================================== */}
            {(contentCategory === 'shaderpacks' || (contentCategory === 'all' && shaderPacks.length > 0)) && (
              <div className="space-y-2 pt-2">
                {/* Section Header if in All view or table header */}
                {contentCategory === 'all' && (
                  <div className="flex items-center justify-between px-1 pt-2">
                    <h4 className="text-xs font-display font-bold text-slate-300 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Shader Packs ({filteredAndSortedShaderPacks.length})</span>
                    </h4>
                  </div>
                )}

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/[0.06]">
                  <div className="col-span-6 sm:col-span-7 flex items-center space-x-3">
                    <button
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={isAllSelected ? 'Deselect All' : 'Select All'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#1BD96A]" />
                      ) : (
                        <SquareIcon className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <span>Project</span>
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <span>Version</span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <span>Actions</span>
                  </div>
                </div>

                {filteredAndSortedShaderPacks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-3 bg-galaxy-900/30">
                    <Sparkles className="w-10 h-10 text-slate-600" />
                    <div className="text-sm font-bold text-slate-200">No Shader Packs Found</div>
                    <p className="text-xs text-slate-500 max-w-xs">
                      {searchQuery
                        ? `No shader packs matched "${searchQuery}".`
                        : 'This instance does not have any shaders installed (e.g. BSL, Complementary).'}
                    </p>
                    <button
                      onClick={() => onNavigateToMarketplace('shader')}
                      className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-glow-sm flex items-center space-x-1.5 transition-all mt-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Discover Shaders</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredAndSortedShaderPacks.map((sp) => {
                      const isSelected = selectedFilenames.includes(sp.filename);
                      const isRowMenuOpen = activeRowMenu === sp.filename;

                      return (
                        <div
                          key={sp.filename}
                          className={`group grid grid-cols-12 gap-4 items-center px-4 py-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm'
                              : sp.enabled
                              ? 'bg-galaxy-900/70 hover:bg-galaxy-800/80 border-white/[0.06] hover:border-white/[0.15]'
                              : 'bg-galaxy-950/40 border-white/[0.03] opacity-60'
                          }`}
                        >
                          {/* Project Column (Checkbox + Shader Icon + Clickable Name + Author) */}
                          <div className="col-span-6 sm:col-span-7 flex items-center space-x-3.5 min-w-0">
                            <button
                              onClick={() => handleToggleSelectItem(sp.filename)}
                              className="text-slate-400 hover:text-white shrink-0 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#1BD96A]" />
                              ) : (
                                <SquareIcon className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                              )}
                            </button>

                            {/* Shader Thumbnail Icon */}
                            <div className="w-10 h-10 rounded-xl bg-galaxy-950/80 border border-cyan-500/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform relative">
                              <div className="w-7 h-7 flex items-center justify-center text-cyan-400">
                                <IsometricSymbolSVG symbolId="nether_star" />
                              </div>
                              {sp.icon && (
                                <img
                                  src={sp.icon}
                                  alt={sp.name}
                                  className="absolute inset-0 w-full h-full object-cover rounded-xl"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                            </div>

                            {/* Shader Title (Clickable & Hoverable for Web Redirection) & Author */}
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleOpenWebLink(sp, 'shader')}
                                className="text-left group/title inline-flex items-center gap-1.5 max-w-full text-xs font-bold text-slate-100 group-hover:text-white group-hover/title:text-cyan-400 transition-colors cursor-pointer"
                                title="Click to open shader page in browser"
                              >
                                <span className="truncate group-hover/title:underline decoration-cyan-400/50 underline-offset-2">
                                  {sp.name}
                                </span>
                                <ExternalLink className="w-3 h-3 text-cyan-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                              </button>
                              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5">
                                {sp.authors && sp.authors.length > 0 ? (
                                  <>
                                    <div className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] font-mono shrink-0">
                                      {sp.authors[0].charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate text-slate-400 font-medium">
                                      {sp.authors.join(', ')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="truncate text-slate-500 font-mono">
                                    {sp.description || 'Shader Pack'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Version Column */}
                          <div className="col-span-4 sm:col-span-3 min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate font-mono">
                              {sp.version || 'Release'}
                            </div>
                            <div
                              className="text-[11px] text-slate-500 font-mono truncate"
                              title={sp.filename}
                            >
                              {sp.filename}
                            </div>
                          </div>

                          {/* Actions Column */}
                          <div className="col-span-2 flex items-center justify-end space-x-2 shrink-0">
                            {/* Version Switcher */}
                            <button
                              onClick={() => {
                                sounds.playClick();
                                handleOpenVersionSwitcher(sp, 'shader');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors hidden sm:flex items-center justify-center"
                              title="Change version"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Enable / Disable Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleShaderPack(sp)}
                              className={`relative w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                                sp.enabled
                                  ? 'bg-[#1BD96A]'
                                  : 'bg-zinc-800 border border-white/[0.1]'
                              }`}
                              title={sp.enabled ? 'Click to Disable' : 'Click to Enable'}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 transform ${
                                  sp.enabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteShaderPack(sp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete pack"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Context Menu Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playClick();
                                  setActiveRowMenu(isRowMenuOpen ? null : sp.filename);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                title="More options"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {isRowMenuOpen && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setActiveRowMenu(null)}
                                  />
                                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-galaxy-900 border border-white/[0.1] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleOpenVersionSwitcher(sp, 'shader');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>Change Version</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        onOpenFolder(instance, 'shaderpacks');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>Show in Explorer</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleOpenWebLink(sp, 'shader');
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                                      <span>Open in Browser</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleToggleShaderPack(sp);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] flex items-center space-x-2"
                                    >
                                      <Power className="w-3.5 h-3.5 text-amber-400" />
                                      <span>{sp.enabled ? 'Disable Shader' : 'Enable Shader'}</span>
                                    </button>
                                    <div className="my-1 border-t border-white/[0.06]" />
                                    <button
                                      onClick={() => {
                                        setActiveRowMenu(null);
                                        handleDeleteShaderPack(sp);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Delete Shader</span>
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
                )}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* FILES TAB */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'files' && (
          <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-150">
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
          <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-150">
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
                        <div className="text-[10px] text-slate-500 font-mono">{b.filename} • {(b.sizeBytes / (1024 * 1024)).toFixed(2)} MB</div>
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
          <div className="space-y-4 max-w-5xl mx-auto animate-in fade-in duration-150">
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
        {activeTab === 'screenshots' && (
          <div className="space-y-4 max-w-6xl mx-auto animate-in fade-in duration-150">
            {/* Header / Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={screenshotSearch}
                  onChange={(e) => setScreenshotSearch(e.target.value)}
                  placeholder="Filter screenshots..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-galaxy-900 border border-white/[0.08] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <button
                  onClick={handleRefreshScreenshots}
                  disabled={refreshingScreenshots}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-colors"
                  title="Refresh Screenshots"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingScreenshots ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => onOpenFolder(instance, 'screenshots')}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 transition-colors flex items-center space-x-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open Folder</span>
                </button>
              </div>
            </div>

            {/* Screenshots Gallery Grid */}
            {screenshots.filter((s) => s.filename.toLowerCase().includes(screenshotSearch.toLowerCase())).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center space-y-3 bg-galaxy-900/20">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300 shadow-glow-sm">
                  <Image className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-200">No Screenshots in this Instance</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Press <span className="font-mono text-cyan-300 font-bold bg-cyan-500/20 px-1.5 py-0.5 rounded border border-cyan-500/30">F2</span> while playing Minecraft to capture screenshots. They will automatically appear here!
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {screenshots
                  .filter((s) => s.filename.toLowerCase().includes(screenshotSearch.toLowerCase()))
                  .map((item, idx) => {
                    const isCopied = copiedScreenshotId === item.id;
                    const previewSrc = `galaxy-file://${item.filePath.replace(/\\/g, '/')}`;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveLightboxIndex(idx)}
                        className="group relative rounded-2xl bg-galaxy-900/70 border border-white/[0.08] hover:border-purple-500/50 overflow-hidden shadow-lg hover:shadow-glow-sm transition-all cursor-pointer flex flex-col"
                      >
                        <div className="relative aspect-video bg-black/60 overflow-hidden">
                          <img
                            src={previewSrc}
                            alt={item.filename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg flex items-center space-x-1.5 text-xs font-semibold">
                              <ZoomIn className="w-4 h-4 text-cyan-300" />
                              <span>Preview</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-100 truncate" title={item.filename}>
                              {item.filename}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
                              <span>{(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                              <span>•</span>
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleCopyScreenshot(item, e)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isCopied
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white border-white/[0.08]'
                              }`}
                              title={isCopied ? 'Copied!' : 'Copy Image'}
                            >
                              {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setScreenshotToDelete(item);
                              }}
                              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 transition-all"
                              title="Delete Screenshot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* SETTINGS TAB */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
            {/* Instance Name & Icon Customization */}
            <div className="p-6 rounded-2xl bg-galaxy-900/70 border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-display font-bold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Instance Identity</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Instance Name</label>
                  <input
                    type="text"
                    value={instName}
                    onChange={(e) => setInstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setShowIconEditor(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-200 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>Customize 3D Voxel Icon & Theme</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RAM Allocation Slider */}
            <div className="p-6 rounded-2xl bg-galaxy-900/70 border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-display font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Memory (RAM) Allocation</span>
                </h3>
                <span className="text-sm font-mono font-bold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/20">
                  {memoryMax} MB ({(memoryMax / 1024).toFixed(1)} GB)
                </span>
              </div>

              <input
                type="range"
                min="1024"
                max="16384"
                step="512"
                value={memoryMax}
                onChange={(e) => setMemoryMax(Number(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-galaxy-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Resolution Settings */}
            <div className="p-6 rounded-2xl bg-galaxy-900/70 border border-white/[0.08] space-y-4">
              <h3 className="text-sm font-display font-bold text-white flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Default Window Resolution</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={resWidth}
                    onChange={(e) => setResWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-galaxy-950 border border-white/[0.08] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={resHeight}
                    onChange={(e) => setResHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-galaxy-950 border border-white/[0.08] text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Settings Action */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-glow-sm hover:shadow-glow-md transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
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
        title="Delete Mod"
        subtitle={modToDelete?.name}
        type="danger"
        confirmText="Delete Mod"
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
        title="Delete Resource Pack"
        subtitle={resourcePackToDelete?.name}
        type="danger"
        confirmText="Delete Pack"
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
        title="Delete Shader Pack"
        subtitle={shaderPackToDelete?.name}
        type="danger"
        confirmText="Delete Shader"
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
      {activeLightboxIndex !== null && screenshots[activeLightboxIndex] && (
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
                <h3 className="text-sm font-bold text-white truncate">{screenshots[activeLightboxIndex].filename}</h3>
                <div className="text-[11px] text-slate-400 font-mono">
                  {instance.name} • {(screenshots[activeLightboxIndex].sizeBytes / (1024 * 1024)).toFixed(2)} MB • {new Date(screenshots[activeLightboxIndex].createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={(e) => handleCopyScreenshot(screenshots[activeLightboxIndex], e)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-glow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedScreenshotId === screenshots[activeLightboxIndex].id ? 'Copied!' : 'Copy Image'}</span>
                </button>
                <button
                  onClick={() => window.galaxy?.openScreenshotFolder?.(screenshots[activeLightboxIndex].filePath)}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-colors"
                  title="Open in File Explorer"
                >
                  <FolderOpen className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={() => setScreenshotToDelete(screenshots[activeLightboxIndex])}
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
                src={`galaxy-file://${screenshots[activeLightboxIndex].filePath.replace(/\\/g, '/')}`}
                alt={screenshots[activeLightboxIndex].filename}
                className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl"
              />

              {screenshots.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveLightboxIndex((prev) =>
                        prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1
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
                        prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0
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
      )}

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
                            {primaryFile?.size && <span>• {formatBytes(primaryFile.size)}</span>}
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
    </div>
  );
};
