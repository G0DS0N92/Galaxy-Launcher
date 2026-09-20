import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Puzzle,
  Coffee,
  Cpu,
  HardDrive,
  FolderCheck,
  Flame,
  Download,
  Trash2,
  Zap,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { Instance, InstanceHealthReport, HealthModConflict, HealthModUpdate } from '../../../preload/types';
import { sounds } from '../../services/soundEngine';

interface InstanceHealthModalProps {
  instance: Instance;
  onClose: () => void;
  onInstanceUpdated?: (updatedInstance: Instance) => void;
}

export const InstanceHealthModal: React.FC<InstanceHealthModalProps> = ({
  instance,
  onClose,
  onInstanceUpdated
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<InstanceHealthReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'conflicts' | 'updates' | 'mods' | 'java' | 'memory' | 'crashes'>('overview');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<HealthModConflict | null>(null);

  const runCheckup = async () => {
    setLoading(true);
    setActionMessage(null);
    sounds.playSwitch();
    try {
      if (window.galaxy?.checkInstanceHealth) {
        const res = await window.galaxy.checkInstanceHealth(instance.id);
        setReport(res);
        if (res.score >= 85) sounds.playSuccess();
        else if (res.score < 60) sounds.playError();
      }
    } catch (err: any) {
      console.error('Health checkup error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheckup();
  }, [instance.id]);

  // 1-Click Fix: Update Single Mod
  const handleUpdateSingleMod = async (update: HealthModUpdate) => {
    setActionLoading(`update-${update.oldFileName}`);
    sounds.playSwitch();
    try {
      const ok = await window.galaxy.updateHealthMod(
        instance.id,
        update.oldFileName,
        update.downloadUrl,
        update.newFileName,
        update.sha1
      );
      if (ok) {
        sounds.playSuccess();
        setActionMessage({ type: 'success', text: `Updated ${update.modName} to ${update.latestVersion}!` });
        await runCheckup();
      } else {
        sounds.playError();
        setActionMessage({ type: 'error', text: `Failed to update ${update.modName}.` });
      }
    } catch (err: any) {
      sounds.playError();
      setActionMessage({ type: 'error', text: err.message || 'Update failed' });
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Fix: Update All Outdated Mods
  const handleUpdateAll = async () => {
    if (!report?.mods.updates || report.mods.updates.length === 0) return;
    setActionLoading('update-all');
    sounds.playLaunch();
    try {
      const items = report.mods.updates.map(u => ({
        oldFileName: u.oldFileName,
        downloadUrl: u.downloadUrl,
        newFileName: u.newFileName,
        sha1: u.sha1
      }));

      const res = await window.galaxy.updateAllHealthMods(instance.id, items);
      sounds.playSuccess();
      setActionMessage({
        type: 'success',
        text: `Successfully updated ${res.updated} mod${res.updated === 1 ? '' : 's'}!${res.failed > 0 ? ` (${res.failed} failed)` : ''}`
      });
      await runCheckup();
    } catch (err: any) {
      sounds.playError();
      setActionMessage({ type: 'error', text: err.message || 'Update all failed' });
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Fix: Disable Conflicting Mod
  const handleDisableMod = async (fileName: string) => {
    setActionLoading(`disable-${fileName}`);
    sounds.playSwitch();
    try {
      const ok = await window.galaxy.disableHealthMod(instance.id, fileName);
      if (ok) {
        sounds.playSuccess();
        setActionMessage({ type: 'success', text: `Disabled ${fileName} (renamed to .disabled).` });
        setSelectedConflict(null);
        await runCheckup();
      } else {
        sounds.playError();
        setActionMessage({ type: 'error', text: `Failed to disable ${fileName}.` });
      }
    } catch (err: any) {
      sounds.playError();
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Fix: Install Missing Dependency
  const handleInstallDependency = async (slug: string) => {
    setActionLoading(`install-${slug}`);
    sounds.playLaunch();
    try {
      const ok = await window.galaxy.installHealthDependency(instance.id, slug);
      if (ok) {
        sounds.playSuccess();
        setActionMessage({ type: 'success', text: `Installed ${slug} from Modrinth!` });
        await runCheckup();
      } else {
        sounds.playError();
        setActionMessage({ type: 'error', text: `Could not auto-fetch ${slug} for Minecraft ${instance.version}.` });
      }
    } catch (err: any) {
      sounds.playError();
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Fix: Optimize RAM
  const handleOptimizeRam = async (recommendedMb: number) => {
    setActionLoading('optimize-ram');
    sounds.playSwitch();
    try {
      const ok = await window.galaxy.optimizeHealthRam(instance.id, recommendedMb);
      if (ok) {
        sounds.playSuccess();
        setActionMessage({ type: 'success', text: `Optimized instance RAM allocation to ${recommendedMb} MB!` });
        if (onInstanceUpdated) {
          onInstanceUpdated({ ...instance, memoryMax: recommendedMb });
        }
        await runCheckup();
      }
    } catch (err: any) {
      sounds.playError();
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  // 1-Click Fix: Fix Java Runtime
  const handleFixJava = async () => {
    setActionLoading('fix-java');
    sounds.playLaunch();
    try {
      const requiredMajor = parseInt(report?.java.requiredVersion.replace(/[^0-9]/g, '') || '21', 10);
      const installed = await window.galaxy.downloadJava(requiredMajor);
      sounds.playSuccess();
      setActionMessage({ type: 'success', text: `Installed Eclipse Adoptium Java ${installed.majorVersion} LTS!` });
      await runCheckup();
    } catch (err: any) {
      sounds.playError();
      setActionMessage({ type: 'error', text: err.message || 'Java setup failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getScoreBadgeText = (score: number) => {
    if (score >= 85) return 'HEALTHY & OPTIMAL';
    if (score >= 60) return 'DEGRADED / WARNINGS';
    return 'CRITICAL ISSUES FOUND';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-galaxy-950/95 border border-white/[0.12] rounded-3xl shadow-glow-lg overflow-hidden backdrop-blur-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-glow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">Galaxy Health Checkup</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-theme-accent/20 text-theme-accent border border-theme-accent/30">
                  {instance.loader} • MC {instance.version}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diagnostic analysis & self-healing engine for <span className="text-slate-200 font-semibold">{instance.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={runCheckup}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
              title="Re-run Diagnostic Scan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span>{loading ? 'Scanning...' : 'Re-Scan'}</span>
            </button>
            <button
              onClick={() => {
                sounds.playSwitch();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action / Notification Toast inside modal */}
        {actionMessage && (
          <div className={`px-6 py-2.5 flex items-center justify-between text-xs font-semibold ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
          }`}>
            <div className="flex items-center space-x-2">
              {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-6 pt-3 border-b border-white/[0.06] bg-black/20 overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', label: 'Overview & Score', icon: ShieldCheck, badge: report ? `${report.score}/100` : undefined },
            {
              id: 'conflicts',
              label: 'Conflicts & Warnings',
              icon: AlertTriangle,
              badge: (report?.mods.conflicts.length || 0) + (report?.mods.missingDependencies.length || 0),
              badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            },
            {
              id: 'updates',
              label: 'Outdated Mods',
              icon: Download,
              badge: report?.mods.updates.length || 0,
              badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            },
            { id: 'mods', label: `All Mods (${report?.mods.totalInstalled || 0})`, icon: Puzzle },
            { id: 'java', label: 'Java Check', icon: Coffee },
            { id: 'memory', label: 'Memory', icon: HardDrive },
            { id: 'crashes', label: `Crash Logs (${report?.crashes.recentCrashCount || 0})`, icon: Flame }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playSwitch();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-t-xl text-xs font-semibold tracking-wide border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-theme-accent text-white bg-white/[0.04]'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-theme-accent' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && Number(tab.badge) > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${tab.badgeColor || 'bg-white/[0.1] text-slate-300'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <Stethoscope className="w-7 h-7 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white tracking-wide">Analyzing Instance Health...</h3>
                <p className="text-xs text-slate-400">Scanning mods, Modrinth update records, Java compatibility & RAM allocation</p>
              </div>
            </div>
          ) : !report ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No report data available. Please re-run scan.
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & SCORE */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Health Score Hero Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent border border-white/[0.08] shadow-inner flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-5">
                      <div className={`w-20 h-20 rounded-3xl border-2 flex flex-col items-center justify-center shadow-glow-md ${getScoreColor(report.score)}`}>
                        <span className="text-2xl font-black font-mono tracking-tighter">{report.score}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">/ 100</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${report.score >= 85 ? 'bg-emerald-400 animate-pulse' : report.score >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                          <h3 className="text-base font-bold text-white tracking-wide">{getScoreBadgeText(report.score)}</h3>
                        </div>
                        <p className="text-xs text-slate-400 max-w-md">
                          {report.score >= 85
                            ? 'All core systems, Java version, and mod dependencies are verified compatible.'
                            : report.score >= 60
                              ? 'Some mods have available updates or minor warnings detected.'
                              : 'Action required: Conflicts or missing dependencies will cause launch failure.'}
                        </p>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Last scanned: {new Date(report.scannedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                      {report.mods.updates.length > 0 && (
                        <button
                          onClick={handleUpdateAll}
                          disabled={actionLoading === 'update-all'}
                          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-glow-sm hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span>{actionLoading === 'update-all' ? 'Updating Mods...' : `Update All (${report.mods.updates.length})`}</span>
                        </button>
                      )}
                      <button
                        onClick={runCheckup}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-white text-xs font-bold transition-all"
                      >
                        <RefreshCw className="w-4 h-4 text-cyan-400" />
                        <span>Run Full Checkup</span>
                      </button>
                    </div>
                  </div>

                  {/* Diagnostic Checklist Cards (Matching User Mockup) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    
                    {/* 1. MODS */}
                    <div
                      onClick={() => {
                        sounds.playSwitch();
                        setActiveTab(report.mods.conflicts.length > 0 ? 'conflicts' : report.mods.updates.length > 0 ? 'updates' : 'mods');
                      }}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                          <Puzzle className="w-4 h-4 text-purple-400" />
                          <span>MODS</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{report.mods.compatibleCount} Compatible</span>
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">✓</span>
                        </div>
                        {report.mods.outdatedCount > 0 && (
                          <div className="flex items-center justify-between text-amber-300">
                            <span className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>{report.mods.outdatedCount} Outdated</span>
                            </span>
                            <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-300">Update</span>
                          </div>
                        )}
                        {report.mods.conflictCount > 0 && (
                          <div className="flex items-center justify-between text-rose-300 font-semibold">
                            <span className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                              <span>{report.mods.conflictCount} Conflicts</span>
                            </span>
                            <span className="text-[10px] font-mono bg-rose-500/20 px-1.5 py-0.2 rounded text-rose-300">Action</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. JAVA */}
                    <div
                      onClick={() => {
                        sounds.playSwitch();
                        setActiveTab('java');
                      }}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <span>JAVA</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 truncate">{report.java.installedVersion}</span>
                        <span className={`text-[11px] font-mono font-bold ${report.java.isCompatible ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {report.java.isCompatible ? '✓ Compatible' : '🔴 Incompatible'}
                        </span>
                      </div>
                    </div>

                    {/* 3. LOADER */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <span>LOADER</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 uppercase font-mono">{report.loader}</span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">✓ Compatible</span>
                      </div>
                    </div>

                    {/* 4. MEMORY */}
                    <div
                      onClick={() => {
                        sounds.playSwitch();
                        setActiveTab('memory');
                      }}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                          <HardDrive className="w-4 h-4 text-indigo-400" />
                          <span>MEMORY</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-mono">{report.memory.allocatedMaxMb} MB RAM</span>
                        <span className={`text-[11px] font-mono font-bold capitalize ${
                          report.memory.status === 'optimal'
                            ? 'text-emerald-400'
                            : report.memory.status === 'warning'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                        }`}>
                          {report.memory.status === 'optimal' ? '✓ Optimal' : `⚠️ ${report.memory.status}`}
                        </span>
                      </div>
                    </div>

                    {/* 5. INSTANCE FILES */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                          <FolderCheck className="w-4 h-4 text-blue-400" />
                          <span>INSTANCE FILES</span>
                        </div>
                        <span className={`w-2 h-2 rounded-full ${report.files.isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{report.files.issues.length} Issues</span>
                        <span className={`text-[11px] font-mono font-bold ${report.files.isHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {report.files.isHealthy ? '✓ Healthy' : '⚠️ Attention'}
                        </span>
                      </div>
                    </div>

                    {/* 6. CRASH HISTORY */}
                    <div
                      onClick={() => {
                        sounds.playSwitch();
                        setActiveTab('crashes');
                      }}
                      className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer group space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                          <Flame className="w-4 h-4 text-orange-400" />
                          <span>CRASH HISTORY</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{report.crashes.recentCrashCount} Recent</span>
                        <span className={`text-[11px] font-mono font-bold ${report.crashes.recentCrashCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {report.crashes.recentCrashCount === 0 ? '✓ Clean' : '⚠️ Logs Available'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: CONFLICTS & WARNINGS */}
              {activeTab === 'conflicts' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Mod Conflicts & Missing Dependencies ({report.mods.conflicts.length + report.mods.missingDependencies.length})</span>
                    </h3>
                  </div>

                  {report.mods.conflicts.length === 0 && report.mods.missingDependencies.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">No Mod Conflicts Detected!</h4>
                      <p className="text-xs text-slate-400">All installed mods in this instance are compatible and verified.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Missing Dependencies */}
                      {report.mods.missingDependencies.map((dep, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              <span className="text-xs font-bold text-amber-300">Missing Core Dependency: {dep.requiredDependency}</span>
                            </div>
                            <p className="text-xs text-slate-300">
                              Fabric instances require <span className="font-semibold text-white">{dep.requiredDependency}</span> to properly load mod hooks and events.
                            </p>
                          </div>
                          <button
                            onClick={() => handleInstallDependency(dep.dependencySlug)}
                            disabled={actionLoading === `install-${dep.dependencySlug}`}
                            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shrink-0 shadow-glow-sm"
                          >
                            {actionLoading === `install-${dep.dependencySlug}` ? 'Installing...' : 'Install Dependency'}
                          </button>
                        </div>
                      ))}

                      {/* Conflicts */}
                      {report.mods.conflicts.map((conflict, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                              <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                                {conflict.type === 'duplicate' ? 'Duplicate Mod Detected' : 'Conflict Detected'}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/20 px-2 py-0.5 rounded-md">
                              ERROR
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs text-slate-200">
                            <span className="px-2 py-1 rounded-lg bg-white/[0.08] font-bold font-mono">{conflict.modA}</span>
                            <span className="text-rose-400 font-bold">conflicts with</span>
                            <span className="px-2 py-1 rounded-lg bg-white/[0.08] font-bold font-mono">{conflict.modB}</span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">{conflict.description}</p>
                          {conflict.suggestion && (
                            <p className="text-xs text-slate-400 italic">Fix advice: {conflict.suggestion}</p>
                          )}

                          <div className="flex items-center space-x-2 pt-1">
                            {conflict.fixTargetFile && (
                              <button
                                onClick={() => handleDisableMod(conflict.fixTargetFile!)}
                                disabled={actionLoading === `disable-${conflict.fixTargetFile}`}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all"
                              >
                                {actionLoading === `disable-${conflict.fixTargetFile}` ? 'Disabling...' : `Disable ${conflict.fixTargetFile}`}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: OUTDATED MODS */}
              {activeTab === 'updates' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Download className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white">Mod Updates Available ({report.mods.updates.length})</h3>
                    </div>

                    {report.mods.updates.length > 0 && (
                      <button
                        onClick={handleUpdateAll}
                        disabled={actionLoading === 'update-all'}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-glow-sm"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>{actionLoading === 'update-all' ? 'Updating All...' : 'UPDATE ALL'}</span>
                      </button>
                    )}
                  </div>

                  {report.mods.updates.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">All Mods Are Up to Date!</h4>
                      <p className="text-xs text-slate-400">All mods match their latest compatible releases on Modrinth.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {report.mods.updates.map((upd, i) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.14] flex items-center justify-between gap-4 transition-all">
                          <div className="space-y-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{upd.modName}</div>
                            <div className="flex items-center space-x-2 text-[11px] font-mono">
                              <span className="text-slate-400 line-through">{upd.currentVersion}</span>
                              <span className="text-amber-400 font-bold">➔ {upd.latestVersion}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleUpdateSingleMod(upd)}
                            disabled={actionLoading === `update-${upd.oldFileName}`}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:text-white transition-all shrink-0"
                          >
                            {actionLoading === `update-${upd.oldFileName}` ? 'Updating...' : 'Update'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ALL INSTALLED MODS */}
              {activeTab === 'mods' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Installed Mods ({report.mods.items.length})</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {report.mods.items.map((mod, i) => (
                      <div key={i} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        mod.disabled
                          ? 'bg-white/[0.01] border-white/[0.04] opacity-60'
                          : 'bg-white/[0.03] border-white/[0.08]'
                      }`}>
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs font-bold text-white truncate">{mod.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            v{mod.version} • <span className="text-slate-500">{mod.fileName}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                          mod.disabled
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {mod.disabled ? 'DISABLED' : 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: JAVA CHECK */}
              {activeTab === 'java' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Coffee className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Java Runtime Alignment</h4>
                          <p className="text-xs text-slate-400">Minecraft {instance.version} JVM Requirements</p>
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        report.java.isCompatible
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                      }`}>
                        {report.java.isCompatible ? '✓ COMPATIBLE' : '🔴 INCOMPATIBLE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                        <span className="text-slate-400 block mb-1">Installed / Detected</span>
                        <span className="font-bold text-white font-mono">{report.java.installedVersion}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                        <span className="text-slate-400 block mb-1">Mojang Requirement</span>
                        <span className="font-bold text-theme-accent font-mono">{report.java.requiredVersion}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">{report.java.message}</p>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      Java Path: {report.java.javaPath}
                    </div>

                    {!report.java.isCompatible && (
                      <button
                        onClick={handleFixJava}
                        disabled={actionLoading === 'fix-java'}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs transition-all shadow-glow-md"
                      >
                        {actionLoading === 'fix-java' ? 'Downloading Java LTS...' : 'Fix Java (Auto-Download Adoptium Temurin)'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: MEMORY CHECK */}
              {activeTab === 'memory' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">RAM & Memory Allocation</h4>
                          <p className="text-xs text-slate-400">Optimized for {report.mods.totalInstalled} installed mods</p>
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono capitalize ${
                        report.memory.status === 'optimal'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {report.memory.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                        <span className="text-slate-400 block mb-1">Allocated RAM</span>
                        <span className="font-bold text-white font-mono">{report.memory.allocatedMaxMb} MB</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                        <span className="text-slate-400 block mb-1">Recommended</span>
                        <span className="font-bold text-emerald-400 font-mono">{report.memory.recommendedMaxMb} MB</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                        <span className="text-slate-400 block mb-1">Total System RAM</span>
                        <span className="font-bold text-slate-300 font-mono">{report.memory.totalSystemRamMb} MB</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300">{report.memory.message}</p>

                    {report.memory.status !== 'optimal' && (
                      <button
                        onClick={() => handleOptimizeRam(report.memory.recommendedMaxMb)}
                        disabled={actionLoading === 'optimize-ram'}
                        className="px-4 py-2.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs transition-all shadow-glow-sm"
                      >
                        {actionLoading === 'optimize-ram' ? 'Optimizing...' : `Optimize RAM to ${report.memory.recommendedMaxMb} MB`}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: CRASH LOGS */}
              {activeTab === 'crashes' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Crash History & Error Tracebacks ({report.crashes.recentCrashCount})</span>
                    </h3>
                  </div>

                  {report.crashes.recentCrashCount === 0 ? (
                    <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-bold text-white">Clean Crash History!</h4>
                      <p className="text-xs text-slate-400">No recent crash reports found in this instance directory.</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                      <div className="text-xs font-bold text-slate-200">Latest Crash Snippet:</div>
                      <pre className="p-3 rounded-xl bg-black/50 border border-white/[0.06] text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {report.crashes.latestCrashSummary}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            <span>Galaxy Engine Diagnostic & Auto-Healing System</span>
          </div>

          <button
            onClick={() => {
              sounds.playSwitch();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
