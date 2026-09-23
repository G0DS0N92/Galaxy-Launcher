import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Download,
  Flame,
  Star,
  Layers,
  Sparkles,
  Package,
  Boxes,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  X,
  ChevronRight,
  ChevronDown,
  Filter,
  Eye,
  CheckSquare,
  Square,
  Loader2,
  Check,
  Trash2,
  Info,
  ArrowRightLeft,
  Calendar,
  HardDrive,
  Tag,
  Globe,
  Box
} from 'lucide-react';
import { MarketplaceProject, MarketplaceVersion, Instance, Mod, ResourcePack, ShaderPack } from '../../types';
import { sounds } from '../../services/soundEngine';

interface MarketplaceViewProps {
  instances: Instance[];
  selectedInstance: Instance | null;
  initialType?: 'mod' | 'modpack' | 'resourcepack' | 'shader';
  onShowToast: (toast: any) => void;
  onRefreshInstances?: () => Promise<void>;
  onSelectInstance?: (instance: Instance) => void;
  onNavigateToTab?: (tab: string) => void;
}

function formatCompactNumber(num: number): string {
  if (!num) return '0';
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(0) + 'k';
  return num.toString();
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  instances,
  selectedInstance,
  initialType = 'mod',
  onShowToast,
  onRefreshInstances,
  onSelectInstance,
  onNavigateToTab
}) => {
  const [projectType, setProjectType] = useState<'mod' | 'modpack' | 'resourcepack' | 'shader'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'downloads' | 'relevance' | 'follows' | 'updated'>('downloads');
  const [selectedLoader, setSelectedLoader] = useState<string>('all');
  const [targetInstanceId, setTargetInstanceId] = useState<string>(selectedInstance?.id || (instances[0]?.id || ''));
  const PAGE_SIZE = 24;

  // Target instance installed content tracking
  const [installedMods, setInstalledMods] = useState<Mod[]>([]);
  const [installedResourcePacks, setInstalledResourcePacks] = useState<ResourcePack[]>([]);
  const [installedShaderPacks, setInstalledShaderPacks] = useState<ShaderPack[]>([]);

  // Custom Dropdown states
  const [instanceDropdownOpen, setInstanceDropdownOpen] = useState(false);
  const [loaderDropdownOpen, setLoaderDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const instanceDropdownRef = useRef<HTMLDivElement | null>(null);
  const loaderDropdownRef = useRef<HTMLDivElement | null>(null);
  const sortDropdownRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  // Project detail modal
  const [activeProject, setActiveProject] = useState<MarketplaceProject | null>(null);
  const [projectVersions, setProjectVersions] = useState<MarketplaceVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installingVerId, setInstallingVerId] = useState<string | null>(null);
  const [isRemovingId, setIsRemovingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ filename: string; bytes: number; total: number } | null>(null);

  // Modal version filtering states
  const [modalSearchVersion, setModalSearchVersion] = useState('');
  const [modalLoaderFilter, setModalLoaderFilter] = useState<string>('all');
  const [modalOnlyCompatible, setModalOnlyCompatible] = useState<boolean>(true);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (instanceDropdownRef.current && !instanceDropdownRef.current.contains(e.target as Node)) {
        setInstanceDropdownOpen(false);
      }
      if (loaderDropdownRef.current && !loaderDropdownRef.current.contains(e.target as Node)) {
        setLoaderDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedInstance && !targetInstanceId) {
      setTargetInstanceId(selectedInstance.id);
    }
  }, [selectedInstance]);

  // Load installed content when target instance changes
  useEffect(() => {
    loadInstalledContent(targetInstanceId);
  }, [targetInstanceId]);

  useEffect(() => {
    fetchProjects();
  }, [projectType, searchQuery, sortBy, selectedLoader]);

  useEffect(() => {
    if (window.galaxy?.onDownloadProgress) {
      const unsub = window.galaxy.onDownloadProgress((data) => {
        setDownloadProgress(data);
      });
      return () => {
        unsub();
      };
    }
  }, []);

  const loadInstalledContent = async (instanceId: string) => {
    if (!instanceId || !window.galaxy) return;
    try {
      const [mods, rps, shaders] = await Promise.all([
        window.galaxy.getMods ? window.galaxy.getMods(instanceId) : Promise.resolve([]),
        window.galaxy.getResourcePacks ? window.galaxy.getResourcePacks(instanceId) : Promise.resolve([]),
        window.galaxy.getShaderPacks ? window.galaxy.getShaderPacks(instanceId) : Promise.resolve([])
      ]);
      setInstalledMods(mods || []);
      setInstalledResourcePacks(rps || []);
      setInstalledShaderPacks(shaders || []);
    } catch (err) {
      console.error('Failed to load installed items for instance:', err);
      setInstalledMods([]);
      setInstalledResourcePacks([]);
      setInstalledShaderPacks([]);
    }
  };

  const fetchProjects = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setHasMore(true);
    }
    try {
      if (window.galaxy?.searchMarketplace) {
        const offset = reset ? 0 : projects.length;
        const res = await window.galaxy.searchMarketplace({
          query: searchQuery,
          projectType,
          sortBy,
          loader: selectedLoader === 'all' ? undefined : selectedLoader,
          limit: PAGE_SIZE,
          offset
        });

        if (reset) {
          setProjects(res.projects || []);
        } else {
          setProjects((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newUnique = (res.projects || []).filter((p) => !existingIds.has(p.id));
            return [...prev, ...newUnique];
          });
        }

        const hits = res.totalHits || 0;
        setTotalHits(hits);
        const totalLoaded = reset ? (res.projects?.length || 0) : (projects.length + (res.projects?.length || 0));
        setHasMore(totalLoaded < hits && (res.projects?.length || 0) > 0);
      }
    } catch (err) {
      console.error('Marketplace search failed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchProjects(false);
  };

  // Infinite Scroll Trigger (Grid by Grid)
  const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (loading || loadingMore || !hasMore) return;

    // When scrolled within 350px of the bottom, load the next batch
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 350) {
      handleLoadMore();
    }
  };

  const GENERIC_KEYWORDS = [
    'shaders', 'shader', 'shaderpack', 'resourcepack', 'resourcepacks',
    'texturepack', 'texture', 'textures', 'pack', 'mods', 'mod',
    'edition', 'reloaded', 'reimagined', 'unbound', 'fabric', 'forge', 'neoforge', 'quilt', 'mc'
  ];

  const extractCoreTokens = (str?: string): { fullNorm: string; coreNorm: string; words: string[] } => {
    if (!str) return { fullNorm: '', coreNorm: '', words: [] };
    const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fullNorm = cleanStr(str);

    const words = str
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 0 && !GENERIC_KEYWORDS.includes(w));

    let stripped = str.toLowerCase();
    GENERIC_KEYWORDS.forEach((w) => {
      stripped = stripped.replace(new RegExp('\\b' + w + '\\b', 'gi'), '').replace(new RegExp(w, 'gi'), '');
    });
    const coreNorm = cleanStr(stripped);

    return { fullNorm, coreNorm, words };
  };

  const matchProjectAgainstItem = (
    proj: MarketplaceProject,
    item: { filename: string; name?: string; id?: string }
  ): boolean => {
    const filename = item.filename || '';
    const cleanStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileNorm = cleanStr(filename);
    const fileWithoutExt = cleanStr(filename.replace(/\.(zip|jar)(\.disabled)?$/i, ''));
    const itemNameNorm = cleanStr(item.name || '');
    const itemIdNorm = cleanStr(item.id || '');

    const titleMeta = extractCoreTokens(proj.title);
    const slugMeta = extractCoreTokens(proj.slug);
    const projIdNorm = cleanStr(proj.id);

    // 1. Direct ID/slug equality (for mods that have modId/name in jar)
    if (itemIdNorm && (itemIdNorm === projIdNorm || itemIdNorm === slugMeta.fullNorm || itemIdNorm === titleMeta.fullNorm)) {
      return true;
    }
    if (itemNameNorm && (itemNameNorm === titleMeta.fullNorm || itemNameNorm === slugMeta.fullNorm)) {
      return true;
    }

    // 2. Direct filename equality
    if (
      fileNorm === titleMeta.fullNorm ||
      fileNorm === slugMeta.fullNorm ||
      fileWithoutExt === titleMeta.fullNorm ||
      fileWithoutExt === slugMeta.fullNorm
    ) {
      return true;
    }

    // 3. Full slug or title in filename/item name
    if (slugMeta.fullNorm.length > 2 && (fileNorm.includes(slugMeta.fullNorm) || itemNameNorm.includes(slugMeta.fullNorm))) {
      return true;
    }
    if (titleMeta.fullNorm.length > 2 && (fileNorm.includes(titleMeta.fullNorm) || itemNameNorm.includes(titleMeta.fullNorm))) {
      return true;
    }

    // 4. Core distinctive token (e.g. "bsl" from "BSL Shaders" matching "BSL_v10.1.8.zip")
    if (slugMeta.coreNorm.length >= 2) {
      if (fileNorm.startsWith(slugMeta.coreNorm) || fileWithoutExt.startsWith(slugMeta.coreNorm) || fileNorm.includes(slugMeta.coreNorm)) {
        return true;
      }
    }
    if (titleMeta.coreNorm.length >= 2) {
      if (fileNorm.startsWith(titleMeta.coreNorm) || fileWithoutExt.startsWith(titleMeta.coreNorm) || fileNorm.includes(titleMeta.coreNorm)) {
        return true;
      }
    }

    // 5. Reverse inclusion (file stem in project title/slug)
    if (fileWithoutExt.length >= 3 && (titleMeta.fullNorm.includes(fileWithoutExt) || slugMeta.fullNorm.includes(fileWithoutExt))) {
      return true;
    }

    // 6. Word-level intersection (e.g. all distinct words in title like "bsl" appear in filename)
    if (titleMeta.words.length > 0 && titleMeta.words.every((w) => fileNorm.includes(w) || itemNameNorm.includes(w))) {
      return true;
    }
    if (slugMeta.words.length > 0 && slugMeta.words.every((w) => fileNorm.includes(w) || itemNameNorm.includes(w))) {
      return true;
    }

    return false;
  };

  const isProjectInstalled = (proj: MarketplaceProject): boolean => {
    if (proj.projectType === 'modpack' || projectType === 'modpack') {
      const projTitleNorm = (proj.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const projSlugNorm = (proj.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return instances.some((inst) => {
        const instNameNorm = (inst.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return instNameNorm === projTitleNorm || (projSlugNorm.length > 3 && instNameNorm.includes(projSlugNorm));
      });
    }

    if (proj.projectType === 'resourcepack' || projectType === 'resourcepack') {
      if (!installedResourcePacks || installedResourcePacks.length === 0) return false;
      return installedResourcePacks.some((rp) => matchProjectAgainstItem(proj, rp));
    }

    if (proj.projectType === 'shader' || projectType === 'shader') {
      if (!installedShaderPacks || installedShaderPacks.length === 0) return false;
      return installedShaderPacks.some((sp) => matchProjectAgainstItem(proj, sp));
    }

    // Default: Mod
    if (!installedMods || installedMods.length === 0) return false;
    return installedMods.some((m) => matchProjectAgainstItem(proj, m));
  };

  const isVersionInstalled = (proj: MarketplaceProject, ver: MarketplaceVersion): boolean => {
    if (!targetInstanceId || !ver) return false;
    const verFiles = ver.files || [];
    if (verFiles.length === 0) return false;

    const verFilenames = verFiles.map((f) => (f.filename || '').toLowerCase().trim());
    const verFilenamesNoExt = verFilenames.map((fn) => fn.replace(/\.(jar|zip|mrpack)(\.disabled)?$/i, ''));
    const verNumClean = (ver.versionNumber || '').toLowerCase().replace(/[^a-z0-9.]/g, '');

    if (proj.projectType === 'mod' || projectType === 'mod') {
      if (!installedMods || installedMods.length === 0) return false;
      return installedMods.some((m) => {
        const mFile = (m.filename || '').toLowerCase().trim();
        const mFileNoExt = mFile.replace(/\.(jar)(\.disabled)?$/i, '');
        if (verFilenames.includes(mFile) || verFilenamesNoExt.includes(mFileNoExt)) return true;
        if (matchProjectAgainstItem(proj, m)) {
          const mVerClean = (m.version || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
          if (verNumClean && mVerClean && (verNumClean === mVerClean || mVerClean.includes(verNumClean) || verNumClean.includes(mVerClean))) {
            return true;
          }
        }
        return false;
      });
    }

    if (proj.projectType === 'resourcepack' || projectType === 'resourcepack') {
      if (!installedResourcePacks || installedResourcePacks.length === 0) return false;
      return installedResourcePacks.some((rp) => {
        const rpFile = (rp.filename || '').toLowerCase().trim();
        const rpFileNoExt = rpFile.replace(/\.(zip)(\.disabled)?$/i, '');
        if (verFilenames.includes(rpFile) || verFilenamesNoExt.includes(rpFileNoExt)) return true;
        if (matchProjectAgainstItem(proj, rp)) {
          const rpVerClean = (rp.version || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
          if (verNumClean && rpVerClean && verNumClean === rpVerClean) return true;
        }
        return false;
      });
    }

    if (proj.projectType === 'shader' || projectType === 'shader') {
      if (!installedShaderPacks || installedShaderPacks.length === 0) return false;
      return installedShaderPacks.some((sp) => {
        const spFile = (sp.filename || '').toLowerCase().trim();
        const spFileNoExt = spFile.replace(/\.(zip)(\.disabled)?$/i, '');
        if (verFilenames.includes(spFile) || verFilenamesNoExt.includes(spFileNoExt)) return true;
        if (matchProjectAgainstItem(proj, sp)) {
          const spVerClean = (sp.version || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
          if (verNumClean && spVerClean && verNumClean === spVerClean) return true;
        }
        return false;
      });
    }

    return false;
  };

  const filteredModalVersions = useMemo(() => {
    if (!projectVersions || projectVersions.length === 0) return [];

    return projectVersions.filter((ver) => {
      // 1. Compatibility filter (if active and target instance exists)
      const targetInst = instances.find((i) => i.id === targetInstanceId);
      if (modalOnlyCompatible && targetInst && projectType !== 'modpack') {
        const targetMcVer = targetInst.version;
        const targetLoader = targetInst.loader?.toLowerCase();

        if (targetMcVer && ver.gameVersions && ver.gameVersions.length > 0) {
          if (!ver.gameVersions.includes(targetMcVer)) {
            return false;
          }
        }

        if (targetLoader && targetLoader !== 'vanilla' && ver.loaders && ver.loaders.length > 0) {
          const verLoaders = ver.loaders.map((l) => l.toLowerCase());
          if (!verLoaders.includes(targetLoader)) {
            return false;
          }
        }
      }

      // 2. Specific loader filter dropdown/pills
      if (modalLoaderFilter !== 'all') {
        const verLoaders = (ver.loaders || []).map((l) => l.toLowerCase());
        if (!verLoaders.includes(modalLoaderFilter.toLowerCase())) {
          return false;
        }
      }

      // 3. Search text filter
      if (modalSearchVersion.trim()) {
        const q = modalSearchVersion.toLowerCase().trim();
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
  }, [projectVersions, modalOnlyCompatible, modalLoaderFilter, modalSearchVersion, targetInstanceId, instances, projectType]);

  // Memoized sorted projects with already-installed items prioritized directly at the top
  const displayProjects = useMemo(() => {
    if (!projects || projects.length === 0) return [];
    return [...projects].sort((a, b) => {
      const aInst = isProjectInstalled(a) ? 1 : 0;
      const bInst = isProjectInstalled(b) ? 1 : 0;
      if (aInst !== bInst) {
        return bInst - aInst; // Installed items come first
      }
      return 0; // Maintain original sort order within each group
    });
  }, [projects, installedMods, installedResourcePacks, installedShaderPacks, targetInstanceId, instances, projectType]);



  const handleOpenProject = async (project: MarketplaceProject) => {
    sounds.playClick();
    setActiveProject(project);
    setLoadingVersions(true);
    setModalSearchVersion('');
    setModalLoaderFilter('all');
    setModalOnlyCompatible(true);
    try {
      if (window.galaxy) {
        const [fullDetails, versions] = await Promise.all([
          window.galaxy.getMarketplaceProject(project.id),
          window.galaxy.getMarketplaceVersions(project.id)
        ]);
        if (fullDetails) {
          setActiveProject(fullDetails);
        }
        setProjectVersions(versions || []);
      }
    } catch (err) {
      console.error('Failed to get project versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleInstallItem = async (project: MarketplaceProject, version?: MarketplaceVersion) => {
    if (project.projectType === 'modpack') {
      const firstVer = version || projectVersions[0];
      const primaryFile = firstVer?.files.find((f) => f.primary) || firstVer?.files[0];
      if (!primaryFile) return;

      sounds.playSuccess();
      setInstallingId(project.id);
      if (firstVer?.id) setInstallingVerId(firstVer.id);
      try {
        onShowToast({
          id: Math.random().toString(),
          type: 'info',
          title: `Downloading modpack ${project.title}...`,
          message: 'Extracting configuration and downloading mod assets...'
        });
        const newInstId = await window.galaxy.installModpack(primaryFile.url, project.title);
        if (onRefreshInstances) {
          await onRefreshInstances();
        }
        if (window.galaxy?.listInstances) {
          const updatedList = await window.galaxy.listInstances();
          const createdInst = updatedList.find(
            (i) => i.id === newInstId || i.name.toLowerCase() === project.title.toLowerCase()
          );
          if (createdInst && onSelectInstance) {
            onSelectInstance(createdInst);
          }
        }
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Installed Modpack "${project.title}"!`,
          message: `New instance "${project.title}" is ready in your library.`
        });
        setActiveProject(null);
      } catch (err: any) {
        sounds.playError();
        onShowToast({
          id: Math.random().toString(),
          type: 'error',
          title: 'Failed to install modpack',
          message: err.message
        });
      } finally {
        setInstallingId(null);
        setInstallingVerId(null);
      }
      return;
    }

    if (!targetInstanceId) {
      alert('Please create or select a target instance first.');
      return;
    }

    const targetInst = instances.find((i) => i.id === targetInstanceId);
    if (!targetInst) return;

    // Only prevent install if triggered without a specific version AND already installed
    if (!version && isProjectInstalled(project)) {
      onShowToast({
        id: Math.random().toString(),
        type: 'info',
        title: `${project.title} is already installed`,
        message: `This item is already present in "${targetInst.name}". Open details to select or switch versions.`
      });
      return;
    }

    const isSwitchingVersion = isProjectInstalled(project);

    sounds.playSuccess();
    setInstallingId(project.id);
    if (version?.id) setInstallingVerId(version.id);

    try {
      let verToInstall = version;
      if (!verToInstall) {
        const versions = await window.galaxy.getMarketplaceVersions(project.id, [targetInst.loader], [targetInst.version]);
        verToInstall = versions[0] || (await window.galaxy.getMarketplaceVersions(project.id))[0];
      }

      if (!verToInstall || !verToInstall.files || verToInstall.files.length === 0) {
        throw new Error(`No compatible file found for MC ${targetInst.version} (${targetInst.loader})`);
      }

      const file = verToInstall.files.find((f) => f.primary) || verToInstall.files[0];

      if (project.projectType === 'mod' || projectType === 'mod') {
        const res = await window.galaxy.installMarketplaceModWithDependencies(
          targetInst.id,
          file.url,
          file.filename,
          file.hashes?.sha1,
          verToInstall.dependencies,
          targetInst.loader,
          targetInst.version
        );

        sounds.playSuccess();
        const depCount = res?.dependencyNames?.length || 0;
        const depMsg = depCount > 0
          ? ` (+ ${depCount} required dependencies: ${res.dependencyNames.slice(0, 2).join(', ')}${depCount > 2 ? '...' : ''})`
          : '';

        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: isSwitchingVersion ? `Switched ${project.title}` : `Installed ${project.title}`,
          message: `${verToInstall.name || verToInstall.versionNumber} added to "${targetInst.name}"${depMsg}`
        });
      } else {
        await window.galaxy.installMarketplaceItem(
          targetInst.id,
          (project.projectType || projectType) as any,
          file.url,
          file.filename,
          file.hashes?.sha1
        );

        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: isSwitchingVersion ? `Switched ${project.title}` : `Installed ${project.title}`,
          message: `${verToInstall.name || verToInstall.versionNumber} added to instance "${targetInst.name}"`
        });
      }

      // Refresh installed content list
      await loadInstalledContent(targetInst.id);
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Install Failed',
        message: err.message
      });
    } finally {
      setInstallingId(null);
      setInstallingVerId(null);
      setDownloadProgress(null);
    }
  };

  const handleRemoveItem = async (project: MarketplaceProject) => {
    if (project.projectType === 'modpack' || projectType === 'modpack') {
      const projTitleNorm = (project.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const projSlugNorm = (project.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const targetInstToDelete = instances.find((inst) => {
        const instNameNorm = (inst.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return instNameNorm === projTitleNorm || (projSlugNorm.length > 3 && instNameNorm.includes(projSlugNorm));
      });
      if (!targetInstToDelete) return;
      sounds.playClick();
      setIsRemovingId(project.id);
      try {
        await window.galaxy.deleteInstance(targetInstToDelete.id);
        if (onRefreshInstances) {
          await onRefreshInstances();
        }
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'info',
          title: `Removed Modpack "${project.title}"`,
          message: `Instance "${targetInstToDelete.name}" deleted.`
        });
        await loadInstalledContent(targetInstanceId);
        setActiveProject(null);
      } catch (err: any) {
        sounds.playError();
        onShowToast({
          id: Math.random().toString(),
          type: 'error',
          title: 'Failed to remove modpack',
          message: err.message
        });
      } finally {
        setIsRemovingId(null);
      }
      return;
    }

    if (!targetInstanceId) return;
    const targetInst = instances.find((i) => i.id === targetInstanceId);
    if (!targetInst) return;

    sounds.playClick();
    setIsRemovingId(project.id);

    try {
      if (project.projectType === 'resourcepack' || projectType === 'resourcepack') {
        const match = installedResourcePacks.find((rp) => matchProjectAgainstItem(project, rp));
        if (match && window.galaxy?.deleteResourcePack) {
          await window.galaxy.deleteResourcePack(targetInst.id, match.filename);
        }
      } else if (project.projectType === 'shader' || projectType === 'shader') {
        const match = installedShaderPacks.find((sp) => matchProjectAgainstItem(project, sp));
        if (match && window.galaxy?.deleteShaderPack) {
          await window.galaxy.deleteShaderPack(targetInst.id, match.filename);
        }
      } else {
        // Mod
        const match = installedMods.find((m) => matchProjectAgainstItem(project, m));
        if (match && window.galaxy?.deleteMod) {
          await window.galaxy.deleteMod(targetInst.id, match.filename);
        }
      }

      await loadInstalledContent(targetInst.id);
      sounds.playSuccess();
      onShowToast({
        id: Math.random().toString(),
        type: 'info',
        title: `Removed ${project.title}`,
        message: `Removed from "${targetInst.name}".`
      });
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Failed to remove',
        message: err.message
      });
    } finally {
      setIsRemovingId(null);
    }
  };

  const targetInstObj = instances.find((i) => i.id === targetInstanceId);

  return (
    <div className="flex-1 h-full flex flex-col select-none overflow-hidden bg-galaxy-950/40 relative animate-in fade-in duration-200">
      {/* Top Marketplace Bar */}
      <div className="p-6 border-b border-white/[0.08] bg-galaxy-900/90 backdrop-blur-md space-y-4 relative z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-display font-bold text-white tracking-wide">
                Cosmic Discovery Hub
              </h2>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Modrinth & Community
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Browse, search, and discover Minecraft mods, shaders, resource packs, and modpacks with 1-click install.
            </p>
          </div>

          {/* Target Instance Selector (Custom Downward Dropdown) */}
          {projectType !== 'modpack' && instances.length > 0 && (
            <div className="relative" ref={instanceDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setInstanceDropdownOpen(!instanceDropdownOpen);
                  setLoaderDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className="flex items-center space-x-2 bg-galaxy-950/90 hover:bg-galaxy-950 px-3.5 py-2 rounded-xl border border-white/[0.1] hover:border-purple-500/40 transition-all text-xs"
              >
                <span className="text-slate-400 font-medium">Target Instance:</span>
                <span className="font-semibold text-purple-300 truncate max-w-[180px]">
                  {targetInstObj ? `${targetInstObj.name} (MC ${targetInstObj.version})` : 'Select Instance'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${instanceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {instanceDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 z-50 w-72 rounded-xl bg-[#0e1224] border border-white/[0.18] shadow-2xl shadow-black/90 backdrop-blur-xl overflow-hidden max-h-56 overflow-y-auto p-1.5 space-y-1 ring-1 ring-black/50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {instances.map((i) => {
                    const isSelected = i.id === targetInstanceId;
                    return (
                      <div
                        key={i.id}
                        onClick={() => {
                          sounds.playClick();
                          setTargetInstanceId(i.id);
                          setInstanceDropdownOpen(false);
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all text-xs ${
                          isSelected
                            ? 'bg-purple-600/30 text-white border border-purple-500/40 font-semibold'
                            : 'hover:bg-white/[0.08] text-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5 truncate">
                          <div className="font-semibold truncate">{i.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            MC {i.version} • {i.loader.toUpperCase()}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Type Tabs & Search */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.06] w-full lg:w-auto">
            {[
              { id: 'mod', label: 'Mods', icon: Package },
              { id: 'modpack', label: 'Modpacks', icon: Boxes },
              { id: 'shader', label: 'Shaders', icon: Sparkles },
              { id: 'resourcepack', label: 'Resource Packs', icon: Layers }
            ].map((t) => {
              const Icon = t.icon;
              const isActive = projectType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    sounds.playSwitch();
                    setProjectType(t.id as any);
                  }}
                  className={`flex-1 lg:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-glow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search, Loader & Sort Controls */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64 min-w-[150px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${projectType}s...`}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Loader Filter Dropdown */}
            <div className="relative" ref={loaderDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setLoaderDropdownOpen(!loaderDropdownOpen);
                  setInstanceDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-galaxy-950 border border-white/[0.1] hover:border-white/[0.2] text-xs text-slate-300 flex items-center space-x-1.5 focus:outline-none shrink-0"
              >
                <span className="capitalize">{selectedLoader === 'all' ? 'All Loaders' : selectedLoader}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${loaderDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {loaderDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-50 w-40 rounded-xl bg-[#0e1224] border border-white/[0.18] shadow-2xl shadow-black/90 backdrop-blur-xl overflow-hidden p-1.5 space-y-0.5 ring-1 ring-black/50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {['all', 'fabric', 'forge', 'neoforge', 'quilt'].map((ld) => (
                    <button
                      key={ld}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        setSelectedLoader(ld);
                        setLoaderDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg cursor-pointer text-xs capitalize flex items-center justify-between transition-all ${
                        selectedLoader === ld
                          ? 'bg-purple-600/30 text-white font-semibold'
                          : 'hover:bg-white/[0.08] text-slate-300'
                      }`}
                    >
                      <span>{ld === 'all' ? 'All Loaders' : ld}</span>
                      {selectedLoader === ld && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setSortDropdownOpen(!sortDropdownOpen);
                  setInstanceDropdownOpen(false);
                  setLoaderDropdownOpen(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-galaxy-950 border border-white/[0.1] hover:border-white/[0.2] text-xs text-slate-300 flex items-center space-x-1.5 focus:outline-none shrink-0"
              >
                <span>
                  {sortBy === 'downloads'
                    ? 'Most Downloads'
                    : sortBy === 'relevance'
                    ? 'Relevance'
                    : sortBy === 'follows'
                    ? 'Most Followed'
                    : 'Recently Updated'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 z-50 w-48 rounded-xl bg-[#0e1224] border border-white/[0.18] shadow-2xl shadow-black/90 backdrop-blur-xl overflow-hidden p-1.5 space-y-0.5 ring-1 ring-black/50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {[
                    { id: 'downloads', label: 'Most Downloads' },
                    { id: 'relevance', label: 'Relevance' },
                    { id: 'follows', label: 'Most Followed' },
                    { id: 'updated', label: 'Recently Updated' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sounds.playClick();
                        setSortBy(s.id as any);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between transition-all ${
                        sortBy === s.id
                          ? 'bg-purple-600/30 text-white font-semibold'
                          : 'hover:bg-white/[0.08] text-slate-300'
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortBy === s.id && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid (Infinite Scroll / Grid-by-Grid) */}
      <div
        ref={gridContainerRef}
        onScroll={handleGridScroll}
        className="flex-1 overflow-y-auto p-6 pb-24 custom-scrollbar"
      >
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-xs font-mono">Searching Modrinth galaxy...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center space-y-3 bg-galaxy-900/20">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No results found</div>
            <p className="text-xs text-slate-500">Try adjusting your search query or loader filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayProjects.map((proj) => {
              const isInstalled = isProjectInstalled(proj);
              const isInstalling = installingId === proj.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    handleOpenProject(proj);
                  }}
                  className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-lg overflow-hidden ${
                    isInstalled
                      ? 'border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/30 hover:border-emerald-500/60'
                      : 'border-white/[0.12] bg-[#0c0f1d]/95 hover:bg-[#12162b] hover:border-purple-500/50 hover:shadow-2xl'
                  }`}
                >
                  {/* Subtle top light gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-2xl" />

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-start space-x-3.5">
                      <img
                        src={proj.iconUrl || 'https://minotar.net/avatar/MHF_Chest/48'}
                        alt={proj.title}
                        className="w-12 h-12 rounded-xl bg-black/60 border border-white/[0.12] object-cover flex-shrink-0 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = '0.3';
                        }}
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                            {proj.title}
                          </div>

                          {/* Installed Indicator Badge */}
                          {isInstalled && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold shrink-0">
                              INSTALLED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium truncate">
                          by <span className="text-slate-300">{proj.author}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{proj.description}</p>

                    {/* Category Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {proj.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/[0.08]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs relative z-10 gap-2">
                    {/* Compact Stats */}
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono shrink-0">
                      <span className="flex items-center space-x-1" title={`${proj.downloads.toLocaleString()} downloads`}>
                        <Download className="w-3 h-3 text-cyan-400" />
                        <span>{formatCompactNumber(proj.downloads)}</span>
                      </span>
                      <span className="flex items-center space-x-1" title={`${proj.follows.toLocaleString()} followers`}>
                        <Star className="w-3 h-3 text-amber-400" />
                        <span>{formatCompactNumber(proj.follows)}</span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {/* Details Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playClick();
                          handleOpenProject(proj);
                        }}
                        className="p-1.5 px-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.1] text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer flex items-center justify-center"
                        title="View Details & Versions"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove Button for installed items */}
                      {isInstalled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(proj);
                          }}
                          disabled={isRemovingId === proj.id}
                          className="p-1.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-rose-100 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer flex items-center justify-center"
                          title="Remove from instance"
                        >
                          {isRemovingId === proj.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}

                      {/* Install / Installed Indicator */}
                      {isInstalled ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 px-2 rounded-xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-xs font-semibold flex items-center justify-center shadow-sm cursor-default"
                          title="Installed in target instance"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInstallItem(proj);
                          }}
                          disabled={isInstalling}
                          className="p-1.5 px-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-sm flex items-center justify-center space-x-1 transition-all hover:scale-105 active:scale-95 border border-purple-400/30 cursor-pointer"
                          title="Install into instance"
                        >
                          {isInstalling ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bottom Infinite Loading Spinner */}
            {loadingMore && (
              <div className="col-span-full py-8 flex flex-col items-center justify-center space-y-2.5 animate-in fade-in duration-200">
                <div className="p-3 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center space-x-3 shadow-glow-sm">
                  <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                  <span className="text-xs font-mono font-medium text-purple-300">
                    Loading more {projectType}s from Modrinth galaxy...
                  </span>
                </div>
              </div>
            )}

            {/* End of results indicator */}
            {!hasMore && !loading && projects.length > 0 && (
              <div className="col-span-full py-8 text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>All {projects.length} {projectType}s loaded</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {activeProject && (
        <div
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-4xl rounded-2xl bg-galaxy-900/95 border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] ring-1 ring-white/10">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-galaxy-950/90 flex items-start justify-between gap-4">
              <div className="flex items-start space-x-4 min-w-0">
                <img
                  src={activeProject.iconUrl || 'https://minotar.net/avatar/MHF_Chest/64'}
                  alt={activeProject.title}
                  className="w-16 h-16 rounded-2xl bg-black/50 border border-white/[0.12] object-cover shrink-0 shadow-lg"
                />
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-display font-bold text-white tracking-wide truncate">
                      {activeProject.title}
                    </h3>
                    {isProjectInstalled(activeProject) && (
                      <span className="flex items-center space-x-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Installed</span>
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.1]">
                      {activeProject.projectType || projectType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed max-w-2xl">
                    {activeProject.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400 pt-0.5">
                    <span>{activeProject.downloads.toLocaleString()} downloads</span>
                    <span>•</span>
                    <span>{activeProject.follows.toLocaleString()} followers</span>
                    {activeProject.categories && activeProject.categories.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400 capitalize">
                          {activeProject.categories.slice(0, 3).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    const typeSlug =
                      activeProject.projectType === 'resourcepack'
                        ? 'resourcepack'
                        : activeProject.projectType === 'shader'
                        ? 'shader'
                        : activeProject.projectType === 'modpack'
                        ? 'modpack'
                        : 'mod';
                    const targetUrl = `https://modrinth.com/${typeSlug}/${activeProject.slug || activeProject.id}`;
                    window.galaxy?.openExternal?.(targetUrl);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Open on Modrinth in Web Browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Web Page</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveProject(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar">
              {/* Screenshots Gallery if available */}
              {activeProject.gallery && activeProject.gallery.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                    <span>Screenshots</span>
                    <span className="text-[10px] text-slate-400 font-mono">({activeProject.gallery.length})</span>
                  </div>
                  <div className="flex space-x-3 overflow-x-auto pb-2 custom-scrollbar">
                    {activeProject.gallery.map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`Screenshot ${idx + 1}`}
                        className="h-32 sm:h-36 rounded-xl border border-white/[0.1] object-cover flex-shrink-0 hover:border-purple-500/40 transition-all shadow-md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Install Versions Table */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-slate-200">Available Releases & Versions</h4>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                      {filteredModalVersions.length} of {projectVersions.length}
                    </span>
                  </div>
                  {projectType !== 'modpack' && (
                    <span className="text-xs text-purple-300 font-mono">
                      Target: <span className="font-semibold text-white">{targetInstObj?.name || 'Select Instance'}</span>
                      {targetInstObj?.version ? ` (MC ${targetInstObj.version} • ${targetInstObj.loader?.toUpperCase()})` : ''}
                    </span>
                  )}
                </div>

                {/* Filter Toolbar inside Modal */}
                <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-galaxy-950/70 border border-white/[0.08]">
                  {/* Search box for versions */}
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={modalSearchVersion}
                      onChange={(e) => setModalSearchVersion(e.target.value)}
                      placeholder="Filter version, MC version (e.g. 1.20.1, 0.5.8)..."
                      className="w-full bg-black/40 border border-white/[0.1] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    {modalSearchVersion && (
                      <button
                        type="button"
                        onClick={() => setModalSearchVersion('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Compatible Only Toggle */}
                  {targetInstObj && projectType !== 'modpack' && (
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playSwitch();
                        setModalOnlyCompatible(!modalOnlyCompatible);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border ${
                        modalOnlyCompatible
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200 shadow-sm'
                          : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckSquare className={`w-3.5 h-3.5 ${modalOnlyCompatible ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>Compatible Only ({targetInstObj.version})</span>
                    </button>
                  )}

                  {/* Loader Filter Pills */}
                  <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded-xl border border-white/[0.06] overflow-x-auto">
                    {['all', 'fabric', 'forge', 'neoforge', 'quilt'].map((loader) => (
                      <button
                        key={loader}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setModalLoaderFilter(loader);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition-all ${
                          modalLoaderFilter === loader
                            ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40 font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        {loader === 'all' ? 'All Loaders' : loader}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Versions List */}
                {loadingVersions ? (
                  <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-400" />
                    <span>Fetching version metadata from Modrinth...</span>
                  </div>
                ) : projectVersions.length === 0 ? (
                  <div className="p-8 rounded-xl bg-black/30 border border-white/[0.06] text-center text-xs text-slate-400">
                    No downloadable files found for this project.
                  </div>
                ) : filteredModalVersions.length === 0 ? (
                  <div className="p-8 rounded-xl bg-black/30 border border-white/[0.06] text-center space-y-3">
                    <div className="text-xs text-slate-400">
                      No versions match your current filters ({modalSearchVersion ? `"${modalSearchVersion}"` : ''}{modalOnlyCompatible ? ` compatible with MC ${targetInstObj?.version}` : ''}).
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalOnlyCompatible(false);
                        setModalSearchVersion('');
                        setModalLoaderFilter('all');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all"
                    >
                      Show All Versions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                    {filteredModalVersions.map((ver) => {
                      const primaryFile = ver.files.find((f) => f.primary) || ver.files[0];
                      const isInstalled = isVersionInstalled(activeProject, ver);
                      const isInstalling = installingVerId === ver.id || (installingId === activeProject.id && !installingVerId);
                      const isBeta = (ver.name || '').toLowerCase().includes('beta') || (ver.versionNumber || '').toLowerCase().includes('beta');
                      const isAlpha = (ver.name || '').toLowerCase().includes('alpha') || (ver.versionNumber || '').toLowerCase().includes('alpha');

                      const formattedDate = ver.datePublished
                        ? new Date(ver.datePublished).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : '';

                      return (
                        <div
                          key={ver.id}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isInstalled
                              ? 'bg-emerald-950/20 border-emerald-500/30 shadow-sm'
                              : 'bg-galaxy-950/60 hover:bg-galaxy-950/90 border-white/[0.08] hover:border-white/[0.16]'
                          }`}
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-200 text-xs sm:text-sm">
                                {ver.name || ver.versionNumber}
                              </span>
                              {ver.versionNumber && ver.name !== ver.versionNumber && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                                  v{ver.versionNumber}
                                </span>
                              )}
                              {isBeta ? (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                  Beta
                                </span>
                              ) : isAlpha ? (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                                  Alpha
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                  Release
                                </span>
                              )}
                              {formattedDate && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  {formattedDate}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono text-slate-400">
                              <span className="text-cyan-300">
                                MC {ver.gameVersions.slice(0, 4).join(', ')}{ver.gameVersions.length > 4 ? ` +${ver.gameVersions.length - 4}` : ''}
                              </span>
                              <span>•</span>
                              <span className="uppercase text-purple-300">
                                {ver.loaders.join(', ')}
                              </span>
                              {primaryFile?.size ? (
                                <>
                                  <span>•</span>
                                  <span>{(primaryFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                </>
                              ) : null}
                              {primaryFile?.filename && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400 truncate max-w-[200px]" title={primaryFile.filename}>
                                    {primaryFile.filename}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center justify-end">
                            {isInstalled ? (
                              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center space-x-1.5 shadow-sm shadow-emerald-950">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Installed</span>
                              </div>
                            ) : isInstalling ? (
                              <div className="px-4 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 font-semibold text-xs flex items-center space-x-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                                <span>Installing...</span>
                              </div>
                            ) : isProjectInstalled(activeProject) ? (
                              <button
                                type="button"
                                onClick={() => handleInstallItem(activeProject, ver)}
                                disabled={installingId !== null}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md hover:shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
                                title="Switch installed mod to this version"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>Switch Version</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleInstallItem(activeProject, ver)}
                                disabled={installingId !== null}
                                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-glow-sm shadow-purple-950 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Install</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
