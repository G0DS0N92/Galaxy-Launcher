import {
  Gamepad2,
  Boxes,
  Compass,
  Users,
  Trophy,
  Cloud,
  Terminal,
  Settings,
  Sparkles,
  Camera,
  UserCheck
} from 'lucide-react';
import { sounds } from '../../services/soundEngine';

export type TabType = 'home' | 'instances' | 'marketplace' | 'screenshots' | 'achievements' | 'social' | 'profile' | 'accounts' | 'console' | 'settings';

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
    { id: 'home', label: 'Play', icon: Gamepad2 },
    { id: 'instances', label: 'Instances', icon: Boxes, badge: instancesCount > 0 ? instancesCount : undefined },
    { id: 'marketplace', label: 'Discover', icon: Compass },
    { id: 'accounts', label: 'Capes & Cosmetics', icon: Sparkles },
    { id: 'screenshots', label: 'Screenshots', icon: Camera },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'social', label: 'Friends & Social', icon: Users },
    { id: 'profile', label: 'Profile & Personalization', icon: UserCheck },
    { id: 'console', label: 'Console', icon: Terminal, badge: runningCount > 0 ? `${runningCount} running` : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-2.75rem)] flex flex-col justify-between p-3.5 bg-galaxy-950/80 backdrop-blur-xl border-r border-white/[0.06] select-none z-40 flex-shrink-0">
      {/* Top Section with scroll support on short window heights */}
      <div className="space-y-1.5 overflow-y-auto custom-scrollbar flex-1 pr-1 -mr-1">
        {/* Navigation Items */}
        <nav className="space-y-1.5">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-semibold tracking-wide transition-all group ${
                  isActive
                    ? 'theme-nav-active shadow-glow-sm text-white font-bold border border-white/[0.12]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className={`w-4 h-4 stroke-[2] transition-colors shrink-0 ${
                    isActive ? 'text-theme-accent' : 'text-slate-400 group-hover:text-slate-200'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'theme-badge'
                      : typeof item.badge === 'string' && item.badge.includes('running')
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                        : 'bg-white/[0.08] text-slate-400'
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
      <div className="p-3 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] shadow-inner space-y-1.5 mt-3 shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-200 font-semibold">Galaxy Engine</span>
          </div>
          <span className="text-emerald-400 font-mono text-[11px] font-bold">READY</span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center justify-between">
          <span>Modrinth & Mojang APIs</span>
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        </div>
      </div>
    </aside>
  );
};
