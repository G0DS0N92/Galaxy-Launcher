import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  HardDrive,
  Palette,
  Volume2,
  FolderOpen,
  RefreshCw,
  Check,
  Sparkles,
  ShieldCheck,
  Sliders,
  Flame,
  Trash2
} from 'lucide-react';
import { LauncherSettings, JavaInstallation } from '../../types';
import { sounds } from '../../services/soundEngine';

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

  const handleThemeChange = (theme: LauncherSettings['theme']) => {
    sounds.playSwitch();
    const updated = { ...currentSettings, theme };
    setCurrentSettings(updated);
    document.documentElement.className = `theme-${theme}`;
    document.documentElement.setAttribute('data-theme', theme);
    onSaveSettings(updated);
    onShowToast({
      id: Math.random().toString(),
      type: 'info',
      title: `Applied Theme: ${theme.replace('-', ' ').toUpperCase()}`
    });
  };

  const handleToggleSound = (enabled: boolean) => {
    sounds.setEnabled(enabled);
    const updated = { ...currentSettings, soundEffects: enabled };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

  const handleVolumeChange = (vol: number) => {
    sounds.setVolume(vol);
    const updated = { ...currentSettings, soundVolume: vol };
    setCurrentSettings(updated);
    onSaveSettings(updated);
  };

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
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 select-none bg-galaxy-950/40">
      <div>
        <h2 className="text-xl font-display font-bold text-white tracking-wide">
          Launcher Configuration & Settings
        </h2>
        <p className="text-xs text-slate-400">
          Fine-tune Java engines, memory thresholds, cosmic aesthetics, and system preferences.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* THEMES & VISUALS */}
        <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center space-x-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Cosmic Visual Themes</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { id: 'nebula-purple', name: 'Nebula Purple', color: 'from-purple-600 to-indigo-700', border: 'border-purple-500' },
              { id: 'supernova-cyan', name: 'Supernova Cyan', color: 'from-cyan-500 to-blue-600', border: 'border-cyan-500' },
              { id: 'solar-gold', name: 'Solar Flare', color: 'from-amber-500 to-orange-600', border: 'border-amber-500' },
              { id: 'deep-void', name: 'Deep Void', color: 'from-indigo-900 to-slate-900', border: 'border-indigo-500' },
              { id: 'emerald-aurora', name: 'Emerald Aurora', color: 'from-emerald-500 to-teal-700', border: 'border-emerald-500' },
            ].map((th) => {
              const isSelected = currentSettings.theme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => handleThemeChange(th.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? `${th.border} bg-white/[0.08] shadow-glow-sm`
                      : 'border-white/[0.06] bg-black/30 hover:border-white/[0.15]'
                  }`}
                >
                  <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${th.color} mb-2 flex items-center justify-center`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="text-xs font-semibold text-slate-200 truncate">{th.name}</div>
                </button>
              );
            })}
          </div>

          {/* Background animations toggle */}
          <div className="pt-2 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Interactive Starfield & Nebula</div>
              <div className="text-[11px] text-slate-400">GPU accelerated cosmic background particles</div>
            </div>
            <button
              onClick={() => {
                const updated = { ...currentSettings, backgroundAnimation: !currentSettings.backgroundAnimation };
                setCurrentSettings(updated);
                onSaveSettings(updated);
              }}
              className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                currentSettings.backgroundAnimation ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                currentSettings.backgroundAnimation ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* AUDIO ENGINE */}
        <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Sound Effects</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">UI Audio Feedback</div>
              <div className="text-[11px] text-slate-400">Futuristic sci-fi sound effects on launch and clicks</div>
            </div>
            <button
              onClick={() => handleToggleSound(!currentSettings.soundEffects)}
              className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                currentSettings.soundEffects ? 'bg-cyan-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                currentSettings.soundEffects ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {currentSettings.soundEffects && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Volume</span>
                <span className="font-mono text-cyan-400 font-bold">{Math.round(currentSettings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={currentSettings.soundVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>
          )}
        </div>

        {/* MEMORY & PERFORMANCE */}
        <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Global Memory Allocation</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Default Maximum RAM for Instances</span>
              <span className="font-mono text-emerald-400 font-bold">{currentSettings.defaultRamMax} MB ({(currentSettings.defaultRamMax / 1024).toFixed(1)} GB)</span>
            </div>
            <input
              type="range"
              min="1024"
              max="16384"
              step="512"
              value={currentSettings.defaultRamMax}
              onChange={(e) => handleRamChange(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>2 GB (Vanilla)</span>
              <span>4 GB (Light Mods)</span>
              <span>8 GB (Modpacks)</span>
              <span>16 GB</span>
            </div>
          </div>
        </div>

        {/* JAVA RUNTIME DETECTOR */}
        <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Detected Java Runtimes</h3>
            </div>
            <button
              onClick={handleScanJavaClick}
              disabled={scanning}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
              <span>Scan System</span>
            </button>
          </div>

          <div className="space-y-2">
            {detectedJava.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/30 text-xs text-slate-400 text-center">
                No Java runtimes found on standard paths. Click "Scan System" or add a path.
              </div>
            ) : (
              detectedJava.map((java, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 font-sans">Java {java.majorVersion}</span>
                      <span className="text-[10px] bg-purple-500/15 text-purple-300 px-2 py-0.2 rounded border border-purple-500/30 font-sans">
                        {java.vendor} ({java.arch})
                      </span>
                      {java.isDefault && (
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.2 rounded border border-emerald-500/30 font-sans">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-md">
                      {java.path}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* STORAGE & DIRECTORIES */}
        <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Storage & Data</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">Open Launcher Data Folder</div>
              <div className="text-[11px] text-slate-400">View instances, logs, and config files on disk</div>
            </div>
            <button
              onClick={handleOpenFolder}
              className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open Folder</span>
            </button>
          </div>

          {onOpenOnboarding && (
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Re-run Welcome & Setup Wizard</div>
                <div className="text-[11px] text-slate-400">Revisit the launcher introduction and personalization wizard</div>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenOnboarding();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-cyan-500/30 hover:from-purple-600/50 hover:to-cyan-500/50 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center space-x-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Setup Wizard</span>
              </button>
            </div>
          )}
        </div>

        {/* SOFTWARE UPDATES & VERSION */}
        <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Software Updates & Version</h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              v1.0.0 Stable
            </span>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-semibold text-xs text-slate-200 flex items-center space-x-2">
                  <span>Galaxy Auto-Update Engine</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automatically detects and installs new launcher features, security patches, and performance optimizations.
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
                        message: 'Galaxy Launcher v1.0.0 is up to date.'
                      });
                    }
                  } catch (err: any) {
                    console.warn(err);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm flex items-center justify-center space-x-1.5 transition-all shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Check for Updates</span>
              </button>
            </div>

            {/* Auto Check Toggle */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
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
                  currentSettings.autoCheckUpdates !== false ? 'bg-cyan-600' : 'bg-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  currentSettings.autoCheckUpdates !== false ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* DANGER ZONE / CLEANUP & UNINSTALL */}
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Uninstallation & Data Cleanup</h3>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed space-y-1">
            <p>
              When uninstalling Galaxy Launcher via Windows <strong>Apps & Features</strong> or <strong>Uninstall Galaxy Launcher.exe</strong>, you will be prompted with a choice to completely delete all instances, downloaded mods, shaders, and resource packs.
            </p>
          </div>

          <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-rose-200">Wipe All Launcher Data & Instances</div>
              <div className="text-[11px] text-rose-300/70">Completely delete all local instances, mods, and configuration files</div>
            </div>
            <button
              onClick={async () => {
                const confirmed = window.confirm(
                  'Are you sure you want to completely delete all Galaxy Launcher instances, downloaded mods, shaders, resource packs, and player settings from your PC?'
                );
                if (confirmed) {
                  sounds.playError();
                  await window.galaxy?.wipeAllData();
                  onShowToast({
                    id: Math.random().toString(),
                    type: 'info',
                    title: 'All launcher data wiped',
                    message: 'All instances, mods, and configs have been removed.'
                  });
                  setTimeout(() => window.location.reload(), 1500);
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-xs font-semibold text-rose-200 flex items-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Wipe All Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
