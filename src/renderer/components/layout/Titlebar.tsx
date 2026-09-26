import React, { useState, useEffect, useRef } from 'react';
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
  User,
  Check,
  CheckCheck,
  Trash2,
  Cloud,
  Puzzle,
  Zap,
  Info
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

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'system' | 'cloud' | 'mod';
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Galaxy Launcher v1.0.4 Active',
    message: 'Ultra-fast launch engine, unified single-view layout, and dynamic day/night celestial animations are ready.',
    time: 'Just now',
    type: 'system',
    read: false
  },
  {
    id: '2',
    title: 'Cloud Sync Operational',
    message: 'Your world backups and configuration profiles are synchronized with the local cloud storage.',
    time: '25m ago',
    type: 'cloud',
    read: false
  },
  {
    id: '3',
    title: 'Performance Mods Ready',
    message: 'Sodium, Iris Shaders, and Distant Horizons are pre-configured for optimal FPS in 1.21.1.',
    time: '2h ago',
    type: 'mod',
    read: true
  }
];

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

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

  const markAllAsRead = () => {
    sounds.playClick();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    sounds.playClick();
    setNotifications([]);
  };

  const toggleReadNotification = (id: string) => {
    sounds.playClick();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <header className="app-drag-region h-11 w-full flex items-center justify-between px-3 bg-galaxy-950/80 backdrop-blur-xl border-b border-white/[0.07] select-none z-50 fixed top-0 left-0 right-0">
      {/* Left: Brand Logo */}
      <div className="flex items-center space-x-3 app-no-drag w-64 px-2 shrink-0">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-500 flex items-center justify-center shadow-[0_0_14px_rgba(99,102,241,0.55)]">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-display font-extrabold text-sm tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            GALAXY
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#1c1335] text-[#b388ff] border border-[#512da8]/40 shadow-inner">
            v{appVersion}
          </span>
        </div>
      </div>

      {/* Center: Contextual Search Bar — truly centered via absolute */}
      <div className="absolute left-1/2 -translate-x-1/2 w-72 sm:w-80 app-no-drag">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none z-10" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/[0.09] focus:border-indigo-500/50 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all font-medium"
          />
        </div>
      </div>

      {/* Right: Sound, Notifications, Account & Window Controls */}
      <div className="flex items-center space-x-2.5 app-no-drag shrink-0 relative">
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

        {/* Notifications Bell Container */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              sounds.playClick();
              setShowNotifications(!showNotifications);
            }}
            className={`relative p-1.5 rounded-lg transition-all shrink-0 ${
              showNotifications
                ? 'bg-indigo-600/30 text-white border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-galaxy-950 animate-pulse" />
            )}
          </button>

          {/* Interactive Notification Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 rounded-2xl bg-[#090d1f]/95 backdrop-blur-2xl border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(99,102,241,0.25)] z-50 overflow-hidden animate-smooth-in">
              {/* Dropdown Header */}
              <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-display font-bold text-white tracking-wide">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-500/40">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {notifications.length > 0 && unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-white/[0.06] transition-colors text-[11px] font-medium flex items-center space-x-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Read All</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                      title="Clear notifications"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => toggleReadNotification(n.id)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start space-x-3 border ${
                        n.read
                          ? 'bg-white/[0.02] border-white/[0.04] opacity-75 hover:opacity-100 hover:bg-white/[0.05]'
                          : 'bg-indigo-600/10 border-indigo-500/30 hover:bg-indigo-600/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'system'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : n.type === 'cloud'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {n.type === 'system' && <Sparkles className="w-3.5 h-3.5" />}
                        {n.type === 'cloud' && <Cloud className="w-3.5 h-3.5" />}
                        {n.type === 'mod' && <Puzzle className="w-3.5 h-3.5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-white truncate">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300/85 mt-0.5 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>

                      {/* Unread Dot */}
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">
                    <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                    <div className="text-xs font-medium text-slate-300">All caught up!</div>
                    <div className="text-[10.5px] text-slate-500 mt-0.5">
                      No new notifications right now
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-2 border-t border-white/10 bg-white/[0.01] text-center">
                <span className="text-[10px] text-slate-400 font-medium">
                  Galaxy Hub • System Alerts & Updates
                </span>
              </div>
            </div>
          )}
        </div>

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
