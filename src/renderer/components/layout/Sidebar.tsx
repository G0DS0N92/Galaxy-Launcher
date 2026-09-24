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
  Sparkles,
  Layers,
  Sparkle
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
    <aside className="w-56 xl:w-60 h-[calc(100vh-2.75rem)] flex flex-col justify-between p-3 bg-galaxy-950/85 backdrop-blur-2xl border-r border-white/[0.07] select-none z-40 flex-shrink-0">
      {/* Top Nav List */}
      <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
        <nav className="space-y-1">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 text-white font-bold shadow-glow-sm border border-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 stroke-[2.2] shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
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

      {/* Atmospheric Vertical Portal Art Card */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl h-44 xl:h-48 my-2 shrink-0 group">
        <img
          src={sidebarPortalArt}
          alt="Galaxy Portal"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950 via-galaxy-950/40 to-transparent" />
        <div className="absolute inset-0 bg-purple-950/20 mix-blend-color" />
        
        {/* Quote text overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-center">
          <p className="text-[10.5px] xl:text-[11px] font-display font-medium text-slate-300/90 italic tracking-wider whitespace-pre-line leading-tight drop-shadow-md">
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
          className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white font-bold shadow-glow-sm border border-white/20'
              : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400 hover:text-slate-200 shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
