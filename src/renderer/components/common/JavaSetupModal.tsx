import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Layers,
  Check,
  X
} from 'lucide-react';
import { sounds } from '../../services/soundEngine';

interface JavaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onShowToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
}

export const JavaSetupModal: React.FC<JavaSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isDone, setIsDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsDownloading(false);
      setProgressPercent(0);
      setDownloadStep('');
      setIsDone(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (window.galaxy?.onJavaDownloadProgress) {
      const unsub = window.galaxy.onJavaDownloadProgress((data) => {
        setProgressPercent(data.percent);
        setDownloadStep(data.step);
      });
      return () => unsub();
    }
  }, []);

  if (!isOpen) return null;

  const handleStartDownload = async () => {
    setIsDownloading(true);
    setErrorMessage(null);
    setProgressPercent(5);
    setDownloadStep('Connecting to Eclipse Adoptium for Java 21 LTS...');
    sounds.playLaunch();

    try {
      if (window.galaxy?.downloadJava) {
        await window.galaxy.downloadJava(21);
      }
      sounds.playSuccess();
      setIsDone(true);
      setProgressPercent(100);
      setDownloadStep('Java 21 LTS successfully installed and configured!');
      onShowToast({
        type: 'success',
        title: 'Java 21 LTS Installed!',
        message: 'Galaxy Launcher has automatically configured Java Runtime for Minecraft.'
      });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      sounds.playError();
      setIsDownloading(false);
      setErrorMessage(err.message || 'Failed to download Java runtime');
      onShowToast({
        type: 'error',
        title: 'Java Setup Failed',
        message: err.message
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-galaxy-900 border border-white/[0.12] shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-glow-cyan">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-display font-bold text-white">Java Runtime Setup</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Java 21 LTS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Out-of-the-box Minecraft execution
              </p>
            </div>
          </div>

          {!isDownloading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Description Body */}
        {!isDownloading && !isDone && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                No compatible Java runtime was detected on your system. Modern Minecraft versions (1.20.5+ through 1.21.x+) require an official Java 21 64-bit environment.
              </p>
              <p className="text-slate-400 text-[11px]">
                Would you like Galaxy Launcher to automatically download and configure the official <strong className="text-cyan-300">Eclipse Temurin Java 21 LTS</strong> runtime for you?
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.04]">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero configuration</span>
              </div>
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.04]">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fast 64-bit HotSpot</span>
              </div>
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.04]">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supports all Mod Loaders</span>
              </div>
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.04]">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official Eclipse Build</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress & Installation State */}
        {(isDownloading || isDone) && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{downloadStep || 'Installing Java...'}</span>
                <span className="font-mono font-bold text-cyan-400">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-white/[0.08] p-0.5 border border-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-300 shadow-glow-cyan relative"
                  style={{ width: `${Math.max(5, Math.min(100, progressPercent))}%` }}
                >
                  <div className="absolute inset-0 bg-white/25 animate-pulse rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 font-mono">
              {isDone ? (
                <div className="flex items-center space-x-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setup Complete! Ready to launch.</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Downloading & extracting archive...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-end space-x-3 border-t border-white/[0.06]">
          {!isDownloading && !isDone ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Configure Manually
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs shadow-glow-cyan flex items-center space-x-2 transition-all hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download & Configure Java</span>
              </button>
            </>
          ) : isDone ? (
            <button
              type="button"
              onClick={() => {
                onSuccess?.();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-emerald flex items-center space-x-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Continue</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-xl bg-white/[0.08] text-slate-500 font-semibold text-xs cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Installing...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
