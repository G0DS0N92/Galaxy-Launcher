import React from 'react';
import {
  Home,
  Boxes,
  Compass,
  Users,
  Cloud,
  Trophy,
  User,
  Settings,
  Sparkles
} from 'lucide-react';
import { sounds } from '../../services/soundEngine';
import sidebarPortalArt from '../../assets/instance_backgrounds/bg_sidebar_portal.jpg';

export type TabType =
  | 'home'
  | 'instances'
  | 'marketplace'
  | 'social'
  | 'cloud'
  | 'achievements'
  | 'profile'
  | 'accounts'
  | 'screenshots'
  | 'console'
  | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  runningCount: number;
  instancesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  runningCount,
  instancesCount
}) => {
  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'instances', label: 'Instances', icon: Boxes, badge: instancesCount > 0 ? instancesCount : undefined },
    { id: 'marketplace', label: 'Discover', icon: Compass },
    { id: 'social', label: 'Friends', icon: Users },
    { id: 'cloud', label: 'Cloud', icon: Cloud },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const getQuoteForTab = (tab: TabType) => {
    switch (tab) {
      case 'home':
        return '"Different Worlds\nSame Galaxy"';
      case 'instances':
        return '"Your Worlds\nYour Rules"';
      case 'marketplace':
        return '"Discover\nCreate\nEnhance\nYour Worlds"';
      case 'social':
        return '"Play Together\nAcross Worlds"';
      case 'cloud':
        return '"Your Worlds\nAnywhere,\nAnytime"';
      default:
        return '"Different Worlds\nSame Galaxy"';
    }
  };

  return (
    <aside className="w-64 h-[calc(100vh-2.75rem)] flex flex-col justify-between p-3.5 bg-galaxy-950/90 backdrop-blur-2xl border-r border-white/[0.07] select-none z-40 flex-shrink-0">
      {/* Top Nav List */}
      <div className="shrink-0 pr-0.5 space-y-1.5">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'social' && (activeTab as string) === 'friends') ||
              (item.id === 'marketplace' && (activeTab as string) === 'discover');

            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playSwitch();
                  onSelectTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <Icon
                    className={`w-5 h-5 stroke-[2] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-white/[0.08] text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Seamless Atmospheric Portal Art Card (Expands Vertically to Fill Space) */}
      <div className="relative rounded-2xl overflow-hidden my-2 flex-1 w-full min-h-[240px] flex flex-col justify-end group">
        <img
          src={sidebarPortalArt}
          alt="Galaxy Portal"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] group-hover:scale-105 transition-transform duration-700"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950/95 via-transparent to-galaxy-950/40 pointer-events-none" />
        
        {/* Quote text overlay */}
        <div className="relative z-10 text-center pb-4 px-2 pointer-events-none">
          <p className="text-xs xl:text-[13px] font-display font-bold text-white/95 italic tracking-wider whitespace-pre-line leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
            {getQuoteForTab(activeTab)}
          </p>
        </div>
      </div>

      {/* Settings Footer Button */}
      <div className="pt-1 shrink-0">
        <button
          onClick={() => {
            sounds.playSwitch();
            onSelectTab('settings');
          }}
          className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
          }`}
        >
          <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-200 shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
