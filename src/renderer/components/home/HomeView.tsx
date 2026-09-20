import React from 'react';
import {
  Play,
  Square,
  Sparkles,
  Zap,
  HardDrive,
  Cpu,
  Layers,
  ChevronRight,
  Plus,
  FolderOpen,
  Settings as SettingsIcon,
  ShieldCheck,
  Flame,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Instance, Account, LaunchProgress } from '../../types';
import { sounds } from '../../services/soundEngine';

interface HomeViewProps {
  instances: Instance[];
  selectedInstance: Instance | null;
  onSelectInstance: (instance: Instance) => void;
  onLaunch: (instance: Instance) => void;
  onKill: (instance: Instance) => void;
  launchProgress: LaunchProgress | null;
  activeAccount: Account | null;
  onOpenInstanceDetails: (instance: Instance) => void;
  onCreateInstance: () => void;
  onOpenFolder: (instance: Instance) => void;
  onOptimizeInstance: (instance: Instance) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  instances,
  selectedInstance,
  onSelectInstance,
  onLaunch,
  onKill,
  launchProgress,
  activeAccount,
  onOpenInstanceDetails,
  onCreateInstance,
  onOpenFolder,
  onOptimizeInstance
}) => {
  const isLaunching = launchProgress && selectedInstance && launchProgress.instanceId === selectedInstance.id;
  const isRunning = selectedInstance?.isRunning;

  const getLoaderColor = (loader: string) => {
    switch (loader) {
      case 'fabric':
        return 'from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30';
      case 'forge':
        return 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30';
      case 'neoforge':
        return 'from-orange-500/20 to-red-500/20 text-orange-300 border-orange-500/30';
      case 'quilt':
        return 'from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  if (instances.length === 0) {
    return (
      <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 flex flex-col items-center justify-center select-none animate-in fade-in duration-300">
        <div className="max-w-3xl w-full space-y-8">
          {/* Main Hero Card for Brand New User */}
          <div className="relative rounded-3xl overflow-hidden border border-white/[0.12] bg-gradient-to-b from-galaxy-800/90 via-galaxy-900/95 to-galaxy-950 p-8 md:p-12 shadow-2xl text-center space-y-6">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

            {/* Glowing Orbit Icon */}
            <div className="relative z-10 mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 shadow-glow-md flex items-center justify-center">
              <div className="w-full h-full bg-galaxy-950/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-cyan-300 animate-pulse" />
              </div>
            </div>

            {/* Title & Tagline */}
            <div className="relative z-10 space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold">
                <span>NEW INSTALLATION • NO INSTANCES FOUND</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight">
                Your Universe of Minecraft Awaits
              </h1>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                You do not have any Minecraft instances installed yet. Create a brand new isolated profile with Fabric, Forge, NeoForge, Quilt, or pure Vanilla to begin your adventure.
              </p>
            </div>

            {/* Primary Call-to-Action Button */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  onCreateInstance();
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 hover:from-purple-500 hover:to-cyan-300 text-white font-display font-bold text-sm shadow-glow-md hover:shadow-glow-lg flex items-center justify-center space-x-2.5 transition-all transform hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span className="tracking-wide">CREATE FIRST INSTANCE</span>
              </button>
            </div>

            {/* Supported Mod Loaders Pill Row */}
            <div className="relative z-10 pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500 font-sans">Supported Loaders:</span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/25">Fabric</span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25">Forge</span>
              <span className="px-2 py-0.5 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/25">NeoForge</span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/25">Quilt</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">Vanilla</span>
            </div>
          </div>

          {/* 3 Step Quick Start Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => {
                sounds.playClick();
                onCreateInstance();
              }}
              className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] hover:border-purple-500/40 cursor-pointer transition-all space-y-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-100 flex items-center justify-between">
                  <span>1. Create Instance</span>
                  <Plus className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Choose your Minecraft release, mod loader, and custom RAM limits.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-100">2. Modrinth Marketplace</div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  1-click install Sodium, Iris shaders, physics mods, and full modpacks.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-galaxy-900/60 border border-white/[0.08] space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-100">3. High-FPS Launch</div>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Launch with automatic Java version matching and isolated profiles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 select-none">
      {/* Hero Banner Section */}
      {selectedInstance && (
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-gradient-to-b from-galaxy-800/80 via-galaxy-900/90 to-galaxy-950/95 backdrop-blur-xl shadow-2xl p-7">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Instance Details */}
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium uppercase border ${getLoaderColor(selectedInstance.loader)}`}>
                  {selectedInstance.loader} {selectedInstance.loaderVersion ? `(${selectedInstance.loaderVersion})` : ''}
                </span>
                <span className="text-xs font-mono text-slate-400 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.08]">
                  MC {selectedInstance.version}
                </span>
                {selectedInstance.isOptimized && (
                  <span className="flex items-center space-x-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>Boosted</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-display font-extrabold text-white tracking-tight">
                {selectedInstance.name}
              </h1>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                Launch into your isolated Minecraft instance. Fast classpath assembly, seamless mod loading, and high-performance JVM optimization.
              </p>

              {/* Hardware & Spec Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
                <div className="flex items-center space-x-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/[0.06]">
                  <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                  <span>{selectedInstance.memoryMax} MB RAM</span>
                </div>
                <div className="flex items-center space-x-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/[0.06]">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{selectedInstance.resolution.width}x{selectedInstance.resolution.height}</span>
                </div>
                {selectedInstance.lastPlayed && (
                  <div className="flex items-center space-x-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/[0.06]">
                    <span>Played {new Date(selectedInstance.lastPlayed).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Action Hub */}
            <div className="flex flex-col items-center md:items-end space-y-3 min-w-[220px]">
              {isRunning ? (
                <button
                  onClick={() => {
                    sounds.playError();
                    onKill(selectedInstance);
                  }}
                  className="w-full py-4 px-8 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-glow-sm hover:shadow-glow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>STOP GAME</span>
                </button>
              ) : (
                <button
                  disabled={Boolean(isLaunching)}
                  onClick={() => {
                    sounds.playLaunch();
                    onLaunch(selectedInstance);
                  }}
                  className={`w-full py-4 px-8 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 hover:from-purple-500 hover:to-cyan-300 text-white font-bold text-base shadow-glow-md hover:shadow-glow-lg flex items-center justify-center space-x-2.5 transition-all transform hover:scale-[1.03] active:scale-[0.98] ${
                    isLaunching ? 'opacity-80 cursor-wait' : ''
                  }`}
                >
                  {isLaunching ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>STARTING...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span className="tracking-wider font-display">PLAY NOW</span>
                    </>
                  )}
                </button>
              )}

              {/* Quick Actions Row */}
              <div className="flex items-center space-x-2 w-full">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenInstanceDetails(selectedInstance);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Configure</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onOpenFolder(selectedInstance);
                  }}
                  className="py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-slate-300 flex items-center justify-center transition-colors"
                  title="Open Instance Directory"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                </button>
                <button
                  onClick={() => {
                    sounds.playSuccess();
                    onOptimizeInstance(selectedInstance);
                  }}
                  className="py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-medium text-emerald-300 flex items-center justify-center space-x-1 transition-colors"
                  title="1-Click Performance Boost (Sodium/Iris/Lithium)"
                >
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Boost</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Launch Progress Bar */}
          {isLaunching && (
            <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300 font-medium flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  <span>{launchProgress.step}</span>
                </span>
                <span className="text-cyan-400">{launchProgress.progress}%</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
                  style={{ width: `${launchProgress.progress}%` }}
                />
              </div>
              {launchProgress.details && (
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {launchProgress.details}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instances Grid / Quick Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-display font-bold text-white tracking-wide">
              Installed Instances
            </h2>
            <span className="text-xs font-mono text-slate-400 bg-white/[0.06] px-2 py-0.5 rounded-full">
              {instances.length}
            </span>
          </div>
          <button
            onClick={onCreateInstance}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {instances.map((inst) => {
            const isSelected = selectedInstance?.id === inst.id;
            return (
              <div
                key={inst.id}
                onClick={() => {
                  sounds.playClick();
                  onSelectInstance(inst);
                }}
                className={`group relative p-4 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-galaxy-800/90 border-purple-500/50 shadow-glow-sm'
                    : 'bg-galaxy-900/50 hover:bg-galaxy-850/80 border-white/[0.06] hover:border-white/[0.15]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded uppercase border ${getLoaderColor(inst.loader)}`}>
                        {inst.loader}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {inst.version}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-slate-100 group-hover:text-purple-300 transition-colors">
                      {inst.name}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      onOpenInstanceDetails(inst);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                    title="Instance Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{inst.memoryMax} MB RAM</span>
                  {inst.isRunning ? (
                    <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>RUNNING</span>
                    </span>
                  ) : (
                    <span>{inst.lastPlayed ? new Date(inst.lastPlayed).toLocaleDateString() : 'Never played'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cosmic Feature Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl bg-galaxy-900/50 border border-white/[0.06] flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-200">Total Instance Isolation</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every profile keeps separate mods, configs, saves, and shaderpacks without polluting other instances.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-galaxy-900/50 border border-white/[0.06] flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-200">Modrinth & Shaders Hub</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Discover and 1-click install thousands of mods, Iris shaders, and resource packs directly inside Galaxy.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-galaxy-900/50 border border-white/[0.06] flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-200">Auto Java Matcher</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Automatically identifies and routes Java 8, 17, or 21 according to Minecraft version rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
