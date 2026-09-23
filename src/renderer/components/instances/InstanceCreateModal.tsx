import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Layers,
  Sparkles,
  Zap,
  Check,
  ChevronDown,
  Cpu,
  HardDrive,
  Settings as SettingsIcon,
  Flame,
  Wand2,
  Package,
  FolderUp,
  FileArchive,
  Loader2,
  ArrowRight,
  HelpCircle,
  Search,
  Palette,
  Share2,
  Star
} from 'lucide-react';
import { ModLoader, MinecraftVersion, JavaInstallation, Instance, JvmProfile } from '../../types';
import { sounds } from '../../services/soundEngine';
import { InstanceIconRenderer, IconEditorModal } from './instanceIcons';

interface InstanceCreateModalProps {
  isOpen: boolean;
  initialTab?: 'create' | 'import' | 'share_code';
  onClose: () => void;
  onCreate: (data: {
    name: string;
    version: string;
    loader: ModLoader;
    loaderVersion?: string;
    icon?: string;
    iconBackground?: string;
    memoryMin?: number;
    memoryMax?: number;
    optimize?: boolean;
    jvmProfile?: JvmProfile;
  }) => Promise<void>;
  onImportSuccess?: (instance: Instance) => void;
  detectedJava: JavaInstallation[];
  defaultRamMax?: number;
}

