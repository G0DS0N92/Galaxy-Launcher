import React, { useState, useEffect, useMemo } from 'react';
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
  Wrench,
  ArrowRight,
  Shield,
  Clock,
  Puzzle,
  Gamepad2,
  FileCode,
  Image as ImageIcon,
  Users,
  Trophy
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
  if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
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
  const [projectType, setProjectType] = useState<'all' | 'mod' | 'modpack' | 'resourcepack' | 'shader' | 'datapack' | 'world' | 'tool'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [trendingProjects, setTrendingProjects] = useState<MarketplaceProject[]>([]);
  const [featuredModpacks, setFeaturedModpacks] = useState<MarketplaceProject[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'downloads' | 'relevance' | 'follows' | 'updated'>('downloads');
  const [selectedLoader, setSelectedLoader] = useState<string>('fabric');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMcVersion, setSelectedMcVersion] = useState<string>('1.21.1');
  const [targetInstanceId, setTargetInstanceId] = useState<string>(selectedInstance?.id || instances[0]?.id || '');

  // Content type filters in sidebar
  const [contentTypeFilters, setContentTypeFilters] = useState({
    mods: true,
    modpacks: false,
    shaders: false,
    resourcepacks: false,
    datapacks: false,
    worlds: false,
    tools: false
  });

  // Loader filters in sidebar
  const [loaderFilters, setLoaderFilters] = useState({
    fabric: true,
    neoforge: false,
    forge: false,
    quilt: false
  });

  // Target instance installed content tracking
  const [installedMods, setInstalledMods] = useState<Mod[]>([]);
  const [installedResourcePacks, setInstalledResourcePacks] = useState<ResourcePack[]>([]);
  const [installedShaderPacks, setInstalledShaderPacks] = useState<ShaderPack[]>([]);

  // Project detail modal
  const [activeProject, setActiveProject] = useState<MarketplaceProject | null>(null);
  const [projectVersions, setProjectVersions] = useState<MarketplaceVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

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
    loadTrendingAndFeatured();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [projectType, searchQuery, sortBy, selectedLoader, selectedCategory]);

  const loadInstalledContent = async (instanceId: string) => {
    if (!instanceId || !window.galaxy) return;
    try {
      const targetInst = instances.find((i) => i.id === instanceId);
      if (!targetInst) return;

      const [mods, rps, sps] = await Promise.all([
        window.galaxy.getMods ? window.galaxy.getMods(targetInst.id) : Promise.resolve([]),
        window.galaxy.getResourcePacks ? window.galaxy.getResourcePacks(targetInst.id) : Promise.resolve([]),
        window.galaxy.getShaderPacks ? window.galaxy.getShaderPacks(targetInst.id) : Promise.resolve([])
      ]);

      setInstalledMods(mods || []);
      setInstalledResourcePacks(rps || []);
      setInstalledShaderPacks(sps || []);
    } catch (err) {
      console.error('Failed to load installed content:', err);
    }
  };

  const loadTrendingAndFeatured = async () => {
    try {
      if (!window.galaxy?.searchMarketplace) return;

      const [trendingRes, featuredRes] = await Promise.all([
        window.galaxy.searchMarketplace({
          projectType: 'mod',
          sortBy: 'downloads',
          limit: 5
        }),
        window.galaxy.searchMarketplace({
          projectType: 'modpack',
          sortBy: 'downloads',
          limit: 5
        })
      ]);

      if (trendingRes?.projects) setTrendingProjects(trendingRes.projects.slice(0, 5));
      if (featuredRes?.projects) setFeaturedModpacks(featuredRes.projects.slice(0, 5));
    } catch (err) {
      console.error('Failed to load trending/featured:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      if (!window.galaxy?.searchMarketplace) return;

      const effectiveType = projectType === 'all' ? undefined : (projectType as any);
      const res = await window.galaxy.searchMarketplace({
        query: searchQuery,
        projectType: effectiveType,
        sortBy: sortBy,
        loader: selectedLoader === 'all' ? undefined : selectedLoader,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        gameVersion: selectedMcVersion === 'all' ? undefined : selectedMcVersion,
        limit: 20
      });

      if (res?.projects) {
        setProjects(res.projects);
        setTotalHits(res.totalHits || res.projects.length);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProjectModal = async (proj: MarketplaceProject) => {
    sounds.playClick();
    setActiveProject(proj);
    try {
      setLoadingVersions(true);
      if (window.galaxy?.getMarketplaceVersions) {
        const vers = await window.galaxy.getMarketplaceVersions(proj.id);
        setProjectVersions(vers || []);
      }
    } catch (err) {
      console.error('Failed to load project versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleQuickInstall = async (proj: MarketplaceProject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playLaunch();
    const targetInst = instances.find((i) => i.id === targetInstanceId) || selectedInstance || instances[0];
    if (!targetInst) {
      onShowToast({ type: 'warning', title: 'No instance selected', message: 'Please create or select an instance first.' });
      return;
    }

    try {
      setInstallingId(proj.id);
      let vers = projectVersions;
      if (activeProject?.id !== proj.id && window.galaxy?.getMarketplaceVersions) {
        vers = await window.galaxy.getMarketplaceVersions(proj.id);
      }

      if (!vers || vers.length === 0) {
        onShowToast({ type: 'error', title: 'Install failed', message: 'No downloadable versions found for this project.' });
        return;
      }

      const primaryVer = vers[0];
      const primaryFile = primaryVer.files.find((f) => f.primary) || primaryVer.files[0];
      if (!primaryFile) return;

      if ((proj.projectType === 'mod' || proj.projectType === 'resourcepack' || proj.projectType === 'shader') && window.galaxy?.installMarketplaceItem) {
        await window.galaxy.installMarketplaceItem(targetInst.id, proj.projectType, primaryFile.url, primaryFile.filename);
      }

      sounds.playSuccess();
      onShowToast({ type: 'success', title: 'Installed successfully', message: `${proj.title} has been added to ${targetInst.name}.` });
      await loadInstalledContent(targetInst.id);
    } catch (err: any) {
      onShowToast({ type: 'error', title: 'Installation error', message: err.message || 'Failed to download or install package.' });
    } finally {
      setInstallingId(null);
    }
  };

  // Mock static fallback items for Trending & Featured matching reference designs
  const staticTrending = [
    { rank: '#1', title: 'Sodium', subtitle: 'Performance Mod', tags: ['Optimization', 'Client'], downloads: '12.4M', rating: '4.8', bannerBg: bgNether },
    { rank: '#2', title: 'Iris Shaders', subtitle: 'Visual Enhancements', tags: ['Graphics', 'Shaders'], downloads: '8.2M', rating: '4.7', bannerBg: bgSunset },
    { rank: '#3', title: 'Better End', subtitle: 'World Generation', tags: ['Adventure', 'World Gen'], downloads: '5.1M', rating: '4.8', bannerBg: bgPortalHero },
    { rank: '#4', title: 'Cobblemon', subtitle: 'Modpack', tags: ['Adventure', 'Multiplayer'], downloads: '4.3M', rating: '4.6', bannerBg: bgGalaxy },
    { rank: '#5', title: 'Create', subtitle: 'Technology', tags: ['Technology', 'Redstone'], downloads: '3.9M', rating: '4.7', bannerBg: bgVanilla },
  ];

  const staticCategories = [
    { title: 'Performance Mods', desc: 'Make your game smoother', icon: Zap, bg: bgNether },
    { title: 'Visual & Shaders', desc: 'Stunning graphics', icon: ImageIcon, bg: bgSunset },
    { title: 'Modpacks', desc: 'Complete experiences', icon: Boxes, bg: bgPortalHero },
    { title: 'Adventure Mods', desc: 'New dimensions', icon: Sword, bg: bgGalaxy },
    { title: 'Utility Mods', desc: 'Useful tools', icon: Wrench, bg: bgVanilla },
  ];

  const staticModpacks = [
    { tag: '🏆 Popular', title: 'All the Mods 9', downloads: '1.8M', rating: '4.7', bg: bgSunset },
    { tag: '⚡ Optimized', title: 'Fabulously Optimized', downloads: '1.2M', rating: '4.6', bg: bgVanilla },
    { tag: '✨ New', title: 'Essential', downloads: '834K', rating: '4.8', bg: bgPortalHero },
    { tag: '💀 Hardcore', title: 'RLCraft', downloads: '2.1M', rating: '4.5', bg: bgNether },
    { tag: '☁ Skyblock', title: 'ATM Volcano Block', downloads: '1.6M', rating: '4.6', bg: bgGalaxy },
  ];

  return (
    <div className="min-h-full p-6 space-y-6 select-none max-w-[1600px] mx-auto">
      {/* 1. HERO HEADER BANNER (Matching standard banner dimensions) */}
      <div className="w-full relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-[200px] sm:h-[215px] lg:h-[225px] xl:h-[235px] group shrink-0">
        <img
          src={bgPortalHero}
          alt="Discover Banner"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a18]/95 via-[#070a18]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a18]/90 via-transparent to-transparent" />

        {/* Top Right Quote */}
        <div className="absolute top-6 right-8 text-right hidden sm:block">
          <p className="text-xs font-display font-medium text-slate-300/80 italic tracking-wider">
            " New Worlds<br />New Possibilities "
          </p>
        </div>

        <div className="relative h-full flex flex-col justify-between p-8 z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight drop-shadow-md flex items-center gap-2">
              <span>Discover</span>
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Amazing
              </span>
              <span>Content</span>
            </h1>
            <p className="text-sm text-slate-300 font-medium mt-1.5 max-w-xl">
              Find, install and enhance your Minecraft experience with the best mods, modpacks, shaders and more.
            </p>
          </div>

          {/* 4 Stat Pills inside the banner */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
              <Box className="w-4 h-4 text-purple-400" />
              <div className="text-xs">
                <span className="font-extrabold text-white">50,000+ </span>
                <span className="text-slate-400">Mods & Addons</span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
              <Boxes className="w-4 h-4 text-cyan-400" />
              <div className="text-xs">
                <span className="font-extrabold text-white">2,500+ </span>
                <span className="text-slate-400">Modpacks</span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
              <Eye className="w-4 h-4 text-amber-400" />
              <div className="text-xs">
                <span className="font-extrabold text-white">1,000+ </span>
                <span className="text-slate-400">Shaders</span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <div className="text-xs">
                <span className="font-extrabold text-white">Community Driven </span>
                <span className="text-slate-400">Always Updated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY FILTER TABS BAR (Matching reference) */}
      <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: 'all', label: 'All', icon: Layers },
          { id: 'mod', label: 'Mods', icon: Puzzle },
          { id: 'modpack', label: 'Modpacks', icon: Boxes },
          { id: 'shader', label: 'Shaders', icon: Eye },
          { id: 'resourcepack', label: 'Resource Packs', icon: ImageIcon },
          { id: 'datapack', label: 'Data Packs', icon: FileCode },
          { id: 'world', label: 'Worlds', icon: Globe },
          { id: 'tool', label: 'Tools', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = projectType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                setProjectType(tab.id as any);
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-glow-sm border border-white/20'
                  : 'bg-[#0c1228]/80 text-slate-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.06]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. 2-COLUMN SPLIT: Left Main Area & Right Filter Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT MAIN CONTENT (9 cols) ================= */}
        <div className="lg:col-span-9 space-y-7">
          {/* 3.1 Trending This Week (5 Cards in 5-col row) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-display font-bold text-white tracking-wide">
                  Trending This Week
                </h2>
              </div>
              <button
                onClick={() => setSortBy('downloads')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {staticTrending.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (trendingProjects[idx]) handleOpenProjectModal(trendingProjects[idx]);
                  }}
                  className="rounded-2xl bg-[#0c1228]/85 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 p-3 space-y-2.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                >
                  {/* Top Thumbnail with Rank Badge */}
                  <div className="relative h-24 rounded-xl overflow-hidden border border-white/[0.08]">
                    <img
                      src={item.bannerBg}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-transparent to-transparent" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      <span>{item.rank}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-white text-xs truncate group-hover:text-indigo-200 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[10.5px] text-slate-400 truncate">
                      {item.subtitle}
                    </p>

                    {/* Tag Pills */}
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {item.tags.map((t, tidx) => (
                        <span key={tidx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Downloads & Rating */}
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span className="font-mono font-bold text-white">{item.downloads}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="font-mono font-bold text-white">{item.rating}</span>
                    </span>
                  </div>

                  {/* Install Button */}
                  <div className="flex items-center space-x-1 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (trendingProjects[idx]) handleQuickInstall(trendingProjects[idx], e);
                        else onShowToast({ type: 'success', title: 'Installed', message: `Installed ${item.title}` });
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-[11px] shadow-sm transition-all text-center"
                    >
                      Install
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (trendingProjects[idx]) handleOpenProjectModal(trendingProjects[idx]);
                      }}
                      className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3.2 Browse by Category (5 Scenic Feature Cards Row) */}
          <div className="space-y-3.5">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-display font-bold text-white tracking-wide">
                Browse by Category
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {staticCategories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedCategory(cat.title.toLowerCase().split(' ')[0]);
                    }}
                    className="relative rounded-2xl overflow-hidden border border-white/[0.08] hover:border-indigo-500/50 p-4 h-28 flex flex-col justify-between cursor-pointer group transition-all duration-300 shadow-lg"
                  >
                    <img
                      src={cat.bg}
                      alt={cat.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070a18] via-[#070a18]/70 to-transparent" />

                    <div className="relative z-10">
                      <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-2">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-white truncate">{cat.title}</div>
                      <div className="text-[10px] text-slate-300 truncate">{cat.desc}</div>
                    </div>

                    <div className="relative z-10 flex justify-end">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3.3 Featured Modpacks (5 Modpacks Row) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-display font-bold text-white tracking-wide">
                  Featured Modpacks
                </h2>
              </div>
              <button
                onClick={() => setProjectType('modpack')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
              {staticModpacks.map((mp, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (featuredModpacks[idx]) handleOpenProjectModal(featuredModpacks[idx]);
                  }}
                  className="rounded-2xl bg-[#0c1228]/85 backdrop-blur-xl border border-white/[0.08] hover:border-purple-500/40 p-3 space-y-2.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                >
                  <div className="relative h-24 rounded-xl overflow-hidden border border-white/[0.08]">
                    <img
                      src={mp.bg}
                      alt={mp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-transparent to-transparent" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9.5px] font-bold text-indigo-300 border border-indigo-500/30">
                      {mp.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-white text-xs truncate group-hover:text-indigo-200 transition-colors">
                      {mp.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono font-bold text-white">
                        <Download className="w-3 h-3 text-cyan-400" />
                        {mp.downloads}
                      </span>
                      <span className="flex items-center gap-1 font-mono font-bold text-white">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {mp.rating}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (featuredModpacks[idx]) handleQuickInstall(featuredModpacks[idx], e);
                        else onShowToast({ type: 'success', title: 'Installed', message: `Installed ${mp.title}` });
                      }}
                      className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-[11px] shadow-sm transition-all text-center"
                    >
                      Install
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (featuredModpacks[idx]) handleOpenProjectModal(featuredModpacks[idx]);
                      }}
                      className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= RIGHT FILTER SIDEBAR (3 cols, matching reference) ================= */}
        <div className="lg:col-span-3 sticky top-6">
          <div className="p-5 rounded-3xl bg-[#0c1228]/90 backdrop-blur-2xl border border-white/[0.1] shadow-2xl space-y-5">
            {/* Header & Reset */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-display font-bold text-white">Filters</h3>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setSearchQuery('');
                  setSelectedLoader('all');
                  setSelectedCategory('all');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Reset
              </button>
            </div>

            {/* Content Type Checkboxes */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Content Type
              </div>
              <div className="space-y-2">
                {[
                  { id: 'mods', label: 'Mods', count: '24,581' },
                  { id: 'modpacks', label: 'Modpacks', count: '2,541' },
                  { id: 'shaders', label: 'Shaders', count: '1,032' },
                  { id: 'resourcepacks', label: 'Resource Packs', count: '6,782' },
                  { id: 'datapacks', label: 'Data Packs', count: '1,245' },
                  { id: 'worlds', label: 'Worlds', count: '892' },
                  { id: 'tools', label: 'Tools', count: '1,104' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={contentTypeFilters[item.id as keyof typeof contentTypeFilters] || false}
                        onChange={(e) => {
                          sounds.playClick();
                          setContentTypeFilters({ ...contentTypeFilters, [item.id]: e.target.checked });
                        }}
                        className="rounded bg-white/10 border-white/20 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 group-hover:text-slate-400">
                      {item.count}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minecraft Version Dropdown */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Minecraft Version
              </div>
              <select
                value={selectedMcVersion}
                onChange={(e) => {
                  sounds.playClick();
                  setSelectedMcVersion(e.target.value);
                }}
                className="w-full bg-[#070a18] text-xs text-slate-200 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
              >
                <option value="1.21.1">1.21.1 (Latest)</option>
                <option value="1.20.4">1.20.4</option>
                <option value="1.19.4">1.19.4</option>
                <option value="1.18.2">1.18.2</option>
                <option value="1.16.5">1.16.5</option>
                <option value="1.12.2">1.12.2</option>
              </select>
            </div>

            {/* Loader Checkboxes */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Loader
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'fabric', label: 'Fabric' },
                  { id: 'neoforge', label: 'NeoForge' },
                  { id: 'forge', label: 'Forge' },
                  { id: 'quilt', label: 'Quilt' },
                ].map((loader) => (
                  <label
                    key={loader.id}
                    className="flex items-center space-x-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={loaderFilters[loader.id as keyof typeof loaderFilters] || false}
                      onChange={(e) => {
                        sounds.playClick();
                        setLoaderFilters({ ...loaderFilters, [loader.id]: e.target.checked });
                      }}
                      className="rounded bg-white/10 border-white/20 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>{loader.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categories Count List */}
            <div className="space-y-2 pt-1 border-t border-white/[0.08]">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Categories
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {[
                  { name: 'Performance', count: '3,421', icon: Zap },
                  { name: 'Adventure', count: '4,218', icon: Sword },
                  { name: 'Technology', count: '2,906', icon: Wrench },
                  { name: 'Magic', count: '2,134', icon: Sparkles },
                  { name: 'Exploration', count: '1,987', icon: Compass },
                  { name: 'Building', count: '2,451', icon: Box },
                  { name: 'Multiplayer', count: '1,876', icon: Users },
                  { name: 'Survival', count: '2,319', icon: Shield },
                  { name: 'RPG', count: '1,202', icon: Trophy },
                  { name: 'QoL', count: '3,104', icon: SlidersHorizontal },
                ].map((cat, idx) => {
                  const CatIcon = cat.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedCategory(cat.name.toLowerCase());
                      }}
                      className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <CatIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{cat.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{cat.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#0c1228] border border-white/15 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-smooth-in">
            {/* Modal Header */}
            <div className="relative h-40 overflow-hidden shrink-0">
              <img
                src={activeProject.iconUrl || bgPortalHero}
                alt={activeProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-[#0c1228]/60 to-transparent" />
              <button
                onClick={() => setActiveProject(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-white">
                    {activeProject.title}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    {activeProject.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body: Versions list */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              <div className="text-xs font-bold font-mono text-slate-300 uppercase">
                Available Versions
              </div>
              {loadingVersions ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                  <span>Loading versions from Modrinth...</span>
                </div>
              ) : projectVersions.length > 0 ? (
                <div className="space-y-2">
                  {projectVersions.slice(0, 10).map((ver) => (
                    <div
                      key={ver.id}
                      className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-between hover:bg-white/[0.08] transition-all"
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>{ver.name || ver.versionNumber}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {ver.gameVersions.join(', ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Loaders: {ver.loaders.join(', ')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickInstall(activeProject)}
                        disabled={installingId === activeProject.id}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-glow-sm"
                      >
                        {installingId === activeProject.id ? (
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
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No compatible versions found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
