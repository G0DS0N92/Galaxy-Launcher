import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  HardDrive,
  FolderOpen,
  RefreshCw,
  Sparkles,
  Trash2,
  Monitor,
  Gauge,
  Cloud,
  Layers
} from 'lucide-react';
import { LauncherSettings, JavaInstallation, SystemSpecs } from '../../types';
import { sounds } from '../../services/soundEngine';
import { ConfirmModal } from '../common/ConfirmModal';

interface SettingsViewProps {
  settings: LauncherSettings;
  onSaveSettings: (settings: LauncherSettings) => Promise<void>;
  detectedJava: JavaInstallation[];
  onScanJava: () => Promise<void>;
  onShowToast: (toast: any) => void;
  onOpenOnboarding?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  detectedJava,
  onScanJava,
  onShowToast,
  onOpenOnboarding
}) => {
  const [currentSettings, setCurrentSettings] = useState<LauncherSettings>(settings);
  const [scanning, setScanning] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.4');
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs | null>(null);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (window.galaxy?.getAppVersion) {
      window.galaxy.getAppVersion().then((v) => {
        if (v) setAppVersion(v.replace(/^v/i, ''));
      }).catch(() => {});
    }
    if (window.galaxy?.getSystemSpecs) {
      window.galaxy.getSystemSpecs().then((specs) => {
        setSystemSpecs(specs);
      }).catch((err) => console.error('Failed to get system specs:', err));
    }
  }, []);

  const handleRamChange = (max: number) => {
    const updated = { ...currentSettings, defaultRamMax: max };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

  const handleScanJavaClick = async () => {
    sounds.playClick();
    setScanning(true);
    try {
      await onScanJava();
      sounds.playSuccess();
      onShowToast({
        id: Math.random().toString(),
        type: 'success',
        title: `Found ${detectedJava.length} Java Runtimes`
      });
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleOpenFolder = () => {
    sounds.playClick();
    window.galaxy?.openLauncherDir();
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 select-none bg-galaxy-950/40 animate-in fade-in duration-200 custom-scrollbar">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-white tracking-tight">
              Launcher Engine Configuration
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Configure system memory thresholds, JVM execution engines, Minecraft resolutions, and update channels.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Galaxy Core v{appVersion}
          </span>
        </div>
      </div>

      {/* Responsive 2-Column Full Width Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* =========================================================================
            LEFT COLUMN: Engine, Performance, Resolution & Storage
           ========================================================================= */}
        <div className="space-y-6">
          {/* GLOBAL MEMORY ALLOCATION */}
          <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-100 truncate">Global Memory Allocation</h3>
                  <p className="text-[11px] text-slate-400 truncate">Default RAM assigned to newly created Minecraft instances</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-mono text-emerald-300 text-xs font-bold shadow-glow-sm shrink-0 whitespace-nowrap">
                {currentSettings.defaultRamMax} MB ({(currentSettings.defaultRamMax / 1024).toFixed(1)} GB)
              </div>
            </div>

            {/* System Hardware Detection Banner */}
            {systemSpecs && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glow-sm min-w-0">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-xs font-bold text-slate-100 truncate">{systemSpecs.cpuModel}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 whitespace-nowrap">
                        {systemSpecs.cpuCores} Cores
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Total System Memory: <span className="text-slate-200 font-semibold">{(systemSpecs.totalMemoryMb / 1024).toFixed(1)} GB</span> • Free: <span className="text-slate-200">{(systemSpecs.freeMemoryMb / 1024).toFixed(1)} GB</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 sm:pl-3 whitespace-nowrap">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Recommended</span>
                  <span className="text-xs font-mono font-bold text-white bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md inline-block">
                    {systemSpecs.recommendedRamMb} MB ({(systemSpecs.recommendedRamMb / 1024).toFixed(0)} GB)
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <input
                type="range"
                min="1024"
                max="16384"
                step="512"
                value={currentSettings.defaultRamMax}
                onChange={(e) => handleRamChange(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-black/50 rounded-lg"
              />

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {[
                  { label: '2 GB', desc: 'Vanilla', val: 2048 },
                  { label: '4 GB', desc: 'Standard', val: 4096 },
                  { label: '6 GB', desc: 'Modded', val: 6144 },
                  { label: '8 GB', desc: 'Modpacks', val: 8192 },
                  { label: '12 GB', desc: 'Shaders', val: 12288 },
                  { label: '16 GB', desc: 'Extreme', val: 16384 }
                ].map((preset) => {
                  const isActive = currentSettings.defaultRamMax === preset.val;
                  const isRec = preset.val === (systemSpecs?.recommendedRamMb || 4096);
                  return (
                    <button
                      key={preset.val}
                      onClick={() => {
                        sounds.playClick();
                        handleRamChange(preset.val);
                      }}
                      title={isRec ? `Recommended for your system (${preset.label})` : `${preset.label} RAM Preset (${preset.desc})`}
                      className={`p-1.5 sm:p-2 rounded-xl text-center border transition-all min-w-0 overflow-hidden ${
                        isActive
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-glow-sm'
                          : isRec
                          ? 'bg-emerald-500/5 border-emerald-500/30 text-slate-300 hover:border-emerald-500/50'
                          : 'bg-black/30 hover:bg-black/50 border-white/[0.06] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono truncate">{preset.label}</div>
                      <div className={`text-[10px] truncate ${isRec ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                        {isRec ? '★ Rec.' : preset.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Default Resolution Selector */}
            <div className="pt-3 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-200 truncate">Default Game Resolution</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg shrink-0 whitespace-nowrap">
                  {currentSettings.defaultFullscreen ? 'Fullscreen' : `${currentSettings.defaultResolutionWidth || 1920} × ${currentSettings.defaultResolutionHeight || 1080}`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '1440p (2K QHD)', width: 2560, height: 1440, desc: 'Crisp QHD' },
                  { label: '1080p (Full HD)', width: 1920, height: 1080, desc: 'Recommended' },
                  { label: '900p (HD+)', width: 1600, height: 900, desc: 'Balanced' },
                  { label: '720p (HD Ready)', width: 1280, height: 720, desc: 'High FPS' }
                ].map((res) => {
                  const isCur = !currentSettings.defaultFullscreen && (currentSettings.defaultResolutionWidth || 1920) === res.width && (currentSettings.defaultResolutionHeight || 1080) === res.height;
                  return (
                    <button
                      key={`${res.width}x${res.height}`}
                      onClick={() => {
                        sounds.playClick();
                        const updated = {
                          ...currentSettings,
                          defaultResolutionWidth: res.width,
                          defaultResolutionHeight: res.height,
                          defaultFullscreen: false
                        };
                        setCurrentSettings(updated);
                        onSaveSettings(updated);
                      }}
                      title={`${res.label} - ${res.desc}`}
                      className={`p-1.5 sm:p-2 rounded-xl border text-center transition-all min-w-0 overflow-hidden ${
                        isCur
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200 font-bold shadow-glow-sm'
                          : 'border-white/[0.06] bg-black/30 hover:bg-black/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold font-mono truncate">{res.width} × {res.height}</div>
                      <div className={`text-[10px] truncate ${isCur ? 'text-cyan-300 font-semibold' : 'text-slate-500'}`}>{res.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STORAGE & DATA PATHS */}
          <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Storage & Game Directory</h3>
                <p className="text-[11px] text-slate-400">Manage launcher data, instance folders, logs, and mods</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-semibold text-slate-200">Open Launcher Data Directory</div>
                <div className="text-[11px] text-slate-400 truncate">Instances, world saves, screenshots & logs</div>
              </div>
              <button
                onClick={handleOpenFolder}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-all shrink-0 hover:scale-105 active:scale-95"
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Folder</span>
              </button>
            </div>

            {onOpenOnboarding && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-200">Re-run Welcome Wizard</div>
                  <div className="text-[11px] text-slate-400">Revisit the launcher setup & account onboarding</div>
                </div>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenOnboarding();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-cyan-500/30 hover:from-purple-600/50 hover:to-cyan-500/50 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center space-x-1.5 transition-all shrink-0 hover:scale-105 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Setup Wizard</span>
                </button>
              </div>
            )}
          </div>

          {/* DANGER ZONE / CLEANUP */}
          <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-300">Data Cleanup & Reset</h3>
                <p className="text-[11px] text-rose-300/70">Wipe local launcher cache or reset all installations</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-300 leading-relaxed max-w-sm">
                Completely deletes all local instances, downloaded mods, shaders, and configs from disk.
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowWipeModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/60 border border-rose-500/50 text-xs font-semibold text-rose-200 flex items-center space-x-1.5 transition-all shrink-0 hover:scale-105 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Wipe All Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Java Runtimes, Updates, Cloud & Telemetry
           ========================================================================= */}
        <div className="space-y-6">
          {/* DETECTED JAVA RUNTIMES */}
          <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Detected Java Runtimes</h3>
                  <p className="text-[11px] text-slate-400">Auto-detected JVM installations across your system</p>
                </div>
              </div>

              <button
                onClick={handleScanJavaClick}
                disabled={scanning}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-glow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                <span>{scanning ? 'Scanning...' : 'Scan System'}</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {detectedJava.length === 0 ? (
                <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] text-xs text-slate-400 text-center space-y-2">
                  <p>No Java runtimes found in standard paths.</p>
                  <p className="text-[11px] text-slate-500">Galaxy automatically provisions isolated runtime binaries when launching instances.</p>
                </div>
              ) : (
                detectedJava.map((java, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1 min-w-0">
                        <span className="font-bold text-sm text-slate-100">Java {java.majorVersion}</span>
                        <span className="text-[10px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30 font-mono whitespace-nowrap shrink-0">
                          {java.vendor} ({java.arch})
                        </span>
                        {java.isDefault && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 font-semibold whitespace-nowrap shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">Ready</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate bg-black/30 px-2.5 py-1 rounded-lg border border-white/[0.04]">
                      {java.path}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SOFTWARE UPDATES & VERSION */}
          <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-100 truncate">Software Updates & Version</h3>
                  <p className="text-[11px] text-slate-400 truncate">Automatic updates, version sync, and release channels</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-glow-sm shrink-0 whitespace-nowrap">
                v{appVersion} Stable
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-slate-200 flex items-center space-x-2">
                    <span>Galaxy Auto-Update Engine</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Automatically checks GitHub for new launcher releases & updates.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    sounds.playClick();
                    onShowToast({
                      id: Math.random().toString(),
                      type: 'info',
                      title: 'Checking for updates...',
                      message: 'Connecting to update channels.'
                    });
                    try {
                      const res = await window.galaxy?.checkForUpdates();
                      if (res?.status === 'available') {
                        sounds.playSuccess();
                        onShowToast({
                          id: Math.random().toString(),
                          type: 'success',
                          title: `Update v${res.latestVersion} Available!`,
                          message: 'Click Download & Install to update.'
                        });
                      } else if (res?.status === 'not-available') {
                        sounds.playSuccess();
                        onShowToast({
                          id: Math.random().toString(),
                          type: 'info',
                          title: 'You are on the latest version',
                          message: `Galaxy Launcher v${res?.currentVersion || appVersion} is up to date.`
                        });
                      }
                    } catch (err: any) {
                      console.warn(err);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm hover:shadow-glow-md flex items-center justify-center space-x-1.5 transition-all shrink-0 hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check for Updates</span>
                </button>
              </div>

              {/* Auto Check Toggle */}
              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-300">Auto-check on startup</div>
                  <div className="text-[10px] text-slate-500">Silently check for new versions whenever Galaxy Launcher opens</div>
                </div>
                <button
                  onClick={() => {
                    const updated = {
                      ...currentSettings,
                      autoCheckUpdates: currentSettings.autoCheckUpdates === false ? true : false
                    };
                    setCurrentSettings(updated);
                    onSaveSettings(updated);
                  }}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    currentSettings.autoCheckUpdates !== false ? 'bg-cyan-600 shadow-glow-sm' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    currentSettings.autoCheckUpdates !== false ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* GALAXY CLOUD SYNC */}
          <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Galaxy Cloud Sync</h3>
                  <p className="text-[11px] text-slate-400">Cross-device instance backup & cloud synchronization</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                5 GB Free
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Enable Cloud Backups</div>
                  <div className="text-[11px] text-slate-400">
                    Automatically sync instances, configs, and friends to Galaxy Cloud
                  </div>
                </div>
                <button
                  onClick={async () => {
                    sounds.playSwitch();
                    if (window.galaxy) {
                      const state = await window.galaxy.getCloudSyncState();
                      const updated = await window.galaxy.toggleCloudSync(!state.enabled);
                      onShowToast({
                        type: updated.enabled ? 'success' : 'info',
                        title: updated.enabled ? 'Galaxy Cloud Enabled' : 'Galaxy Cloud Disabled'
                      });
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all"
                >
                  Manage in Cloud Tab
                </button>
              </div>
            </div>
          </div>

          {/* COSMIC SYSTEM & ENGINE TELEMETRY */}
          <div className="p-6 rounded-3xl bg-galaxy-900/70 border border-white/[0.08] backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">System & Engine Telemetry</h3>
                <p className="text-[11px] text-slate-400">Hardware environment and runtime status</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Platform OS</div>
                <div className="text-xs font-bold text-slate-200">Windows (x64)</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Electron Core</div>
                <div className="text-xs font-bold text-slate-200">v34.5.8</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Minecraft API</div>
                <div className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Mojang & Modrinth</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Graphics Mode</div>
                <div className="text-xs font-bold text-cyan-300">GPU Accelerated</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wipe All Data Confirm Modal */}
      <ConfirmModal
        isOpen={showWipeModal}
        title="Wipe All Launcher Data"
        subtitle="Full Local Reset"
        type="danger"
        confirmText="Wipe Everything"
        cancelText="Cancel"
        isLoading={isWiping}
        icon={<Trash2 className="w-5 h-5 text-rose-300" />}
        description={
          <div className="space-y-3">
            <p>
              Are you sure you want to completely delete all Galaxy Launcher instances, downloaded mods, shaders, resource packs, and configurations from your PC?
            </p>
            <p className="text-[11px] text-slate-400">
              The launcher directory will be cleanly recreated and restarted in its fresh initial state.
            </p>
          </div>
        }
        onConfirm={async () => {
          setIsWiping(true);
          try {
            await window.galaxy?.wipeAllData();
            setShowWipeModal(false);
            onShowToast({
              id: Math.random().toString(),
              type: 'info',
              title: 'All launcher data wiped',
              message: 'All instances, mods, and configs have been removed.'
            });
            setTimeout(() => window.location.reload(), 1500);
          } finally {
            setIsWiping(false);
          }
        }}
        onClose={() => setShowWipeModal(false)}
      />
    </div>
  );
};
