import React, { useState, useEffect } from 'react';
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
  Wand2
} from 'lucide-react';
import { ModLoader, MinecraftVersion, JavaInstallation } from '../../types';
import { sounds } from '../../services/soundEngine';

interface InstanceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    version: string;
    loader: ModLoader;
    loaderVersion?: string;
    icon?: string;
    memoryMin?: number;
    memoryMax?: number;
    optimize?: boolean;
  }) => Promise<void>;
  detectedJava: JavaInstallation[];
  defaultRamMax?: number;
}

export const InstanceCreateModal: React.FC<InstanceCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  detectedJava,
  defaultRamMax = 4096
}) => {
  const [name, setName] = useState('My Minecraft World');
  const [version, setVersion] = useState('1.21.4');
  const [loader, setLoader] = useState<ModLoader>('fabric');
  const [loaderVersion, setLoaderVersion] = useState('');
  const [versionsList, setVersionsList] = useState<MinecraftVersion[]>([]);
  const [fabricVersions, setFabricVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [optimize, setOptimize] = useState(true);
  const [memoryMax, setMemoryMax] = useState(defaultRamMax);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMemoryMax(defaultRamMax);
      loadVersions();
    }
  }, [isOpen, defaultRamMax]);

  useEffect(() => {
    if (loader === 'fabric' && version) {
      loadFabricLoaders(version);
    }
  }, [loader, version]);

  const loadVersions = async () => {
    try {
      setLoadingVersions(true);
      if (window.galaxy?.getMojangVersions) {
        const list = await window.galaxy.getMojangVersions();
        setVersionsList(list);
        const latestRelease = list.find(v => v.type === 'release');
        if (latestRelease) {
          setVersion(latestRelease.id);
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      sounds.playSuccess();
      await onCreate({
        name: name.trim(),
        version,
        loader,
        loaderVersion: loader === 'fabric' ? loaderVersion : undefined,
        memoryMin: 2048,
        memoryMax,
        optimize
      });
      onClose();
    } catch (err) {
      console.error('Failed to create instance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVersions = versionsList.filter(v => showSnapshots ? true : v.type === 'release');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-galaxy-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">Create New Instance</h3>
              <p className="text-xs text-slate-400">Configure your Minecraft version, mod loader & performance</p>
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Instance Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Instance Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Modded Adventure 1.21"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          {/* Mod Loader Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Choose Mod Loader</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { id: 'fabric', name: 'Fabric', desc: 'Lightweight & Modern', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
                { id: 'forge', name: 'Forge', desc: 'Classic Heavy Mods', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
                { id: 'neoforge', name: 'NeoForge', desc: 'Next-Gen Fork', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
                { id: 'vanilla', name: 'Vanilla', desc: 'Official Pure MC', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
              ].map((item) => {
                const isSelected = loader === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      sounds.playSwitch();
                      setLoader(item.id as ModLoader);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-600/20 shadow-glow-sm'
                        : 'border-white/[0.08] bg-galaxy-950/60 hover:bg-galaxy-950 hover:border-white/[0.18]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{item.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minecraft Version Picker */}
          <div className="space-y-1.5">
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

            <select
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
            >
              {filteredVersions.length === 0 && (
                <option value={version}>{version}</option>
              )}
              {filteredVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  Minecraft {v.id} ({v.type})
                </option>
              ))}
            </select>
          </div>

          {/* Fabric Loader Version (If Fabric) */}
          {loader === 'fabric' && fabricVersions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Fabric Loader Version</label>
              <select
                value={loaderVersion}
                onChange={(e) => setLoaderVersion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
              >
                {fabricVersions.map((fv) => (
                  <option key={fv} value={fv}>
                    Loader {fv}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick 1-Click Optimization Preset */}
          <div
            onClick={() => setOptimize(!optimize)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
              optimize
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-galaxy-950/50 border-white/[0.08]'
            }`}
          >
            <div className={`p-2 rounded-lg ${optimize ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
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
                Automatically pre-installs Sodium (FPS Boost), Lithium (Server/Physics lag fix), and FerriteCore (RAM optimizer) into this instance.
              </p>
            </div>
          </div>

          {/* Advanced Collapsible */}
          <div className="space-y-3 pt-1 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors py-1"
            >
              <div className="flex items-center space-x-1.5">
                <SettingsIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Memory & Java Settings</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {showAdvanced && (
              <div className="space-y-4 p-3.5 rounded-xl bg-black/30 border border-white/[0.06] animate-in fade-in duration-200">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Allocated Maximum RAM</span>
                    <span className="font-mono text-purple-400 font-bold">{memoryMax} MB ({(memoryMax / 1024).toFixed(1)} GB)</span>
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

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="text-slate-300 font-medium">Java Auto-Matcher</div>
                  <p className="text-slate-500 text-[10px]">
                    Galaxy will automatically use the optimal detected Java runtime ({detectedJava.length} runtimes found on system).
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-xs font-bold shadow-glow-sm hover:shadow-glow-md flex items-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Instance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
