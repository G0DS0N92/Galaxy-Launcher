import React, { useState, useEffect } from 'react';
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
  Filter,
  Eye
} from 'lucide-react';
import { MarketplaceProject, MarketplaceVersion, Instance } from '../../types';
import { sounds } from '../../services/soundEngine';

interface MarketplaceViewProps {
  instances: Instance[];
  selectedInstance: Instance | null;
  initialType?: 'mod' | 'modpack' | 'resourcepack' | 'shader';
  onShowToast: (toast: any) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  instances,
  selectedInstance,
  initialType = 'mod',
  onShowToast
}) => {
  const [projectType, setProjectType] = useState<'mod' | 'modpack' | 'resourcepack' | 'shader'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'downloads' | 'relevance' | 'follows' | 'updated'>('downloads');
  const [selectedLoader, setSelectedLoader] = useState<string>('all');
  const [targetInstanceId, setTargetInstanceId] = useState<string>(selectedInstance?.id || (instances[0]?.id || ''));

  // Project detail modal
  const [activeProject, setActiveProject] = useState<MarketplaceProject | null>(null);
  const [projectVersions, setProjectVersions] = useState<MarketplaceVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ filename: string; bytes: number; total: number } | null>(null);

  useEffect(() => {
    if (selectedInstance && !targetInstanceId) {
      setTargetInstanceId(selectedInstance.id);
    }
  }, [selectedInstance]);

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

  const fetchProjects = async () => {
    setLoading(true);
    try {
      if (window.galaxy?.searchMarketplace) {
        const res = await window.galaxy.searchMarketplace({
          query: searchQuery,
          projectType,
          sortBy,
          loader: selectedLoader === 'all' ? undefined : selectedLoader,
          limit: 24
        });
        setProjects(res.projects);
        setTotalHits(res.totalHits);
      }
    } catch (err) {
      console.error('Marketplace search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = async (project: MarketplaceProject) => {
    sounds.playClick();
    setActiveProject(project);
    setLoadingVersions(true);
    try {
      if (window.galaxy) {
        const [fullDetails, versions] = await Promise.all([
          window.galaxy.getMarketplaceProject(project.id),
          window.galaxy.getMarketplaceVersions(project.id)
        ]);
        if (fullDetails) {
          setActiveProject(fullDetails);
        }
        setProjectVersions(versions);
      }
    } catch (err) {
      console.error('Failed to get project versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleInstallItem = async (project: MarketplaceProject, version?: MarketplaceVersion) => {
    if (project.projectType === 'modpack') {
      // Modpack installation
      const firstVer = version || projectVersions[0];
      const primaryFile = firstVer?.files.find(f => f.primary) || firstVer?.files[0];
      if (!primaryFile) return;

      sounds.playSuccess();
      setInstallingId(project.id);
      try {
        onShowToast({
          id: Math.random().toString(),
          type: 'info',
          title: `Downloading modpack ${project.title}...`
        });
        await window.galaxy.installModpack(primaryFile.url, project.title);
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Installed Modpack "${project.title}"!`
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
      }
      return;
    }

    if (!targetInstanceId) {
      alert('Please create or select a target instance first.');
      return;
    }

    const targetInst = instances.find(i => i.id === targetInstanceId);
    if (!targetInst) return;

    sounds.playSuccess();
    setInstallingId(project.id);

    try {
      // Get compatible version if not passed
      let verToInstall = version;
      if (!verToInstall) {
        const versions = await window.galaxy.getMarketplaceVersions(project.id, [targetInst.loader], [targetInst.version]);
        verToInstall = versions[0] || (await window.galaxy.getMarketplaceVersions(project.id))[0];
      }

      if (!verToInstall || !verToInstall.files[0]) {
        throw new Error(`No compatible file found for MC ${targetInst.version} (${targetInst.loader})`);
      }

      const file = verToInstall.files.find(f => f.primary) || verToInstall.files[0];

      await window.galaxy.installMarketplaceItem(
        targetInst.id,
        project.projectType as any,
        file.url,
        file.filename,
        file.hashes.sha1
      );

      sounds.playSuccess();
      onShowToast({
        id: Math.random().toString(),
        type: 'success',
        title: `Installed ${project.title}`,
        message: `Added to instance "${targetInst.name}"`
      });
      setActiveProject(null);
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
      setDownloadProgress(null);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col select-none overflow-hidden bg-galaxy-950/40">
      {/* Top Marketplace Bar */}
      <div className="p-6 border-b border-white/[0.08] bg-galaxy-900/60 backdrop-blur-md space-y-4">
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
              Browse, search, and 1-click install over 100,000+ verified Minecraft mods, shaders, and packs.
            </p>
          </div>

          {/* Target Instance Selector */}
          {projectType !== 'modpack' && instances.length > 0 && (
            <div className="flex items-center space-x-2 bg-galaxy-950/80 px-3 py-1.5 rounded-xl border border-white/[0.08]">
              <span className="text-xs text-slate-400 font-medium">Target Instance:</span>
              <select
                value={targetInstanceId}
                onChange={(e) => setTargetInstanceId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-purple-300 focus:outline-none"
              >
                {instances.map((i) => (
                  <option key={i.id} value={i.id} className="bg-galaxy-950 text-slate-100">
                    {i.name} (MC {i.version} {i.loader})
                  </option>
                ))}
              </select>
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
              { id: 'resourcepack', label: 'Resource Packs', icon: Layers },
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

          {/* Search & Sort Controls */}
          <div className="flex items-center space-x-2.5 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${projectType}s...`}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <select
              value={selectedLoader}
              onChange={(e) => setSelectedLoader(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Loaders</option>
              <option value="fabric">Fabric</option>
              <option value="forge">Forge</option>
              <option value="neoforge">NeoForge</option>
              <option value="quilt">Quilt</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-300 focus:outline-none"
            >
              <option value="downloads">Most Downloads</option>
              <option value="relevance">Relevance</option>
              <option value="follows">Most Followed</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-xs font-mono">Searching Modrinth galaxy...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center space-y-3 bg-galaxy-900/20">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No results found</div>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or loader filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((proj) => {
              const isInstalling = installingId === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => handleOpenProject(proj)}
                  className="group relative p-4 rounded-2xl bg-galaxy-900/60 hover:bg-galaxy-850/90 border border-white/[0.06] hover:border-purple-500/40 backdrop-blur-md transition-all cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-glow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3.5">
                      <img
                        src={proj.iconUrl || 'https://minotar.net/avatar/MHF_Chest/48'}
                        alt={proj.title}
                        className="w-12 h-12 rounded-xl bg-black/40 border border-white/[0.08] object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.opacity = '0.3';
                        }}
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                          {proj.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium truncate">
                          by <span className="text-slate-300">{proj.author}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>

                    {/* Category Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {proj.categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 border border-white/[0.06]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center space-x-1">
                        <Download className="w-3 h-3 text-cyan-400" />
                        <span>{(proj.downloads / 1000).toFixed(0)}k</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        <span>{proj.follows}</span>
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInstallItem(proj);
                      }}
                      disabled={isInstalling}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-glow-sm"
                    >
                      {isInstalling ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Installing...</span>
                        </>
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
        )}
      </div>

      {/* Project Details Modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.08] bg-galaxy-950/80 flex items-start justify-between gap-4">
              <div className="flex items-center space-x-4">
                <img
                  src={activeProject.iconUrl || 'https://minotar.net/avatar/MHF_Chest/48'}
                  alt={activeProject.title}
                  className="w-14 h-14 rounded-2xl bg-black/40 border border-white/[0.1] object-cover"
                />
                <div className="space-y-1">
                  <h3 className="text-lg font-display font-bold text-white">{activeProject.title}</h3>
                  <p className="text-xs text-slate-400">{activeProject.description}</p>
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 pt-1">
                    <span>{activeProject.downloads.toLocaleString()} downloads</span>
                    <span>•</span>
                    <span>{activeProject.follows} followers</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveProject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Screenshots Gallery if available */}
              {activeProject.gallery && activeProject.gallery.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Screenshots</div>
                  <div className="flex space-x-3 overflow-x-auto pb-2">
                    {activeProject.gallery.map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`Screenshot ${idx + 1}`}
                        className="h-36 rounded-xl border border-white/[0.1] object-cover flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Install Versions Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-300">Available Releases & Files</div>
                  {projectType !== 'modpack' && (
                    <span className="text-[11px] text-purple-300 font-mono">
                      Target: {instances.find(i => i.id === targetInstanceId)?.name || 'Select Instance'}
                    </span>
                  )}
                </div>

                {loadingVersions ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Fetching version metadata...</span>
                  </div>
                ) : projectVersions.length === 0 ? (
                  <div className="p-6 rounded-xl bg-black/30 text-center text-xs text-slate-400">
                    No downloadable files found.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {projectVersions.slice(0, 8).map((ver) => (
                      <div
                        key={ver.id}
                        className="p-3 rounded-xl bg-galaxy-950/60 border border-white/[0.06] flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-200">{ver.name || ver.versionNumber}</div>
                          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                            <span>MC {ver.gameVersions.slice(0, 3).join(', ')}</span>
                            <span>•</span>
                            <span className="uppercase">{ver.loaders.join(', ')}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInstallItem(activeProject, ver)}
                          disabled={installingId === activeProject.id}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-1.5 transition-all"
                        >
                          <Download className="w-3 h-3" />
                          <span>Install File</span>
                        </button>
                      </div>
                    ))}
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
