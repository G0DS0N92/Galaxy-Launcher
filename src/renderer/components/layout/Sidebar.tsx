import React from 'react';
import {
  Gamepad2,
  Boxes,
  Compass,
  Users,
  Terminal,
  Settings,
  PlusCircle,
  Sparkles
} from 'lucide-react';
import { sounds } from '../../services/soundEngine';

export type TabType = 'home' | 'instances' | 'marketplace' | 'accounts' | 'console' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onCreateInstance: () => void;
  runningCount: number;
  instancesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onCreateInstance,
  runningCount,
  instancesCount
}) => {
  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'home', label: 'Play', icon: Gamepad2 },
    { id: 'instances', label: 'Instances', icon: Boxes, badge: instancesCount > 0 ? instancesCount : undefined },
    { id: 'marketplace', label: 'Discover', icon: Compass },
    { id: 'accounts', label: 'Skins & Auth', icon: Users },
    { id: 'console', label: 'Console', icon: Terminal, badge: runningCount > 0 ? `${runningCount} running` : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 h-[calc(100vh-2.75rem)] flex flex-col justify-between p-3 bg-galaxy-950/80 backdrop-blur-xl border-r border-white/[0.06] select-none z-40">
      {/* Top Section */}
      <div className="space-y-4">
        {/* Quick New Instance Button */}
        <button
          onClick={() => {
            sounds.playSuccess();
            onCreateInstance();
          }}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-medium text-xs shadow-glow-sm hover:shadow-glow-md transition-all group"
        >
          <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
          <span>New Instance</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playSwitch();
                  onSelectTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-glow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    isActive
                      ? 'bg-purple-500/30 text-purple-200'
                      : typeof item.badge === 'string' && item.badge.includes('running')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                        : 'bg-white/[0.06] text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Cosmic Status Widget */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">Galaxy Engine</span>
          </div>
          <span className="text-emerald-400 font-mono text-[10px]">READY</span>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center justify-between">
          <span>Modrinth & Mojang APIs</span>
          <Sparkles className="w-3 h-3 text-purple-400" />
        </div>
      </div>
    </aside>
  );
};