export const InstanceCreateModal: React.FC<InstanceCreateModalProps> = ({
  isOpen,
  initialTab = 'create',
  onClose,
  onCreate,
  onImportSuccess,
  detectedJava,
  defaultRamMax = 4096
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'import' | 'share_code'>('create');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'create');
    }
  }, [isOpen, initialTab]);

  // Share Code State
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [shareCustomName, setShareCustomName] = useState('');
  const [isImportingShareCode, setIsImportingShareCode] = useState(false);
  const [shareCodeError, setShareCodeError] = useState<string | null>(null);

  // Create Custom Instance State
  const [name, setName] = useState('My Minecraft World');
  const [version, setVersion] = useState('1.21.4');
  const [loader, setLoader] = useState<ModLoader>('fabric');
  const [loaderVersion, setLoaderVersion] = useState('');
  const [icon, setIcon] = useState('backpack');
  const [iconBackground, setIconBackground] = useState('blue');
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [jvmProfile, setJvmProfile] = useState<JvmProfile>('aikar');
  const [versionsList, setVersionsList] = useState<MinecraftVersion[]>([]);
  const [fabricVersions, setFabricVersions] = useState<string[]>([]);
  const [quiltVersions, setQuiltVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [optimize, setOptimize] = useState(true);
  const [memoryMax, setMemoryMax] = useState(defaultRamMax);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import Modpack State
  const [importFilePath, setImportFilePath] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importCustomName, setImportCustomName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ step: string; percent: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Dropdown & Search State
  const [versionSearch, setVersionSearch] = useState('');
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);
  const [loaderDropdownOpen, setLoaderDropdownOpen] = useState(false);
  const versionDropdownRef = useRef<HTMLDivElement | null>(null);
  const loaderDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(e.target as Node)) {
        setVersionDropdownOpen(false);
      }
      if (loaderDropdownRef.current && !loaderDropdownRef.current.contains(e.target as Node)) {
        setLoaderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMemoryMax(defaultRamMax);
      loadVersions();
      setImportFilePath('');
      setImportFileName('');
      setImportCustomName('');
      setImportError(null);
      setImportProgress(null);
      setVersionSearch('');
      setVersionDropdownOpen(false);
      setLoaderDropdownOpen(false);
    }
  }, [isOpen, defaultRamMax]);

  useEffect(() => {
    if (loader === 'fabric' && version) {
      loadFabricLoaders(version);
    } else if (loader === 'quilt' && version) {
      loadQuiltLoaders(version);
    }
  }, [loader, version]);

  useEffect(() => {
    if (!window.galaxy?.onModpackProgress) return;
    const unsub = window.galaxy.onModpackProgress((progress) => {
      const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
      setImportProgress({
        step: progress.item
          ? `Downloading ${progress.item} (${progress.completed}/${progress.total})`
          : `Processing mods (${progress.completed}/${progress.total})`,
        percent: pct
      });
    });
    return () => {
      unsub();
    };
  }, []);

  const loadVersions = async () => {
    try {
      setLoadingVersions(true);
      if (window.galaxy?.getMojangVersions) {
        const list = await window.galaxy.getMojangVersions();
        setVersionsList(list);

        const maxInstalledJava = (detectedJava && detectedJava.length > 0)
          ? Math.max(...detectedJava.map((j) => j.majorVersion))
          : 21;

        const releases = list.filter((v) => v.type === 'release');
        const compatibleRelease = releases.find((v) => {
          const isJava25 = v.id.startsWith('25') || v.id.startsWith('26') || v.id.startsWith('27');
          return isJava25 ? maxInstalledJava >= 25 : true;
        });

        const target = compatibleRelease || releases[0] || list[0];
        if (target) {
          setVersion(target.id);
        }
      }
    } catch (err) {
      console.error('Failed to load Mojang versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const loadFabricLoaders = async (gameVer: string) => {
    try {
      if (window.galaxy?.getFabricVersions) {
        const loaders = await window.galaxy.getFabricVersions(gameVer);
        setFabricVersions(loaders);
        if (loaders.length > 0) {
          setLoaderVersion(loaders[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load Fabric loaders:', err);
    }
  };

  const loadQuiltLoaders = async (gameVer: string) => {
    try {
      if (window.galaxy?.getQuiltVersions) {
        const loaders = await window.galaxy.getQuiltVersions(gameVer);
        setQuiltVersions(loaders);
        if (loaders.length > 0) {
          setLoaderVersion(loaders[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load Quilt loaders:', err);
    }
  };

  const handleSelectModpackFile = async () => {
    try {
      sounds.playClick();
      setImportError(null);
      const filePath = await window.galaxy.selectFile([
        { name: 'Modpack Archives (*.mrpack, *.zip)', extensions: ['mrpack', 'zip'] }
      ]);
      if (filePath) {
        setImportFilePath(filePath);
        const rawName = filePath.split(/[/\\]/).pop() || '';
        setImportFileName(rawName);
        const cleanName = rawName.replace(/\.(mrpack|zip)$/i, '').replace(/[-_]/g, ' ');
        setImportCustomName(cleanName);
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to select file');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFilePath) return;

    try {
      setIsImporting(true);
      setImportError(null);
      sounds.playLaunch();
      const importedInst = await window.galaxy.importLocalModpack(importFilePath, importCustomName.trim() || undefined);
      sounds.playSuccess();
      if (onImportSuccess) {
        onImportSuccess(importedInst);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to import modpack:', err);
      sounds.playError();
      setImportError(err.message || 'Failed to parse and import modpack');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      sounds.playSuccess();
      await onCreate({
        name: name.trim(),
        version,
        loader,
        loaderVersion: loader === 'fabric' || loader === 'quilt' ? loaderVersion : undefined,
        icon,
        iconBackground,
        memoryMin: 2048,
        memoryMax,
        optimize,
        jvmProfile
      });
      onClose();
    } catch (err) {
      console.error('Failed to create instance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareCodeInput.trim() || isImportingShareCode) return;

    try {
      setIsImportingShareCode(true);
      setShareCodeError(null);
      sounds.playSuccess();
      if (window.galaxy?.importFromShareCode) {
        const inst = await window.galaxy.importFromShareCode(
          shareCodeInput.trim(),
          shareCustomName.trim() || undefined
        );
        if (onImportSuccess) {
          onImportSuccess(inst);
        }
        onClose();
      } else {
        throw new Error('Share code importer is unavailable in this environment');
      }
    } catch (err: any) {
      console.error('Failed to import share code:', err);
      sounds.playError();
      setShareCodeError(err.message || 'Failed to parse and import share code');
    } finally {
      setIsImportingShareCode(false);
    }
  };

  if (!isOpen) return null;

  const filteredVersions = versionsList
    .filter((v) => (showSnapshots ? true : v.type === 'release'))
    .filter((v) => (versionSearch ? v.id.toLowerCase().includes(versionSearch.toLowerCase()) : true));

  const latestReleaseId = versionsList.find((v) => v.type === 'release')?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-galaxy-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">Add Minecraft Instance</h3>
              <p className="text-xs text-slate-400">Create a clean instance or import an existing modpack</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher - Equal 1/3 Spacing Across All 3 Tabs */}
        <div className="grid grid-cols-3 border-b border-white/[0.08] bg-galaxy-950/60 px-6 pt-2 gap-2">
          <button
            type="button"
            onClick={() => {
              sounds.playSwitch();
              setActiveTab('create');
            }}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-3 text-xs font-bold border-b-2 transition-all text-center rounded-t-xl ${
              activeTab === 'create'
                ? 'border-purple-500 text-purple-300 bg-purple-500/15 shadow-glow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="truncate">Custom Instance</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playSwitch();
              setActiveTab('share_code');
            }}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-3 text-xs font-bold border-b-2 transition-all text-center rounded-t-xl ${
              activeTab === 'share_code'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/15 shadow-glow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span className="truncate">Import Share Code</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playSwitch();
              setActiveTab('import');
            }}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-3 text-xs font-bold border-b-2 transition-all text-center rounded-t-xl ${
              activeTab === 'import'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-500/15 shadow-glow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <FolderUp className="w-4 h-4 shrink-0" />
            <span className="truncate">Import Modpack</span>
          </button>
        </div>

        {/* TAB 1: Custom Instance Creation */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Instance Name & Icon Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Instance Name & Icon</label>
              <div className="flex items-center space-x-3">
                {/* Clickable Icon Preview Box */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setShowIconEditor(true);
                  }}
                  className="group relative flex-shrink-0 rounded-2xl p-1 bg-galaxy-950 border border-white/[0.12] hover:border-purple-400 transition-all cursor-pointer shadow-md"
                  title="Click to change custom icon and background color"
                >
                  <InstanceIconRenderer
                    icon={icon}
                    background={iconBackground}
                    size="md"
                    className="w-12 h-12 rounded-xl group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <Palette className="w-4 h-4 text-cyan-300" />
                  </div>
                </button>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Modded Adventure 1.21"
                  required
                  className="flex-1 px-3.5 py-3 rounded-xl bg-galaxy-950 border border-white/[0.1] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors font-medium"
                />
              </div>
            </div>

            {/* Mod Loader Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Choose Mod Loader</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { id: 'fabric', name: 'Fabric', desc: 'Fast & Modern', defIcon: 'backpack', defBg: 'blue' },
                  { id: 'forge', name: 'Forge', desc: 'Classic Engine', defIcon: 'anvil', defBg: 'orange' },
                  { id: 'neoforge', name: 'NeoForge', desc: 'Modern Fork', defIcon: 'mace', defBg: 'red' },
                  { id: 'quilt', name: 'Quilt', desc: 'Next-Gen Ecosystem', defIcon: 'enchanted_block', defBg: 'purple' },
                  { id: 'vanilla', name: 'Vanilla', desc: 'Official Pure', defIcon: 'grass_block', defBg: 'green' }
                ].map((item) => {
                  const isSelected = loader === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sounds.playSwitch();
                        setLoader(item.id as ModLoader);
                        setIcon(item.defIcon);
                        setIconBackground(item.defBg);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-600/20 shadow-glow-sm'
                          : 'border-white/[0.08] bg-galaxy-950/60 hover:bg-galaxy-950 hover:border-white/[0.18]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-100">{item.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minecraft Version Picker (Custom Downward Dropdown) */}
            <div className="space-y-1.5 relative" ref={versionDropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Minecraft Version</label>
                <label className="flex items-center space-x-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSnapshots}
                    onChange={(e) => setShowSnapshots(e.target.checked)}
                    className="rounded bg-galaxy-950 border-white/[0.2] text-purple-500 focus:ring-0"
                  />
                  <span>Include Snapshots</span>
                </label>
              </div>

              {/* Dropdown Trigger */}
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setVersionDropdownOpen(!versionDropdownOpen);
                  setLoaderDropdownOpen(false);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] hover:border-white/[0.2] text-xs font-mono text-slate-100 flex items-center justify-between focus:outline-none focus:border-purple-500 transition-all text-left"
              >
                <div className="flex items-center space-x-2 truncate">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="font-semibold">Minecraft {version}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Official Stable
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${versionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Downward Dropdown Menu */}
              {versionDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl bg-galaxy-900/95 border border-white/[0.15] shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Search Filter Box */}
                  <div className="p-2 border-b border-white/[0.08] bg-black/40 flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={versionSearch}
                      onChange={(e) => setVersionSearch(e.target.value)}
                      placeholder="Search release (e.g. 1.21, 1.20)..."
                      className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                      autoFocus
                    />
                    {versionSearch && (
                      <button
                        type="button"
                        onClick={() => setVersionSearch('')}
                        className="text-slate-400 hover:text-white text-xs px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Versions Scrollable List */}
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                    {filteredVersions.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No matching versions found</div>
                    ) : (
                      filteredVersions.map((v) => {
                        const isSelected = v.id === version;
                        const isRelease = v.type === 'release';
                        const isLatest = v.id === latestReleaseId;

                        return (
                          <div
                            key={v.id}
                            onClick={() => {
                              sounds.playClick();
                              setVersion(v.id);
                              setVersionDropdownOpen(false);
                            }}
                            className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all text-xs ${
                              isSelected
                                ? 'bg-purple-600/30 text-white border border-purple-500/40 font-semibold'
                                : 'hover:bg-white/[0.08] text-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {isRelease ? (
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full bg-slate-600/50 flex items-center justify-center text-[8px] text-slate-400">
                                  S
                                </div>
                              )}
                              <span className="font-mono">{v.id}</span>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              {(v.id.startsWith('25') || v.id.startsWith('26') || v.id.startsWith('27')) && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  Java 25+
                                </span>
                              )}
                              {isRelease && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                  Stable
                                </span>
                              )}
                              {isLatest && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Latest
                                </span>
                              )}
                              {!isRelease && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400">
                                  Snapshot
                                </span>
                              )}
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 ml-1" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fabric Loader Version (Custom Downward Dropdown) */}
            {loader === 'fabric' && fabricVersions.length > 0 && (
              <div className="space-y-1.5 relative" ref={loaderDropdownRef}>
                <label className="text-xs font-semibold text-slate-300">Fabric Loader Version</label>
                
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setLoaderDropdownOpen(!loaderDropdownOpen);
                    setVersionDropdownOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] hover:border-white/[0.2] text-xs font-mono text-slate-100 flex items-center justify-between focus:outline-none focus:border-purple-500 transition-all text-left"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {loaderVersion === fabricVersions[0] && (
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold">Loader {loaderVersion || fabricVersions[0]}</span>
                    {loaderVersion === fabricVersions[0] && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Recommended (Latest)
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${loaderDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {loaderDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl bg-galaxy-900/95 border border-white/[0.15] shadow-2xl backdrop-blur-xl overflow-hidden max-h-56 overflow-y-auto p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {fabricVersions.map((fv, idx) => {
                      const isSelected = (loaderVersion || fabricVersions[0]) === fv;
                      const isRecommended = idx === 0;

                      return (
                        <div
                          key={fv}
                          onClick={() => {
                            sounds.playClick();
                            setLoaderVersion(fv);
                            setLoaderDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all text-xs ${
                            isSelected
                              ? 'bg-purple-600/30 text-white border border-purple-500/40 font-semibold'
                              : 'hover:bg-white/[0.08] text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isRecommended && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                            <span className="font-mono">Loader {fv}</span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {isRecommended && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                Recommended
                              </span>
                            )}
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 ml-1" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quilt Loader Version (Custom Downward Dropdown) */}
            {loader === 'quilt' && quiltVersions.length > 0 && (
              <div className="space-y-1.5 relative" ref={loaderDropdownRef}>
                <label className="text-xs font-semibold text-slate-300">Quilt Loader Version</label>
                
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setLoaderDropdownOpen(!loaderDropdownOpen);
                    setVersionDropdownOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] hover:border-white/[0.2] text-xs font-mono text-slate-100 flex items-center justify-between focus:outline-none focus:border-purple-500 transition-all text-left"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {loaderVersion === quiltVersions[0] && (
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold">Loader {loaderVersion || quiltVersions[0]}</span>
                    {loaderVersion === quiltVersions[0] && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Recommended (Latest)
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${loaderDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {loaderDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl bg-galaxy-900/95 border border-white/[0.15] shadow-2xl backdrop-blur-xl overflow-hidden max-h-56 overflow-y-auto p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {quiltVersions.map((qv, idx) => {
                      const isSelected = (loaderVersion || quiltVersions[0]) === qv;
                      const isRecommended = idx === 0;

                      return (
                        <div
                          key={qv}
                          onClick={() => {
                            sounds.playClick();
                            setLoaderVersion(qv);
                            setLoaderDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all text-xs ${
                            isSelected
                              ? 'bg-purple-600/30 text-white border border-purple-500/40 font-semibold'
                              : 'hover:bg-white/[0.08] text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isRecommended && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                            <span className="font-mono">Loader {qv}</span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {isRecommended && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                Recommended
                              </span>
                            )}
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 ml-1" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quick 1-Click Optimization Preset */}
            <div
              onClick={() => {
                sounds.playSwitch();
                setOptimize(!optimize);
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                optimize ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-galaxy-950/50 border-white/[0.08]'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  optimize ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Flame className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">One-Click Performance Boost</span>
                  <input
                    type="checkbox"
                    checked={optimize}
                    onChange={() => {}}
                    className="rounded bg-galaxy-950 border-white/[0.2] text-emerald-500 focus:ring-0"
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automatically pre-installs Sodium (FPS Boost), Lithium (Physics lag fix), and FerriteCore (RAM
                  optimizer) into this instance.
                </p>
              </div>
            </div>

            {/* Advanced Settings (RAM & JVM GC Profile) */}
            <div className="space-y-3 pt-1 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setShowAdvanced(!showAdvanced);
                }}
                className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-1"
              >
                <div className="flex items-center space-x-1.5">
                  <SettingsIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Memory & JVM Engine Settings</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="space-y-4 p-3.5 rounded-xl bg-black/30 border border-white/[0.06] animate-in fade-in duration-200">
                  {/* RAM Allocation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Allocated Maximum RAM</span>
                      <span className="font-mono text-purple-400 font-bold">
                        {memoryMax} MB ({(memoryMax / 1024).toFixed(1)} GB)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1024"
                      max="16384"
                      step="512"
                      value={memoryMax}
                      onChange={(e) => setMemoryMax(parseInt(e.target.value, 10))}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>1 GB</span>
                      <span>4 GB (Default)</span>
                      <span>8 GB</span>
                      <span>16 GB</span>
                    </div>
                  </div>

                  {/* JVM Profile */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">Garbage Collection Profile</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: 'aikar',
                          name: "Aikar's Flags (G1GC)",
                          desc: 'Smoothest FPS frame-times'
                        },
                        {
                          id: 'zgc',
                          name: 'Generational ZGC',
                          desc: 'Ultra low latency (Java 21+)'
                        },
                        {
                          id: 'shenandoah',
                          name: 'Shenandoah GC',
                          desc: 'Minimal GC pause times'
                        },
                        {
                          id: 'vanilla',
                          name: 'Standard Java Flags',
                          desc: 'Default Minecraft settings'
                        }
                      ].map((prof) => {
                        const isChosen = jvmProfile === prof.id;
                        return (
                          <button
                            key={prof.id}
                            type="button"
                            onClick={() => {
                              sounds.playSwitch();
                              setJvmProfile(prof.id as JvmProfile);
                            }}
                            className={`p-2 rounded-lg border text-left transition-all ${
                              isChosen
                                ? 'border-cyan-500 bg-cyan-500/15'
                                : 'border-white/[0.06] bg-galaxy-950/40 hover:border-white/[0.12]'
                            }`}
                          >
                            <div className="text-[11px] font-bold text-slate-200">{prof.name}</div>
                            <div className="text-[9px] text-slate-400">{prof.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="text-slate-300 font-medium">Java Auto-Matcher</div>
                    <p className="text-slate-500 text-[10px]">
                      Galaxy will automatically use the optimal detected Java runtime ({detectedJava.length} runtimes
                      found on system).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Submit */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-glow-sm hover:shadow-glow-md flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Instance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Import Modpack */}
        {activeTab === 'import' && (
          <form onSubmit={handleImportSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-slate-300 text-xs flex items-start space-x-3">
              <Package className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-cyan-300 block">Modrinth (.mrpack) & CurseForge (.zip) Importer</span>
                Galaxy unpacks configs, overrides, and automatically pulls all verified mods directly with high-speed
                parallel downloads.
              </div>
            </div>

            {/* File Selection Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Modpack Archive File</label>
              <div
                onClick={handleSelectModpackFile}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  importFilePath
                    ? 'border-cyan-500/60 bg-cyan-500/5'
                    : 'border-white/[0.15] bg-galaxy-950/60 hover:border-purple-500/50 hover:bg-galaxy-950'
                }`}
              >
                {importFilePath ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-100 max-w-sm truncate">{importFileName}</div>
                    <div className="text-[11px] font-mono text-slate-400 max-w-md truncate">{importFilePath}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectModpackFile();
                      }}
                      className="mt-2 text-xs text-cyan-400 hover:underline font-semibold"
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="p-3 rounded-xl bg-white/[0.05] text-slate-400 border border-white/[0.1]">
                      <FolderUp className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-200">Click to Browse Modpack File</div>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Supports <span className="text-cyan-400 font-mono">.mrpack</span> (Modrinth) and{' '}
                      <span className="text-purple-400 font-mono">.zip</span> (CurseForge manifests)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Name Override */}
            {importFilePath && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-xs font-semibold text-slate-300">Instance Display Name</label>
                <input
                  type="text"
                  value={importCustomName}
                  onChange={(e) => setImportCustomName(e.target.value)}
                  placeholder="Instance Name (e.g. Better MC)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            )}

            {/* Progress state */}
            {isImporting && (
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>{importProgress?.step || 'Extracting archive & resolving mods...'}</span>
                  </span>
                  <span className="font-mono text-slate-400">{importProgress?.percent || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${Math.max(5, importProgress?.percent || 0)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Display */}
            {importError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
                {importError}
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!importFilePath || isImporting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-xs font-bold shadow-glow-sm hover:shadow-glow-md flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing Modpack...</span>
                  </>
                ) : (
                  <>
                    <FolderUp className="w-4 h-4" />
                    <span>Start Import</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Import via Share Code */}
        {activeTab === 'share_code' && (
          <form onSubmit={handleShareCodeSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-300 text-xs flex items-start space-x-3">
              <Share2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 block">1-Click Galaxy Share Code Importer</span>
                Paste any 6-character code (e.g. <span className="font-mono text-cyan-300 font-bold">GLX-7749</span>) or full share payload. Galaxy will automatically configure the Minecraft version, mod loader, and clone the instance setup.
              </div>
            </div>

            {/* Share Code Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Galaxy Share Code or Payload</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Format: GLX-XXXX</span>
              </label>
              <input
                type="text"
                value={shareCodeInput}
                onChange={(e) => {
                  setShareCodeInput(e.target.value);
                  setShareCodeError(null);
                }}
                placeholder="Paste code (e.g. GLX-8942 or full share string)..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-galaxy-950 border border-white/[0.12] text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-mono transition-colors tracking-wide"
              />
            </div>

            {/* Custom Name Override */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Custom Instance Name <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={shareCustomName}
                onChange={(e) => setShareCustomName(e.target.value)}
                placeholder="Leave blank to use original instance name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Error Message */}
            {shareCodeError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
                {shareCodeError}
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isImportingShareCode}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!shareCodeInput.trim() || isImportingShareCode}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-glow-sm hover:shadow-glow-md flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {isImportingShareCode ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cloning Instance...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Import & Build Instance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Icon & Background Editor Modal */}
      {showIconEditor && (
        <IconEditorModal
          isOpen={true}
          initialIcon={icon}
          initialBackground={iconBackground}
          onSave={(newIcon, newBg) => {
            setIcon(newIcon);
            setIconBackground(newBg);
            setShowIconEditor(false);
          }}
          onClose={() => setShowIconEditor(false)}
        />
      )}
    </div>
  );
};
