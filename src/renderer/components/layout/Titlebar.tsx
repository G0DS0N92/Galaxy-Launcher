import React, { useState, useEffect } from 'react';
import {
  Minus,
  Square,
  Copy,
  X,
  Volume2,
  VolumeX,
  Bell,
  Search,
  Sparkles,
  User
} from 'lucide-react';
import { Account } from '../../types';
import { sounds } from '../../services/soundEngine';

interface TitlebarProps {
  activeAccount: Account | null;
  onOpenAccounts: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  activeAccount,
  onOpenAccounts,
  soundEnabled,
  onToggleSound,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search instances, mods, friends...'
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.4');
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(true);

  useEffect(() => {
    if (window.galaxy?.isMaximized) {
      window.galaxy.isMaximized().then(setIsMaximized).catch(() => {});
    }
    if (window.galaxy?.getAppVersion) {
      window.galaxy
        .getAppVersion()
        .then((v) => {
          if (v) setAppVersion(v.replace(/^v/i, ''));
        })
        .catch(() => {});
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
    <header className="app-drag-region h-11 w-full flex items-center justify-between px-3 bg-galaxy-950/80 backdrop-blur-xl border-b border-white/[0.07] select-none z-50 fixed top-0 left-0 right-0">
      {/* Left: Brand Logo */}
      <div className="flex items-center space-x-3 app-no-drag w-56 xl:w-60 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="font-display font-extrabold text-sm tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            GALAXY
          </span>
          <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.08] text-purple-300 border border-purple-500/20">
            v{appVersion}
          </span>
        </div>
      </div>

      {/* Center: Contextual Search Bar */}
      <div className="flex-1 max-w-xl px-4 app-no-drag">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/[0.09] focus:border-indigo-500/50 rounded-full pl-9.5 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
          />
        </div>
      </div>

      {/* Right: Sound, Notifications, Account & Window Controls */}
      <div className="flex items-center space-x-2.5 app-no-drag shrink-0">
        {/* Sound toggle button */}
        <button
          onClick={() => {
            onToggleSound();
            sounds.playSwitch();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors shrink-0"
          title={soundEnabled ? 'Mute UI Audio' : 'Enable UI Audio'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-indigo-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Notifications Bell with unread dot */}
        <button
          onClick={() => {
            sounds.playClick();
            setHasUnreadNotifs(false);
          }}
          className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors shrink-0"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {hasUnreadNotifs && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-galaxy-950 animate-pulse" />
          )}
        </button>

        {/* Account Pill */}
        {activeAccount ? (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAccounts();
            }}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] transition-all text-xs text-slate-200 group shrink-0"
          >
            <img
              src={
                activeAccount.skinUrl ||
                `https://minotar.net/avatar/${activeAccount.username}/24`
              }
              alt={activeAccount.username}
              className="w-5 h-5 rounded-full shadow-sm object-cover bg-slate-800 shrink-0 ring-1 ring-white/20"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-semibold max-w-[80px] sm:max-w-[110px] truncate text-[11.5px]">
              {activeAccount.username}
            </span>
            <span
              className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded-full uppercase shrink-0 whitespace-nowrap font-bold ${
                activeAccount.type === 'microsoft'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {activeAccount.type}
            </span>
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAccounts();
            }}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 transition-all text-xs font-semibold shrink-0 whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        )}

        {/* Window action buttons */}
        <div className="flex items-center ml-1 space-x-1 shrink-0 border-l border-white/[0.08] pl-2">
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
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-rose-600/90 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
