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
  Calendar,
  HardDrive,
  Tag,
  Globe,
  Box,
  Compass,
  Zap,
  Sword,
  SlidersHorizontal,
  FolderOpen,
  Wrench
} from 'lucide-react';
import { MarketplaceProject, MarketplaceVersion, Instance, Mod, ResourcePack, ShaderPack } from '../../types';
import { sounds } from '../../services/soundEngine';
import bgPortalHero from '../../assets/instance_backgrounds/bg_portal_hero.jpg';
import bgNether from '../../assets/instance_backgrounds/bg_nether.jpg';
import bgSunset from '../../assets/instance_backgrounds/bg_sunset.jpg';
import bgGalaxy from '../../assets/instance_backgrounds/bg_galaxy.jpg';
import bgVanilla from '../../assets/instance_backgrounds/bg_vanilla.jpg';

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
  const [projectType, setProjectType] = useState<'all' | 'mod' | 'modpack' | 'resourcepack' | 'shader'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [trendingProjects, setTrendingProjects] = useState<MarketplaceProject[]>([]);
  const [featuredModpacks, setFeaturedModpacks] = useState<MarketplaceProject[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'downloads' | 'relevance' | 'follows' | 'updated'>('downloads');
  const [selectedLoader, setSelectedLoader] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMcVersion, setSelectedMcVersion] = useState<string>('all');
  const [targetInstanceId, setTargetInstanceId] = useState<string>(selectedInstance?.id || instances[0]?.id || '');
  const PAGE_SIZE = 24;

  // Target instance installed content tracking
  const [installedMods, setInstalledMods] = useState<Mod[]>([]);
  const [installedResourcePacks, setInstalledResourcePacks] = useState<ResourcePack[]>([]);
  const [installedShaderPacks, setInstalledShaderPacks] = useState<ShaderPack[]>([]);

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

  useEffect(() => {
    if (selectedInstance && !targetInstanceId) {
      setTargetInstanceId(selectedInstance.id);
    }
  }, [selectedInstance]);

  // Load installed content when target instance changes
  useEffect(() => {
    loadInstalledContent(targetInstanceId);
  }, [targetInstanceId]);

  // Initial load for Trending and Featured
  useEffect(() => {
    loadTrendingAndFeatured();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [projectType, searchQuery, sortBy, selectedLoader, selectedCategory]);

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

  const loadTrendingAndFeatured = async () => {
    if (!window.galaxy?.searchMarketplace) return;
    try {
      // Fetch top 5 weekly trending mods
      const trendRes = await window.galaxy.searchMarketplace({
        query: '',
        projectType: 'mod',
        sortBy: 'downloads',
        limit: 5,
        offset: 0
      });
      if (trendRes.projects) setTrendingProjects(trendRes.projects);

      // Fetch featured modpacks
      const packRes = await window.galaxy.searchMarketplace({
        query: '',
        projectType: 'modpack',
        sortBy: 'downloads',
        limit: 5,
        offset: 0
      });
      if (packRes.projects) setFeaturedModpacks(packRes.projects);
    } catch (e) {
      console.warn('Could not load trending:', e);
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
          projectType: projectType === 'all' ? undefined : (projectType as any),
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
        const totalLoaded = reset ? res.projects?.length || 0 : projects.length + (res.projects?.length || 0);
        setHasMore(totalLoaded < hits && (res.projects?.length || 0) > 0);
      }
    } catch (err) {
      console.error('Marketplace search failed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleOpenProjectDetails = async (proj: MarketplaceProject) => {
    sounds.playClick();
    setActiveProject(proj);
    setLoadingVersions(true);
    setProjectVersions([]);
    setModalSearchVersion('');
    setModalLoaderFilter('all');
    setModalOnlyCompatible(true);

    try {
      if (window.galaxy?.getMarketplaceVersions) {
        const targetInst = instances.find((i) => i.id === targetInstanceId);
        const versions = await window.galaxy.getMarketplaceVersions(
          proj.id,
          targetInst?.loader ? [targetInst.loader] : undefined,
          targetInst?.version ? [targetInst.version] : undefined
        );
        setProjectVersions(versions || []);
      }
    } catch (err) {
      console.error('Failed to load versions for project:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleQuickInstall = async (proj: MarketplaceProject, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    if (!targetInstanceId) {
      onShowToast({
        type: 'warning',
        title: 'No Target Instance',
        message: 'Please create or select an instance first.'
      });
      return;
    }

    setInstallingId(proj.id);
    try {
      const targetInst = instances.find((i) => i.id === targetInstanceId);
      const versions = await window.galaxy.getMarketplaceVersions(
        proj.id,
        targetInst?.loader ? [targetInst.loader] : undefined,
        targetInst?.version ? [targetInst.version] : undefined
      );

      if (versions && versions.length > 0 && versions[0].files[0]) {
        const bestVer = versions[0];
        const file = bestVer.files[0];
        await window.galaxy.installMarketplaceItem(
          targetInstanceId,
          (proj.projectType === 'modpack' ? 'mod' : proj.projectType) as 'mod' | 'resourcepack' | 'shader',
          file.url,
          file.filename,
          file.hashes?.sha1
        );
        sounds.playSuccess();
        onShowToast({
          type: 'success',
          title: 'Installed Successfully!',
          message: `${proj.title} installed to ${targetInst?.name || 'instance'}.`
        });
        loadInstalledContent(targetInstanceId);
      } else {
        onShowToast({
          type: 'error',
          title: 'No Compatible Version Found',
          message: `No compatible version found for Minecraft ${targetInst?.version || ''}.`
        });
      }
    } catch (err: any) {
      onShowToast({
        type: 'error',
        title: 'Install Failed',
        message: err.message || 'Could not download mod.'
      });
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="min-h-full p-6 space-y-6 select-none max-w-7xl mx-auto">
      {/* 1. PANORAMIC DISCOVER HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-56 md:h-64 group">
        <img
          src={bgPortalHero}
          alt="Discover Banner"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-galaxy-950/95 via-galaxy-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950/90 via-transparent to-transparent" />

        {/* Top Right Quote */}
        <div className="absolute top-5 right-6 text-right hidden sm:block">
          <p className="text-xs font-display font-medium text-slate-300/80 italic tracking-wider">
            "New Worlds New Possibilities"
          </p>
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex flex-col justify-between p-8 z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
              Discover <span className="text-gradient-accent">Amazing Content</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 max-w-xl">
              Find, install and enhance your Minecraft experience with the best mods, modpacks, shaders and more.
            </p>
          </div>

          {/* 4 Stats Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <span>50,000+ Mods & Addons</span>
            </div>
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
              <Package className="w-4 h-4 text-cyan-400" />
              <span>2,500+ Modpacks</span>
            </div>
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>1,000+ Shaders</span>
            </div>
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200 hidden md:flex">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Community Driven (Always Updated)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY NAVIGATION PILLS BAR */}
      <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: 'all', label: 'All', icon: Layers },
          { id: 'mod', label: 'Mods', icon: Boxes },
          { id: 'modpack', label: 'Modpacks', icon: Package },
          { id: 'shader', label: 'Shaders', icon: Sparkles },
          { id: 'resourcepack', label: 'Resource Packs', icon: Tag },
          { id: 'datapack', label: 'Data Packs', icon: Tag },
          { id: 'world', label: 'Worlds', icon: Globe },
          { id: 'tool', label: 'Tools', icon: Wrench }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = projectType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playSwitch();
                setProjectType(tab.id as any);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow-sm'
                  : 'bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. 2-COLUMN DISCOVERY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT MAIN AREA (~75% -> 9 cols) */}
        <div className="lg:col-span-9 space-y-7">
          {/* 3.1 Trending This Week */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-display font-bold text-white tracking-wide">
                  Trending This Week
                </h2>
              </div>
              <button
                onClick={() => setSortBy('downloads')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 group"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {trendingProjects.map((proj, idx) => (
                <div
                  key={proj.id}
                  onClick={() => handleOpenProjectDetails(proj)}
                  className="relative rounded-2xl overflow-hidden bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-lg bg-galaxy-950/80 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-400 flex items-center space-x-1 shadow-md">
                    <Flame className="w-3 h-3 fill-amber-400" />
                    <span>#{idx + 1}</span>
                  </div>

                  {/* Thumbnail Banner */}
                  <div className="relative h-24 overflow-hidden bg-slate-900/60 flex items-center justify-center">
                    {proj.iconUrl ? (
                      <img
                        src={proj.iconUrl}
                        alt={proj.title}
                        className="w-14 h-14 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <Boxes className="w-10 h-10 text-slate-500" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display font-bold text-white text-xs truncate">
                        {proj.title}
                      </h3>
                      <p className="text-[10.5px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                        {proj.description}
                      </p>

                      <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                        <span>👤 {formatCompactNumber(proj.downloads)}</span>
                        <span>★ 4.8</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={(e) => handleQuickInstall(proj, e)}
                        disabled={installingId === proj.id}
                        className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm flex items-center justify-center space-x-1 transition-all"
                      >
                        {installingId === proj.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>Install</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3.2 Browse by Category (5 Scenic Cards) */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-display font-bold text-white tracking-wide">
                Browse by Category
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { title: 'Performance Mods', sub: 'Make game smoother', bg: bgVanilla, tag: 'optimization' },
                { title: 'Visual & Shaders', sub: 'Stunning graphics', bg: bgSunset, tag: 'graphics' },
                { title: 'Modpacks', sub: 'Complete experiences', bg: bgNether, tag: 'modpack' },
                { title: 'Adventure Mods', sub: 'New dimensions', bg: bgPortalHero, tag: 'adventure' },
                { title: 'Utility Mods', sub: 'Useful tools', bg: bgGalaxy, tag: 'utility' }
              ].map((cat, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    sounds.playClick();
                    setSelectedCategory(cat.tag);
                  }}
                  className="relative rounded-2xl overflow-hidden h-28 border border-white/[0.08] hover:border-indigo-500/50 cursor-pointer group flex flex-col justify-end p-3"
                >
                  <img
                    src={cat.bg}
                    alt={cat.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950 via-galaxy-950/60 to-transparent" />
                  <div className="relative z-10">
                    <h4 className="font-display font-bold text-white text-xs truncate">
                      {cat.title}
                    </h4>
                    <p className="text-[10px] text-slate-300/80 truncate">
                      {cat.sub} →
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3.3 Featured Modpacks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-display font-bold text-white tracking-wide">
                  Featured Modpacks
                </h2>
              </div>
              <button
                onClick={() => setProjectType('modpack')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1 group"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {featuredModpacks.map((pack, idx) => {
                const badges = ['Popular', 'Optimized', 'New', 'Hardcore', 'Skyblock'];
                const badge = badges[idx % badges.length];
                return (
                  <div
                    key={pack.id}
                    onClick={() => handleOpenProjectDetails(pack)}
                    className="relative rounded-2xl overflow-hidden bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    {/* Badge */}
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-indigo-600/80 backdrop-blur-md border border-indigo-400/30 text-[9.5px] font-bold text-white flex items-center space-x-1 shadow-md">
                      <span>★ {badge}</span>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative h-24 overflow-hidden bg-slate-900/60 flex items-center justify-center">
                      {pack.iconUrl ? (
                        <img
                          src={pack.iconUrl}
                          alt={pack.title}
                          className="w-14 h-14 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-slate-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-bold text-white text-xs truncate">
                          {pack.title}
                        </h3>
                        <p className="text-[10.5px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                          {pack.description}
                        </p>

                        <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                          <span>👤 {formatCompactNumber(pack.downloads)}</span>
                          <span>★ 4.7</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleQuickInstall(pack, e)}
                        disabled={installingId === pack.id}
                        className="w-full py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm flex items-center justify-center space-x-1 transition-all"
                      >
                        {installingId === pack.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Download className="w-3 h-3" />
                            <span>Install</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT FILTERS SIDEBAR (~25% -> 3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="rounded-3xl bg-galaxy-950/70 backdrop-blur-2xl border border-white/[0.1] p-5 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <h3 className="font-display font-bold text-white text-sm">
                  Filters
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedLoader('all');
                  setSelectedCategory('all');
                  setProjectType('all');
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Reset
              </button>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Content Type
              </span>
              <div className="space-y-1.5 text-xs text-slate-300">
                {[
                  { id: 'mod', label: 'Mods', count: '24,581' },
                  { id: 'modpack', label: 'Modpacks', count: '2,541' },
                  { id: 'shader', label: 'Shaders', count: '1,032' },
                  { id: 'resourcepack', label: 'Resource Packs', count: '6,782' }
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => setProjectType(item.id as any)}
                    className="flex items-center justify-between cursor-pointer hover:text-white p-1 rounded-lg hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={projectType === item.id}
                        onChange={() => {}}
                        className="rounded border-white/20 bg-galaxy-900 text-indigo-500 focus:ring-0"
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.count}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minecraft Version Dropdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Minecraft Version
              </span>
              <select
                value={selectedMcVersion}
                onChange={(e) => setSelectedMcVersion(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all" className="bg-galaxy-950">1.21.1 (Latest)</option>
                <option value="1.21.0" className="bg-galaxy-950">1.21.0</option>
                <option value="1.20.4" className="bg-galaxy-950">1.20.4</option>
                <option value="1.20.1" className="bg-galaxy-950">1.20.1</option>
                <option value="1.19.2" className="bg-galaxy-950">1.19.2</option>
                <option value="1.16.5" className="bg-galaxy-950">1.16.5</option>
              </select>
            </div>

            {/* Mod Loader Checkboxes */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Loader
              </span>
              <div className="space-y-1.5 text-xs text-slate-300">
                {['fabric', 'neoforge', 'forge', 'quilt'].map((loader) => (
                  <label
                    key={loader}
                    onClick={() =>
                      setSelectedLoader(selectedLoader === loader ? 'all' : loader)
                    }
                    className="flex items-center space-x-2 cursor-pointer hover:text-white p-1 rounded-lg hover:bg-white/[0.04]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLoader === loader}
                      onChange={() => {}}
                      className="rounded border-white/20 bg-galaxy-900 text-indigo-500 focus:ring-0"
                    />
                    <span className="capitalize">{loader}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Categories
              </span>
              <div className="space-y-1 text-xs text-slate-300 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                {[
                  { name: 'Performance', count: '3,421' },
                  { name: 'Adventure', count: '4,218' },
                  { name: 'Technology', count: '2,906' },
                  { name: 'Magic', count: '2,134' },
                  { name: 'Exploration', count: '1,987' },
                  { name: 'Building', count: '2,451' },
                  { name: 'Multiplayer', count: '1,876' },
                  { name: 'Survival', count: '2,319' },
                  { name: 'RPG', count: '1,202' },
                  { name: 'QoL', count: '3,104' }
                ].map((c) => (
                  <div
                    key={c.name}
                    onClick={() => setSelectedCategory(c.name.toLowerCase())}
                    className="flex items-center justify-between p-1 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      {activeProject && (
        <div className="fixed inset-0 bg-galaxy-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-smooth-in">
          <div className="w-full max-w-2xl bg-galaxy-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                {activeProject.iconUrl && (
                  <img
                    src={activeProject.iconUrl}
                    alt={activeProject.title}
                    className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-white/10"
                  />
                )}
                <div>
                  <h2 className="text-xl font-display font-extrabold text-white">
                    {activeProject.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    by {activeProject.author || 'Modrinth Creator'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveProject(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.08]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activeProject.description}
            </p>

            {/* Versions List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Available Versions
              </h4>
              {loadingVersions ? (
                <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching compatible versions...</span>
                </div>
              ) : projectVersions.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {projectVersions.map((ver) => (
                    <div
                      key={ver.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">
                          {ver.name || ver.versionNumber}
                        </div>
                        <div className="text-[10.5px] text-slate-400 space-x-2">
                          <span>MC: {ver.gameVersions?.join(', ')}</span>
                          <span>•</span>
                          <span className="uppercase">{ver.loaders?.join(', ')}</span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (!targetInstanceId || !ver.files[0]) return;
                          setInstallingVerId(ver.id);
                          try {
                            const file = ver.files[0];
                            await window.galaxy.installMarketplaceItem(
                              targetInstanceId,
                              (activeProject.projectType === 'modpack' ? 'mod' : activeProject.projectType) as 'mod' | 'resourcepack' | 'shader',
                              file.url,
                              file.filename,
                              file.hashes?.sha1
                            );
                            sounds.playSuccess();
                            onShowToast({
                              type: 'success',
                              title: 'Version Installed!',
                              message: `Installed ${ver.name} successfully.`
                            });
                          } catch (e: any) {
                            onShowToast({
                              type: 'error',
                              title: 'Install Failed',
                              message: e.message
                            });
                          } finally {
                            setInstallingVerId(null);
                          }
                        }}
                        disabled={installingVerId === ver.id}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                      >
                        {installingVerId === ver.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Install'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No versions matching current instance loader/version.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
