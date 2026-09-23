import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Download,
  Star,
  RefreshCw,
  Package,
  Layers,
  Sparkles,
  Palette,
  Archive,
  CheckCircle2,
  Trash2,
  Loader2,
  ExternalLink,
  ChevronDown,
  Check,
  Info,
  Filter
} from 'lucide-react';
import { Instance, MarketplaceProject, MarketplaceVersion, Mod, ResourcePack, ShaderPack } from '../../types';
import { sounds } from '../../services/soundEngine';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: Instance;
  initialType?: 'mod' | 'shader' | 'resourcepack' | 'modpack';
  onContentChanged: () => void;
  onShowToast: (toast: any) => void;
}

function formatCompactNumber(num: number): string {
  if (!num) return '0';
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(0) + 'k';
  return num.toString();
}

export const AddContentModal: React.FC<AddContentModalProps> = ({
  isOpen,
  onClose,
  instance,
  initialType = 'mod',
  onContentChanged,
  onShowToast
}) => {
  const [activeType, setActiveType] = useState<'mod' | 'shader' | 'resourcepack' | 'modpack'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'downloads' | 'relevance' | 'follows' | 'updated'>('downloads');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Installed items for target instance
  const [installedMods, setInstalledMods] = useState<Mod[]>([]);
  const [installedResourcePacks, setInstalledResourcePacks] = useState<ResourcePack[]>([]);
  const [installedShaderPacks, setInstalledShaderPacks] = useState<ShaderPack[]>([]);

  // Action states
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Details Sub-Modal
  const [selectedProject, setSelectedProject] = useState<MarketplaceProject | null>(null);
  const [projectVersions, setProjectVersions] = useState<MarketplaceVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      loadInstalledContent();
      fetchProjects(true, initialType);
    }
  }, [isOpen, initialType, instance.id]);

  useEffect(() => {
    if (isOpen) {
      setOffset(0);
      setProjects([]);
      setHasMore(true);
      fetchProjects(true, activeType);
    }
  }, [activeType, sortBy]);

  const loadInstalledContent = async () => {
    if (!window.galaxy) return;
    try {
      const [m, r, s] = await Promise.all([
        window.galaxy.getMods(instance.id),
        window.galaxy.getResourcePacks(instance.id),
        window.galaxy.getShaderPacks(instance.id)
      ]);
      setInstalledMods(m || []);
      setInstalledResourcePacks(r || []);
      setInstalledShaderPacks(s || []);
    } catch (e) {
      console.error('Failed to load installed content:', e);
    }
  };

  const isProjectInstalled = (project: MarketplaceProject): boolean => {
    const slug = (project.slug || '').toLowerCase().trim();
    const title = (project.title || '').toLowerCase().trim();
    const id = (project.id || '').toLowerCase().trim();

    if (activeType === 'mod') {
      return installedMods.some((m) => {
        const fn = (m.filename || '').toLowerCase();
        const n = (m.name || '').toLowerCase();
        const modId = (m.id || '').toLowerCase();
        return (
          (slug && fn.includes(slug)) ||
          (title && n.includes(title)) ||
          (modId && modId === id) ||
          (slug && n.includes(slug))
        );
      });
    } else if (activeType === 'resourcepack') {
      return installedResourcePacks.some((r) => {
        const fn = (r.filename || '').toLowerCase();
        const n = (r.name || '').toLowerCase();
        return (slug && fn.includes(slug)) || (title && n.includes(title));
      });
    } else if (activeType === 'shader') {
      return installedShaderPacks.some((s) => {
        const fn = (s.filename || '').toLowerCase();
        const n = (s.name || '').toLowerCase();
        return (slug && fn.includes(slug)) || (title && n.includes(title));
      });
    }
    return false;
  };

  const fetchProjects = async (reset = false, type = activeType) => {
    if (!window.galaxy) return;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : offset;
      const res = await window.galaxy.searchMarketplace({
        query: searchQuery.trim(),
        projectType: type,
        loader: type === 'mod' ? instance.loader : undefined,
        gameVersion: type === 'mod' ? instance.version : undefined,
        offset: currentOffset,
        limit: 24,
        sortBy: sortBy
      });

      const newHits: MarketplaceProject[] = res?.projects || [];
      if (reset) {
        setProjects(newHits);
        setOffset(newHits.length);
      } else {
        setProjects((prev) => [...prev, ...newHits]);
        setOffset((prev) => prev + newHits.length);
      }

      setHasMore(newHits.length === 24);
    } catch (err) {
      console.error('Failed to search marketplace:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setHasMore(true);
    fetchProjects(true);
  };

  const handleOpenProjectDetails = async (project: MarketplaceProject) => {
    sounds.playClick();
    setSelectedProject(project);
    setLoadingVersions(true);
    try {
      if (window.galaxy) {
        const [full, versions] = await Promise.all([
          window.galaxy.getMarketplaceProject(project.id),
          window.galaxy.getMarketplaceVersions(project.id, [instance.loader], [instance.version])
        ]);
        if (full) setSelectedProject(full);
        setProjectVersions(versions || []);
      }
    } catch (e) {
      console.error('Failed to get versions:', e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleInstallProject = async (project: MarketplaceProject, specificVersion?: MarketplaceVersion) => {
    if (!window.galaxy) return;
    sounds.playSuccess();
    setInstallingId(project.id);
    try {
      let verToInstall = specificVersion;
      if (!verToInstall) {
        const versions = await window.galaxy.getMarketplaceVersions(
          project.id,
          [instance.loader],
          [instance.version]
        );
        verToInstall = versions[0] || (await window.galaxy.getMarketplaceVersions(project.id))[0];
      }

      if (!verToInstall || !verToInstall.files || verToInstall.files.length === 0) {
        throw new Error(`No compatible file found for MC ${instance.version} (${instance.loader})`);
      }

      const file = verToInstall.files.find((f) => f.primary) || verToInstall.files[0];

      if (activeType === 'mod') {
        const res = await window.galaxy.installMarketplaceModWithDependencies(
          instance.id,
          file.url,
          file.filename,
          file.hashes?.sha1,
          verToInstall.dependencies,
          instance.loader,
          instance.version
        );
        const depCount = res?.dependencyNames?.length || 0;
        const depMsg = depCount > 0 ? ` (+ ${depCount} required dependencies)` : '';
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Installed ${project.title}!`,
          message: `${file.filename} added to "${instance.name}"${depMsg}`
        });
      } else if (activeType === 'modpack') {
        await window.galaxy.installModpack(file.url, project.title);
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Installed Modpack "${project.title}"!`,
          message: 'Created as a new instance in your library.'
        });
      } else {
        await window.galaxy.installMarketplaceItem(
          instance.id,
          activeType as 'resourcepack' | 'shader',
          file.url,
          file.filename,
          file.hashes?.sha1
        );
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Installed ${project.title}!`,
          message: `${file.filename} added to "${instance.name}".`
        });
      }

      sounds.playSuccess();
      await loadInstalledContent();
      onContentChanged();
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Failed to install',
        message: err.message
      });
    } finally {
      setInstallingId(null);
    }
  };

  const handleRemoveProject = async (project: MarketplaceProject) => {
    if (!window.galaxy) return;
    sounds.playClick();
    setRemovingId(project.id);
    try {
      const slug = (project.slug || '').toLowerCase().trim();
      const title = (project.title || '').toLowerCase().trim();
      const id = (project.id || '').toLowerCase().trim();

      if (activeType === 'mod') {
        const found = installedMods.find((m) => {
          const fn = (m.filename || '').toLowerCase();
          const n = (m.name || '').toLowerCase();
          const modId = (m.id || '').toLowerCase();
          return (
            (slug && fn.includes(slug)) ||
            (title && n.includes(title)) ||
            (modId && modId === id) ||
            (slug && n.includes(slug))
          );
        });
        if (found) {
          await window.galaxy.deleteMod(instance.id, found.filename);
        }
      } else if (activeType === 'resourcepack') {
        const found = installedResourcePacks.find((r) => {
          const fn = (r.filename || '').toLowerCase();
          const n = (r.name || '').toLowerCase();
          return (slug && fn.includes(slug)) || (title && n.includes(title));
        });
        if (found) {
          await window.galaxy.deleteResourcePack(instance.id, found.filename);
        }
      } else if (activeType === 'shader') {
        const found = installedShaderPacks.find((s) => {
          const fn = (s.filename || '').toLowerCase();
          const n = (s.name || '').toLowerCase();
          return (slug && fn.includes(slug)) || (title && n.includes(title));
        });
        if (found) {
          await window.galaxy.deleteShaderPack(instance.id, found.filename);
        }
      }

      sounds.playSuccess();
      onShowToast({
        id: Math.random().toString(),
        type: 'info',
        title: `Removed ${project.title}`,
        message: `Removed from "${instance.name}".`
      });

      await loadInstalledContent();
      onContentChanged();
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Failed to remove',
        message: err.message
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 120) {
      if (!loading && !loadingMore && hasMore) {
        fetchProjects(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] rounded-3xl bg-galaxy-900 border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-white/[0.08] bg-galaxy-950/90 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-display font-bold text-white tracking-wide truncate">
                  Add Content to "{instance.name}"
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 uppercase font-semibold">
                  MC {instance.version} • {instance.loader}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Directly install mods, shaders, resource packs, and modpacks with 1 click.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories & Search Toolbar */}
        <div className="p-4 border-b border-white/[0.06] bg-black/40 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-galaxy-950/80 border border-white/[0.08] w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveType('mod');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeType === 'mod'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-glow-emerald'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Mods</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveType('shader');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeType === 'shader'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shaders</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveType('resourcepack');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeType === 'resourcepack'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-glow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Resource Packs</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveType('modpack');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeType === 'modpack'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-glow-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Modpacks</span>
            </button>
          </div>

          {/* Search Bar & Sort Dropdown */}
          <div className="flex items-center space-x-2.5 w-full md:w-auto flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeType}s for MC ${instance.version}...`}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setOffset(0);
                    fetchProjects(true);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="px-3 py-2 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs font-medium text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>{sortBy === 'downloads' ? 'Most Downloads' : sortBy === 'follows' ? 'Most Followed' : sortBy === 'updated' ? 'Recently Updated' : 'Relevance'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSortDropdown(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-galaxy-900 border border-white/[0.12] shadow-2xl py-1 z-40">
                    {[
                      { id: 'downloads', label: 'Most Downloads' },
                      { id: 'relevance', label: 'Relevance' },
                      { id: 'follows', label: 'Most Followed' },
                      { id: 'updated', label: 'Recently Updated' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSortBy(s.id as any);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between ${
                          sortBy === s.id
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                            : 'text-slate-300 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span>{s.label}</span>
                        {sortBy === s.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Projects Grid */}
        <div
          ref={gridContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-galaxy-950/30"
        >
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-emerald-400" />
              <span className="text-xs font-mono">Finding matching {activeType}s...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center space-y-3 bg-galaxy-900/40 my-8">
              <Package className="w-10 h-10 text-slate-500 mx-auto" />
              <div className="text-sm font-bold text-slate-200">No {activeType}s found</div>
              <p className="text-xs text-slate-400">Try adjusting your search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {projects.map((proj) => {
                const isInstalled = isProjectInstalled(proj);
                const isInstalling = installingId === proj.id;
                const isRemoving = removingId === proj.id;

                return (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProjectDetails(proj)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between shadow-lg overflow-hidden ${
                      isInstalled
                        ? 'border-emerald-500/40 bg-emerald-950/20 hover:bg-emerald-950/35 hover:border-emerald-500/60'
                        : 'border-white/[0.08] bg-[#0d1122]/90 hover:bg-[#131933] hover:border-purple-500/40'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start space-x-3">
                        <img
                          src={proj.iconUrl || 'https://minotar.net/avatar/MHF_Chest/48'}
                          alt={proj.title}
                          className="w-11 h-11 rounded-xl bg-black/60 border border-white/[0.1] object-cover shrink-0 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0.4';
                          }}
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className="font-bold text-xs text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                              {proj.title}
                            </h4>
                            {isInstalled && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold shrink-0">
                                INSTALLED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            by <span className="text-slate-300">{proj.author}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {proj.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer with Compact Stats and Emoji Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      {/* Compact Stats */}
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
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
                            handleOpenProjectDetails(proj);
                          }}
                          className="p-1.5 px-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.1] text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer flex items-center justify-center"
                          title="View Details & Versions"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove Button (if installed) */}
                        {isInstalled && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveProject(proj);
                            }}
                            disabled={isRemoving}
                            className="p-1.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-rose-100 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer flex items-center justify-center"
                            title="Remove from this instance"
                          >
                            {isRemoving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Install Button (or Installed Checkmark) */}
                        {isInstalled ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 px-2 rounded-xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-xs font-semibold flex items-center justify-center shadow-sm cursor-default"
                            title="Installed in this instance"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstallProject(proj);
                            }}
                            disabled={isInstalling}
                            className="p-1.5 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-glow-emerald flex items-center justify-center space-x-1 transition-all hover:scale-105 active:scale-95 border border-emerald-400/30 cursor-pointer"
                            title="Install into this instance"
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

              {loadingMore && (
                <div className="col-span-full py-6 flex justify-center">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading more {activeType}s...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project Details Modal */}
        {selectedProject && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
          >
            <div className="relative w-full max-w-2xl rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={selectedProject.iconUrl || 'https://minotar.net/avatar/MHF_Chest/48'}
                    alt={selectedProject.title}
                    className="w-12 h-12 rounded-xl bg-black border border-white/[0.1] object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-display font-bold text-white truncate">
                      {selectedProject.title}
                    </h3>
                    <div className="text-xs text-slate-400">by {selectedProject.author}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedProject.description}
              </p>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Available Compatible Versions for MC {instance.version} ({instance.loader}):</span>
                  <span className="text-[10px] font-mono text-emerald-400">{projectVersions.length} versions found</span>
                </h4>

                {loadingVersions ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-mono flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Loading versions...</span>
                  </div>
                ) : projectVersions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/30 border border-white/[0.08] text-xs text-slate-400 text-center">
                    No matching version files found for {instance.loader} {instance.version}.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {projectVersions.map((v) => (
                      <div
                        key={v.id}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] hover:border-white/[0.18] flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-semibold text-slate-100 truncate">{v.name || v.versionNumber}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {v.loaders?.join(', ')} • {v.gameVersions?.join(', ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleInstallProject(selectedProject, v);
                            setSelectedProject(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center space-x-1 shadow-sm cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Install</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
