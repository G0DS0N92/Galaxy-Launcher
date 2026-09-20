import React, { useState } from 'react';
import {
  Sparkles,
  DownloadCloud,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowRight,
  Zap,
  RotateCcw
} from 'lucide-react';
import { UpdateStatus } from '../../types';
import { sounds } from '../../services/soundEngine';

interface UpdateModalProps {
  updateStatus: UpdateStatus | null;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateStatus, onDismiss }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const isNewer = (latest?: string, current?: string): boolean => {
    if (!latest || !current) return false;
    const clean = (v: string) => v.trim().replace(/^v/i, '');
    if (clean(latest) === clean(current)) return false;

    const parse = (v: string) => clean(v).split(/[-+.]/).map((n) => parseInt(n, 10) || 0);
    const [lMaj = 0, lMin = 0, lPat = 0, lBuild = 0] = parse(latest);
    const [cMaj = 0, cMin = 0, cPat = 0, cBuild = 0] = parse(current);

    if (lMaj > cMaj) return true;
    if (lMaj < cMaj) return false;
    if (lMin > cMin) return true;
    if (lMin < cMin) return false;
    if (lPat > cPat) return true;
    if (lPat < cPat) return false;
    return lBuild > cBuild;
  };

  const hasValidNewerVersion = Boolean(
    updateStatus &&
    updateStatus.latestVersion &&
    isNewer(updateStatus.latestVersion, updateStatus.currentVersion)
  );

  const shouldShow =
    hasValidNewerVersion &&
    (updateStatus?.status === 'available' ||
     updateStatus?.status === 'downloading' ||
     updateStatus?.status === 'downloaded');

  if (!shouldShow || !updateStatus) {
    return null;
  }

  const handleStartDownload = async () => {
    sounds.playClick();
    setIsDownloading(true);
    try {
      await window.galaxy?.downloadUpdate();
    } catch (e) {
      console.error('Download update error:', e);
      setIsDownloading(false);
    }
  };

  const handleRestartAndInstall = () => {
    sounds.playSuccess();
    window.galaxy?.quitAndInstallUpdate();
  };

  const formatSpeed = (bytesPerSec?: number) => {
    if (!bytesPerSec) return '';
    const mb = bytesPerSec / (1024 * 1024);
    return `${mb.toFixed(1)} MB/s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-galaxy-900 via-galaxy-900 to-galaxy-950 border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-galaxy-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shadow-glow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white tracking-wide">
                Galaxy Launcher Update
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Direct in-app instant update engine
              </p>
            </div>
          </div>

          {updateStatus.status !== 'downloading' && (
            <button
              onClick={() => {
                sounds.playClick();
                onDismiss();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-6 space-y-5">
          {/* Version Transition Badge */}
          <div className="flex items-center justify-center space-x-3 p-3.5 rounded-xl bg-galaxy-950/70 border border-white/[0.08]">
            <span className="text-xs font-mono text-slate-400 bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/[0.06]">
              Current v{updateStatus.currentVersion}
            </span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>v{updateStatus.latestVersion || '1.0.1'} Available</span>
            </span>
          </div>

          {/* STATUS 1: AVAILABLE */}
          {updateStatus.status === 'available' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                <p className="font-semibold text-slate-100">
                  A new version of Galaxy Launcher is ready to be installed directly!
                </p>
                <p className="text-[11px] text-slate-400">
                  Includes cute 3D isometric Minecraft instance icons, customizable background palettes, 3D Steve & Alex skin models, batch mod downloader, and performance optimizations.
                </p>
              </div>

              {updateStatus.releaseNotes && (
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap scrollbar-thin">
                  {updateStatus.releaseNotes}
                </div>
              )}
            </div>
          )}

          {/* STATUS 2: DOWNLOADING */}
          {updateStatus.status === 'downloading' && (
            <div className="space-y-3.5 py-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300 font-medium flex items-center space-x-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Downloading in-app update...</span>
                </span>
                <span className="text-slate-200 font-bold">
                  {updateStatus.downloadProgress || 0}%
                </span>
              </div>

              {/* Real-time Progress Bar */}
              <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/[0.08] p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-200 shadow-glow-sm"
                  style={{ width: `${Math.max(updateStatus.downloadProgress || 0, 5)}%` }}
                />
              </div>

              {updateStatus.bytesPerSecond && (
                <div className="text-right text-[10px] font-mono text-slate-400">
                  Speed: {formatSpeed(updateStatus.bytesPerSecond)}
                </div>
              )}
            </div>
          )}

          {/* STATUS 3: DOWNLOADED */}
          {updateStatus.status === 'downloaded' && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-200">
                  Update Downloaded & Verified
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Click <strong>Restart & Install</strong> to immediately apply the update. The launcher will restart into the latest version automatically.
                </p>
              </div>
            </div>
          )}

          {/* STATUS 4: ERROR */}
          {updateStatus.status === 'error' && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3.5">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-rose-200">
                  Update Note
                </h4>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">
                  {updateStatus.errorMessage || 'Could not complete update stream. Please try again.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="relative z-10 flex items-center justify-end space-x-3 px-6 py-4 border-t border-white/[0.08] bg-galaxy-950/60">
          {updateStatus.status === 'available' && (
            <>
              <button
                onClick={() => {
                  sounds.playClick();
                  onDismiss();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Later
              </button>
              <button
                onClick={handleStartDownload}
                disabled={isDownloading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-display font-extrabold text-xs shadow-glow-sm hover:shadow-glow-md flex items-center space-x-2 transition-all transform active:scale-95"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Update Now</span>
              </button>
            </>
          )}

          {updateStatus.status === 'downloaded' && (
            <button
              onClick={handleRestartAndInstall}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-display font-extrabold text-sm shadow-glow-md hover:shadow-glow-lg flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>RESTART & INSTALL NOW</span>
            </button>
          )}

          {updateStatus.status === 'error' && (
            <button
              onClick={handleStartDownload}
              className="px-5 py-2.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.15] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Download</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
