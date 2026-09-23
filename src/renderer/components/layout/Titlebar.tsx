import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Volume2, VolumeX, Sparkles, Orbit, User } from 'lucide-react';
import { Account } from '../../types';
import { sounds } from '../../services/soundEngine';

interface TitlebarProps {
  activeAccount: Account | null;
  onOpenAccounts: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  activeAccount,
  onOpenAccounts,
  soundEnabled,
  onToggleSound
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.4');

  useEffect(() => {
    if (window.galaxy?.isMaximized) {
      window.galaxy.isMaximized().then(setIsMaximized).catch(() => {});
    }
    if (window.galaxy?.getAppVersion) {
      window.galaxy.getAppVersion().then((v) => {
        if (v) setAppVersion(v.replace(/^v/i, ''));
      }).catch(() => {});
    }
  }, []);

  const handleMinimize = () => {
    sounds.playClick();
    window.galaxy?.minimize();
  };

  const handleMaximize = async () => {
    sounds.playClick();
    await window.galaxy?.maximize();
    const max = await window.galaxy?.isMaximized();
    setIsMaximized(max);
  };

  const handleClose = () => {
    sounds.playClick();
    window.galaxy?.close();
  };

  return (
    <header className="app-drag-region h-11 w-full flex items-center justify-between px-3 bg-galaxy-950/70 backdrop-blur-md border-b border-white/[0.06] select-none z-50 fixed top-0 left-0 right-0">
      {/* Left: Brand / Logo */}
      <div className="flex items-center space-x-2.5 app-no-drag">
        <div className="w-6 h-6 rounded-lg btn-accent flex items-center justify-center shadow-glow-sm">
          <Orbit className="w-4 h-4 text-white animate-spin-slow" />
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="font-display font-bold text-sm tracking-wider text-gradient-accent">
            GALAXY
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded theme-badge">
            v{appVersion}
          </span>
        </div>
      </div>

      {/* Middle: Cosmic Subtitle (Aligned directly with main content center on wide displays) */}
      <div className="hidden xl:flex items-center space-x-2 text-xs text-slate-300 font-medium px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-sm absolute left-[calc(50%+8rem)] top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-theme-accent animate-pulse" />
        <span className="tracking-wide">Minecraft, Reimagined</span>
      </div>

      {/* Right: Controls & Active Account */}
      <div className="flex items-center space-x-2 app-no-drag shrink-0">
        {/* Sound toggle button */}
        <button
          onClick={() => {
            onToggleSound();
            sounds.playSwitch();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors shrink-0"
          title={soundEnabled ? "Mute UI Audio" : "Enable UI Audio"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-theme-accent" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Account Pill */}
        {activeAccount ? (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAccounts();
            }}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-xs text-slate-200 group shrink-0"
          >
            <img
              src={activeAccount.skinUrl || `https://minotar.net/avatar/${activeAccount.username}/24`}
              alt={activeAccount.username}
              className="w-5 h-5 rounded shadow-sm object-cover bg-slate-800 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-medium max-w-[70px] sm:max-w-[110px] truncate">{activeAccount.username}</span>
            <span className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase shrink-0 whitespace-nowrap ${
              activeAccount.type === 'microsoft'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}>
              {activeAccount.type}
            </span>
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAccounts();
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg theme-badge hover:opacity-90 transition-all text-xs font-semibold shrink-0 whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5" />
            <span>Login / Add Account</span>
          </button>
        )}

        {/* Window action buttons */}
        <div className="flex items-center ml-1 sm:ml-2 space-x-1 shrink-0">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-rose-600/80 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
