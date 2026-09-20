import React, { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Instance, Mod, ResourcePack, ShaderPack, WorldSave, JavaInstallation } from '../../types';
import { sounds } from '../../services/soundEngine';

interface InstanceDetailViewProps {
  instance: Instance;
  onBack: () => void;
  onLaunch: (instance: Instance) => void;
  onKill: (instance: Instance) => void;
  onUpdateInstance: (instance: Instance) => Promise<void>;
  onDeleteInstance: (instanceId: string) => Promise<void>;
  onCloneInstance: (instanceId: string, newName: string) => Promise<void>;
  onOpenFolder: (instance: Instance, subDir?: string) => void;
  onNavigateToMarketplace: (type: 'mod' | 'shader' | 'resourcepack') => void;
  onShowToast: (toast: any) => void;
  detectedJava: JavaInstallation[];
}

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
  const [activeTab, setActiveTab] = useState<'mods' | 'resourcepacks' | 'shaderpacks' | 'saves' | 'settings'>('mods');
  const [mods, setMods] = useState<Mod[]>([]);
  const [resourcePacks, setResourcePacks] = useState<ResourcePack[]>([]);
  const [shaderPacks, setShaderPacks] = useState<ShaderPack[]>([]);
  const [worldSaves, setWorldSaves] = useState<WorldSave[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Settings form state
  const [instName, setInstName] = useState(instance.name);
  const [memoryMax, setMemoryMax] = useState(instance.memoryMax || 4096);
  const [jvmArgs, setJvmArgs] = useState(instance.jvmArgs || '');
  const [javaPath, setJavaPath] = useState(instance.javaPath || '');
  const [resWidth, setResWidth] = useState(instance.resolution?.width || 1280);
  const [resHeight, setResHeight] = useState(instance.resolution?.height || 720);

  useEffect(() => {
    loadInstanceData();
  }, [instance.id]);

  const loadInstanceData = async () => {
    setLoading(true);
    try {
      if (window.galaxy) {
        const [m, rp, sp, ws] = await Promise.all([
          window.galaxy.getMods(instance.id),
          window.galaxy.getResourcePacks(instance.id),
          window.galaxy.getShaderPacks(instance.id),
          window.galaxy.getWorldSaves(instance.id)
        ]);
        setMods(m);
        setResourcePacks(rp);
        setShaderPacks(sp);
        setWorldSaves(ws);
      }
    } catch (err) {
      console.error('Failed to load instance sub-assets:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteMod = async (mod: Mod) => {
    sounds.playClick();
    if (confirm(`Are you sure you want to delete mod "${mod.name}"?`)) {
      try {
        await window.galaxy.deleteMod(instance.id, mod.filename);
        await loadInstanceData();
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Deleted ${mod.name}`
        });
      } catch (err) {
        console.error('Failed to delete mod:', err);
      }
    }
  };

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

  const handleClone = async () => {
    const cloneName = prompt('Enter a name for the cloned instance:', `${instance.name} (Copy)`);
    if (cloneName) {
      sounds.playSuccess();
      await onCloneInstance(instance.id, cloneName);
    }
  };

  const handleDeleteInstance = async () => {
    if (confirm(`Are you sure you want to delete "${instance.name}"? This action cannot be undone.`)) {
      sounds.playError();
      await onDeleteInstance(instance.id);
      onBack();
    }
  };

  const filteredMods = mods.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 h-full flex flex-col select-none overflow-hidden bg-galaxy-950/40">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-galaxy-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-display font-bold text-white">{instance.name}</h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {instance.loader}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                MC {instance.version}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {mods.length} mods installed • {instance.memoryMax} MB RAM allocated
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onOpenFolder(instance)}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-colors"
            title="Open Directory"
          >
            <FolderOpen className="w-4 h-4 text-cyan-400" />
          </button>

          {instance.isRunning ? (
            <button
              onClick={() => onKill(instance)}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-2"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>STOP</span>
            </button>
          ) : (
            <button
              onClick={() => onLaunch(instance)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-sm hover:shadow-glow-md flex items-center space-x-2 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center px-6 border-b border-white/[0.06] bg-galaxy-950/40 space-x-6 text-xs">
        {[
          { id: 'mods', label: `Mods (${mods.length})`, icon: Package },
          { id: 'resourcepacks', label: `Resource Packs (${resourcePacks.length})`, icon: Layers },
          { id: 'shaderpacks', label: `Shaders (${shaderPacks.length})`, icon: Sparkles },
          { id: 'saves', label: `World Saves (${worldSaves.length})`, icon: HardDrive },
          { id: 'settings', label: 'Settings', icon: Sliders },
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
              className={`flex items-center space-x-2 py-3 border-b-2 font-medium transition-all ${
                isActive
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* MODS TAB */}
        {activeTab === 'mods' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter installed mods..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-galaxy-900 border border-white/[0.08] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => onOpenFolder(instance, 'mods')}
                  className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-300 flex items-center space-x-1.5 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open Mods Folder</span>
                </button>
                <button
                  onClick={() => onNavigateToMarketplace('mod')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm flex items-center space-x-1.5"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Discover Mods</span>
                </button>
              </div>
            </div>

            {/* Mods Table / List */}
            {filteredMods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center space-y-3 bg-galaxy-900/20">
                <Package className="w-10 h-10 text-slate-600" />
                <div className="text-sm font-semibold text-slate-300">No mods found</div>
                <p className="text-xs text-slate-500 max-w-xs">
                  {searchQuery ? 'No mods matched your search query.' : 'This instance currently has no mods installed.'}
                </p>
                <button
                  onClick={() => onNavigateToMarketplace('mod')}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium shadow-glow-sm"
                >
                  Browse Modrinth Marketplace
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMods.map((mod) => (
                  <div
                    key={mod.filename}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      mod.enabled
                        ? 'bg-galaxy-900/70 border-white/[0.08] hover:border-purple-500/40'
                        : 'bg-galaxy-950/40 border-white/[0.04] opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Toggle switch button */}
                      <button
                        onClick={() => handleToggleMod(mod)}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          mod.enabled ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                        title={mod.enabled ? 'Click to Disable' : 'Click to Enable'}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            mod.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-slate-100">{mod.name}</span>
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                            v{mod.version}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          {mod.description || mod.filename}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                      <span className="text-[10px] font-mono">{(mod.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                      <button
                        onClick={() => handleDeleteMod(mod)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Mod"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESOURCE PACKS TAB */}
        {activeTab === 'resourcepacks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Installed Resource Packs</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenFolder(instance, 'resourcepacks')}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300"
                >
                  Open Folder
                </button>
                <button
                  onClick={() => onNavigateToMarketplace('resourcepack')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-medium"
                >
                  Discover Resource Packs
                </button>
              </div>
            </div>

            {resourcePacks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center space-y-3 bg-galaxy-900/20">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs text-slate-400">No resource packs in this instance</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resourcePacks.map((rp) => (
                  <div key={rp.filename} className="p-3.5 rounded-xl bg-galaxy-900/60 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-100">{rp.name}</div>
                      <div className="text-[11px] text-slate-400">{rp.filename}</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SHADER PACKS TAB */}
        {activeTab === 'shaderpacks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Installed Shader Packs</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenFolder(instance, 'shaderpacks')}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300"
                >
                  Open Folder
                </button>
                <button
                  onClick={() => onNavigateToMarketplace('shader')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-medium"
                >
                  Discover Shaders
                </button>
              </div>
            </div>

            {shaderPacks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center space-y-3 bg-galaxy-900/20">
                <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs text-slate-400">No shader packs installed (e.g. BSL, Complementary)</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shaderPacks.map((sp) => (
                  <div key={sp.filename} className="p-3.5 rounded-xl bg-galaxy-900/60 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-100">{sp.name}</div>
                      <div className="text-[11px] text-slate-400">{sp.filename}</div>
                    </div>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WORLD SAVES TAB */}
        {activeTab === 'saves' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Singleplayer Worlds</span>
              <button
                onClick={() => onOpenFolder(instance, 'saves')}
                className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300"
              >
                Open Saves Folder
              </button>
            </div>

            {worldSaves.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center space-y-3 bg-galaxy-900/20">
                <HardDrive className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs text-slate-400">No singleplayer worlds found</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {worldSaves.map((w) => (
                  <div key={w.folderName} className="p-3.5 rounded-xl bg-galaxy-900/60 border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-slate-100">{w.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Last played {new Date(w.lastPlayed).toLocaleDateString()}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {w.gameMode}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Instance Configuration</h4>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Instance Name</label>
                <input
                  type="text"
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* RAM Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Memory Allocation (Max RAM)</span>
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
              </div>

              {/* Java Path */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Java Runtime Override (Optional)</label>
                <select
                  value={javaPath}
                  onChange={(e) => setJavaPath(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Auto-Detect Compatible Java</option>
                  {detectedJava.map((j) => (
                    <option key={j.path} value={j.path}>
                      Java {j.majorVersion} ({j.vendor}) — {j.path}
                    </option>
                  ))}
                </select>
              </div>

              {/* JVM Arguments */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Custom JVM Arguments</label>
                <input
                  type="text"
                  value={jvmArgs}
                  onChange={(e) => setJvmArgs(e.target.value)}
                  placeholder="-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Resolution */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Window Width</label>
                  <input
                    type="number"
                    value={resWidth}
                    onChange={(e) => setResWidth(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Window Height</label>
                  <input
                    type="number"
                    value={resHeight}
                    onChange={(e) => setResHeight(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-glow-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-4">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Instance Management</h4>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleClone}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-medium text-slate-300 flex items-center space-x-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Clone Instance</span>
                </button>
                <button
                  onClick={handleDeleteInstance}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-medium text-rose-300 flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Instance</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
