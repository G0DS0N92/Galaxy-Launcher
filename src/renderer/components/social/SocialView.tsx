import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Star,
  Sparkles,
  Gamepad2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  HardDrive,
  Download,
  Trash2,
  Cloud,
  RefreshCw,
  Trophy,
  Activity,
  Send,
  UserCheck,
  UserX,
  Search,
  SlidersHorizontal,
  Server,
  Edit3,
  ExternalLink,
  Shield,
  Play,
  Zap,
  Plus,
  Camera,
  Upload,
  Image as ImageIcon,
  Boxes,
  X,
  Mic,
  Settings as SettingsIcon,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  MoreHorizontal,
  Crown,
  Tag,
  Loader2,
  CheckSquare,
  Package,
  ArrowRight,
  MessageSquare,
  UploadCloud,
  FolderOpen,
  FileText,
  Lock,
  RotateCw
} from 'lucide-react';
import {
  GalaxyFriend,
  FriendRequest,
  UserSocialProfile,
  CloudSyncState,
  CloudInstanceSnapshot,
  Instance,
  Account
} from '../../../preload/types';
import { sounds } from '../../services/soundEngine';
import bgCampfireFriends from '../../assets/instance_backgrounds/bg_campfire_friends.jpg';
import bgCloudSync from '../../assets/instance_backgrounds/bg_cloud_sync.jpg';
import bgNether from '../../assets/instance_backgrounds/bg_nether.jpg';
import bgGalaxy from '../../assets/instance_backgrounds/bg_galaxy.jpg';
import bgSunset from '../../assets/instance_backgrounds/bg_sunset.jpg';
import bgVanilla from '../../assets/instance_backgrounds/bg_vanilla.jpg';
import bgPortalHero from '../../assets/instance_backgrounds/bg_portal_hero.jpg';

interface SocialViewProps {
  instances: Instance[];
  activeAccount: Account | null;
  onLaunchInstance: (instance: Instance) => void;
  onShowToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
  onInstanceRestored?: (instance: Instance) => void;
  initialTab?: 'friends' | 'requests' | 'cloud';
}

export const SocialView: React.FC<SocialViewProps> = ({
  instances,
  activeAccount,
  onLaunchInstance,
  onShowToast,
  onInstanceRestored,
  initialTab = 'friends'
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'cloud'>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Friends & Social State
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'in-game' | 'pending' | 'blocked'>('all');
  const [searchFriendQuery, setSearchFriendQuery] = useState('');
  const [cloudCategoryTab, setCloudCategoryTab] = useState<'worlds' | 'modpacks' | 'settings' | 'screenshots' | 'resourcepacks'>('worlds');
  const [cloudSearchQuery, setCloudSearchQuery] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendTagInput, setFriendTagInput] = useState('');
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Dynamic state / Fallback sample data matching the reference designs
  const sampleFriends = [
    { id: '1', username: 'NotRex', tag: '#0001', status: 'online', activity: 'Playing Galaxy SMP', mode: 'Survival • 2h 15m', avatarBg: 'bg-amber-600', banner: bgPortalHero },
    { id: '2', username: 'PixelPlayz', tag: '#0456', status: 'online', activity: 'In Mod Testing', mode: 'Creative • 1h 8m', avatarBg: 'bg-emerald-600', banner: bgSunset },
    { id: '3', username: 'ArjunXD', tag: '#0789', status: 'online', activity: 'Playing Vanilla+', mode: 'Multiplayer • 45m', avatarBg: 'bg-purple-600', banner: bgGalaxy },
    { id: '4', username: 'BlazeFury', tag: '#1123', status: 'in-game', activity: 'In Singleplayer', mode: 'Modded • 3h 22m', avatarBg: 'bg-rose-600', banner: bgNether },
    { id: '5', username: 'SomeoneElse', tag: '#2017', status: 'in-launcher', activity: 'Browsing Mods', mode: 'In Launcher', avatarBg: 'bg-indigo-600', banner: bgVanilla },
    { id: '6', username: 'DarkKnight', tag: '#3333', status: 'offline', activity: '—', mode: 'Last seen 4 hours ago', avatarBg: 'bg-slate-700', banner: bgPortalHero },
    { id: '7', username: 'WhitePlayz', tag: '#4242', status: 'offline', activity: '—', mode: 'Last seen 1 day ago', avatarBg: 'bg-slate-700', banner: bgSunset },
    { id: '8', username: 'CraftMaster', tag: '#6969', status: 'offline', activity: '—', mode: 'Last seen 3 days ago', avatarBg: 'bg-slate-700', banner: bgGalaxy },
  ];

  const sampleCloudBackups = [
    { id: '1', name: 'Galaxy SMP', tag: 'Main World', type: 'Multiplayer', version: '1.21.1', loader: 'Fabric', size: '2.8 GB', lastBackup: '2 hours ago', autoBackup: true, banner: bgPortalHero },
    { id: '2', name: 'Mod Testing', tag: 'Testing', type: 'Creative', version: '1.21.0', loader: 'Fabric', size: '1.2 GB', lastBackup: '5 hours ago', autoBackup: true, banner: bgSunset },
    { id: '3', name: 'Broken Instance', tag: 'Old Version', type: 'Singleplayer', version: '1.20.4', loader: 'Forge', size: '980 MB', lastBackup: '1 day ago', autoBackup: true, banner: bgNether },
    { id: '4', name: 'Skyblock', tag: 'Challenge', type: 'Singleplayer', version: '1.21.0', loader: 'Fabric', size: '1.6 GB', lastBackup: '2 days ago', autoBackup: false, banner: bgGalaxy },
    { id: '5', name: 'Creative Build', tag: 'Creative', type: 'Building', version: '1.21.0', loader: 'Fabric', size: '1.4 GB', lastBackup: '3 days ago', autoBackup: true, banner: bgVanilla },
    { id: '6', name: 'Vanilla+ Exploration', tag: 'Adventure', type: 'Multiplayer', version: '1.21.0', loader: 'Fabric', size: '3.1 GB', lastBackup: '5 days ago', autoBackup: true, banner: bgPortalHero },
  ];

  const handleSyncCloud = () => {
    sounds.playLaunch();
    setIsSyncingCloud(true);
    setTimeout(() => {
      setIsSyncingCloud(false);
      sounds.playSuccess();
      onShowToast({ type: 'success', title: 'Cloud Synced', message: 'All worlds, modpacks, and settings are up to date.' });
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Online' };
      case 'in-game':
        return { dot: 'bg-amber-400', text: 'text-amber-400', label: 'In Game' };
      case 'in-launcher':
        return { dot: 'bg-rose-400', text: 'text-rose-400', label: 'In Launcher' };
      default:
        return { dot: 'bg-slate-500', text: 'text-slate-400', label: 'Offline' };
    }
  };

  // =========================================================================
  // RENDER: CLOUD VIEW (Matching media_1790255793915.jpg)
  // =========================================================================
  if (activeTab === 'cloud') {
    return (
      <div className="min-h-full p-6 space-y-6 select-none max-w-[1600px] mx-auto">
        {/* 1. HERO HEADER BANNER */}
        <div className="w-full relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-[200px] sm:h-[215px] lg:h-[225px] xl:h-[235px] group shrink-0">
          <img
            src={bgCloudSync}
            alt="Galaxy Cloud Banner"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070a18]/95 via-[#070a18]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a18]/90 via-transparent to-transparent" />

          {/* Top Right Quote */}
          <div className="absolute top-6 right-8 text-right hidden sm:block">
            <p className="text-xs font-display font-medium text-slate-300/80 italic tracking-wider">
              " Save Today<br />Explore Tomorrow "
            </p>
          </div>

          <div className="relative h-full flex flex-col justify-between p-8 z-10">
            <div>
              <span className="text-[11px] font-mono font-extrabold tracking-[0.28em] text-cyan-300 uppercase block mb-1.5 drop-shadow">
                G A L A X Y &nbsp; C L O U D
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight drop-shadow-md flex items-center gap-2">
                <span>Your Worlds,</span>
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                  Everywhere
                </span>
              </h1>
              <p className="text-sm text-slate-300 font-medium mt-1.5 max-w-xl">
                Backup, sync and manage your Minecraft data across all your devices. Safe, secure and seamless.
              </p>
            </div>

            {/* 4 Feature Pills inside the banner */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                <div className="text-xs font-bold text-white">Automatic Backups</div>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
                <RotateCw className="w-4 h-4 text-indigo-400" />
                <div className="text-xs font-bold text-white">Sync Across Devices</div>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <div className="text-xs font-bold text-white">Multiple Data Types</div>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                <div className="text-xs font-bold text-white">Secure & Private</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. STORAGE METER & SYNC STATUS CARDS (2-Col Top Row matching reference) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Storage Meter Card (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-[#0c1228]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-base font-mono font-extrabold text-white">
                    24.8 GB <span className="text-xs text-slate-400 font-sans font-normal">/ 100 GB Used</span>
                  </div>
                  <div className="text-xs text-slate-400">24% Storage Allocated</div>
                </div>
              </div>

              <button
                onClick={() => onShowToast({ type: 'info', title: 'Galaxy Cloud Pro', message: 'Unlimited storage enabled for your account!' })}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-glow-sm flex items-center gap-1.5 transition-all"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Upgrade Plan</span>
              </button>
            </div>

            {/* 4-Segmented Multicolor Gradient Progress Bar */}
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded-full bg-white/[0.06] overflow-hidden flex p-0.5 border border-white/10">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-l-full" style={{ width: '50%' }} />
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '25%' }} />
                <div className="h-full bg-gradient-to-r from-cyan-400 to-teal-400" style={{ width: '13%' }} />
                <div className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-r-full" style={{ width: '12%' }} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Worlds: 12.4 GB</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Mods: 6.1 GB</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Resource Packs: 3.2 GB</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>Other: 3.1 GB</span>
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={() => onShowToast({ type: 'info', title: 'Storage Manager', message: 'World storage optimized.' })}
                className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-slate-200 transition-colors"
              >
                Manage Storage
              </button>
            </div>
          </div>

          {/* Right: Sync Status Card (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-[#0c1228]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sync Status</span>
                </div>
                <div className="text-lg font-display font-bold text-white mt-1">
                  All data is synced
                </div>
                <div className="text-xs text-slate-400">
                  Last synced 12 minutes ago
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>

            {/* Checklist of synced items */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className="text-slate-300">Worlds</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className="text-slate-300">Mods</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className="text-slate-300">Settings</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className="text-slate-300">Screenshots</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <button
              onClick={handleSyncCloud}
              disabled={isSyncingCloud}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-glow-sm flex items-center justify-center space-x-2 transition-all"
            >
              {isSyncingCloud ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing with Galaxy Cloud...</span>
                </>
              ) : (
                <>
                  <RotateCw className="w-4 h-4" />
                  <span>Sync Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. MAIN CONTENT: Left Backup Table (8 cols) & Right Dropzone / Activity (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT BACKUP TABLE ================= */}
          <div className="lg:col-span-8 space-y-4">
            {/* Category Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1">
              {[
                { id: 'worlds', label: 'World Backups (6)', icon: HardDrive },
                { id: 'modpacks', label: 'Modpacks (4)', icon: Boxes },
                { id: 'settings', label: 'Settings (2)', icon: SettingsIcon },
                { id: 'screenshots', label: 'Screenshots (12)', icon: Camera },
                { id: 'resourcepacks', label: 'Resource Packs (5)', icon: ImageIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = cloudCategoryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sounds.playClick();
                      setCloudCategoryTab(tab.id as any);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-glow-sm'
                        : 'bg-[#0c1228]/80 text-slate-400 hover:text-white border border-white/[0.08]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-[#0c1228]/80 border border-white/[0.08]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search worlds..."
                  value={cloudSearchQuery}
                  onChange={(e) => setCloudSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <span>Sort by</span>
                  <select className="bg-[#070a18] text-xs text-slate-200 border border-white/10 rounded-lg px-2.5 py-1 font-semibold cursor-pointer">
                    <option>Last Modified</option>
                    <option>Name</option>
                    <option>Size</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                  <span>Version</span>
                  <select className="bg-[#070a18] text-xs text-slate-200 border border-white/10 rounded-lg px-2.5 py-1 font-semibold cursor-pointer">
                    <option>All Versions</option>
                    <option>1.21.1</option>
                    <option>1.20.4</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Backups List (Matching reference rows) */}
            <div className="space-y-2.5">
              {sampleCloudBackups.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#0c1228]/85 backdrop-blur-xl border border-white/[0.08] hover:border-indigo-500/40 transition-all flex items-center justify-between gap-4 group"
                >
                  {/* Left: Banner & Info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-16 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <img src={item.banner} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span>{item.name}</span>
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                          {item.tag}
                        </span>
                        <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400">
                          {item.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Version & Loader */}
                  <div className="text-center shrink-0 hidden sm:block">
                    <div className="text-xs font-mono font-bold text-white">{item.version}</div>
                    <div className="text-[10px] text-slate-400">{item.loader}</div>
                  </div>

                  {/* Size & Last Backup */}
                  <div className="text-right shrink-0 hidden md:block">
                    <div className="text-xs font-mono font-bold text-white">{item.size}</div>
                    <div className="text-[10px] text-slate-400">Last backup {item.lastBackup}</div>
                  </div>

                  {/* Auto-Backup Toggle Pill */}
                  <div className="shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold flex items-center gap-1.5 border ${
                      item.autoBackup
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-500/10 border-slate-500/30 text-slate-400'
                    }`}>
                      <RotateCw className="w-3 h-3" />
                      <span>{item.autoBackup ? 'Auto Backup Enabled' : 'Auto Backup Disabled'}</span>
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => onShowToast({ type: 'success', title: 'World Launched', message: `Launching cloud synced ${item.name}` })}
                      className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Play</span>
                    </button>
                    <button className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= RIGHT DROPZONE & ACTIVITY (4 cols) ================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload World Dropzone Card */}
            <div className="p-5 rounded-3xl bg-[#0c1228]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-display font-bold text-white">Upload World</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Upload a world from your device to your Galaxy Cloud.
                </p>
              </div>

              {/* Dashed dropzone */}
              <div className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-2xl p-6 text-center space-y-2 bg-white/[0.02] cursor-pointer transition-colors">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-300 font-medium">
                  Drag & drop a world folder here or click to select
                </div>
              </div>

              <button
                onClick={() => onShowToast({ type: 'info', title: 'Select World', message: 'World folder selector opened.' })}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-glow-sm flex items-center justify-center space-x-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Select World Folder</span>
              </button>
            </div>

            {/* Recent Cloud Activity */}
            <div className="p-5 rounded-3xl bg-[#0c1228]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-display font-bold text-white">Recent Activity</h3>
                </div>
                <span className="text-xs text-indigo-400 font-semibold cursor-pointer">View All →</span>
              </div>

              <div className="space-y-3">
                {[
                  { text: 'Backed up "Galaxy SMP"', time: '2 hours ago', icon: UploadCloud, color: 'emerald' },
                  { text: 'Synced mods for "Mod Testing"', time: '5 hours ago', icon: RotateCw, color: 'cyan' },
                  { text: 'Uploaded resource pack', time: '1 day ago', icon: ImageIcon, color: 'purple' },
                  { text: 'Restored "Skyblock"', time: '2 days ago', icon: Download, color: 'blue' },
                  { text: 'Synced settings', time: '3 days ago', icon: SettingsIcon, color: 'amber' },
                ].map((act, idx) => {
                  const ActIcon = act.icon;
                  return (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0">
                        <ActIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white truncate">{act.text}</div>
                        <div className="text-[10px] text-slate-400">{act.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: FRIENDS VIEW (Matching media_1790255526875.jpg)
  // =========================================================================
  return (
    <div className="min-h-full p-6 space-y-6 select-none max-w-[1600px] mx-auto">
      {/* 1. HERO HEADER BANNER */}
      <div className="w-full relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-[200px] sm:h-[215px] lg:h-[225px] xl:h-[235px] group shrink-0">
        <img
          src={bgCampfireFriends}
          alt="Friends Banner"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a18]/95 via-[#070a18]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a18]/90 via-transparent to-transparent" />

        {/* Top Right Quote */}
        <div className="absolute top-6 right-8 text-right hidden sm:block">
          <p className="text-xs font-display font-medium text-slate-300/80 italic tracking-wider">
            " Good Friends<br />Make Greater Worlds "
          </p>
        </div>

        <div className="relative h-full flex flex-col justify-between p-8 z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight drop-shadow-md flex items-center gap-2.5">
              <span>Friends</span>
              <Users className="w-7 h-7 text-indigo-400" />
            </h1>
            <p className="text-sm text-slate-300 font-medium mt-1.5 max-w-xl">
              Connect with friends, join parties and play together across worlds.
            </p>
          </div>

          {/* 4 Stat Pills inside the banner */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-xs">
                <span className="font-extrabold text-white">5 </span>
                <span className="text-slate-400">Online</span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
              <Users className="w-4 h-4 text-cyan-400" />
              <div className="text-xs">
                <span className="font-extrabold text-white">12 </span>
                <span className="text-slate-400">Total Friends</span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
              <Gamepad2 className="w-4 h-4 text-amber-400" />
              <div className="text-xs">
                <span className="font-extrabold text-white">4 </span>
                <span className="text-slate-400">In Game</span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-2xl bg-[#090d1f]/80 backdrop-blur-xl border border-white/10 flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-purple-400" />
              <div className="text-xs">
                <span className="font-extrabold text-white">2 </span>
                <span className="text-slate-400">In Launcher</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER TABS BAR & SEARCH (Matching reference) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-2">
          {[
            { id: 'all', label: 'All Friends (12)' },
            { id: 'online', label: 'Online (5)' },
            { id: 'in-game', label: 'In Game (4)' },
            { id: 'pending', label: 'Pending (2)' },
            { id: 'blocked', label: 'Blocked (1)' },
          ].map((tab) => {
            const isActive = friendFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playClick();
                  setFriendFilter(tab.id as any);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-glow-sm'
                    : 'bg-[#0c1228]/80 text-slate-400 hover:text-white border border-white/[0.08]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Search & Add Friend Button */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchFriendQuery}
              onChange={(e) => setSearchFriendQuery(e.target.value)}
              className="bg-[#0c1228]/90 border border-white/10 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowAddFriendModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-glow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>
      </div>

      {/* 3. 2-COLUMN SPLIT: Left Friends Table & Right Social Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT FRIENDS TABLE (8 cols) ================= */}
        <div className="lg:col-span-8 p-5 rounded-3xl bg-[#0c1228]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-3">
          {/* Table Column Headers */}
          <div className="grid grid-cols-12 gap-4 px-3 pb-2 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-white/[0.06]">
            <div className="col-span-4">Friend</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-4">Current Activity</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Friends Rows */}
          <div className="space-y-2">
            {sampleFriends.map((friend) => {
              const status = getStatusBadge(friend.status);
              return (
                <div
                  key={friend.id}
                  className="grid grid-cols-12 gap-4 px-3 py-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] hover:border-indigo-500/30 transition-all items-center group"
                >
                  {/* Friend Name & Avatar */}
                  <div className="col-span-4 flex items-center space-x-3 min-w-0">
                    <div className="relative">
                      <div className={`w-9 h-9 rounded-xl ${friend.avatarBg} flex items-center justify-center font-bold text-white text-xs shadow-md`}>
                        {friend.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[#0c1228] ${status.dot}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{friend.username}</div>
                      <div className="text-[10px] font-mono text-slate-400">{friend.tag}</div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      <span>{status.label}</span>
                    </span>
                  </div>

                  {/* Current Activity */}
                  <div className="col-span-4 flex items-center space-x-2.5 min-w-0">
                    {friend.activity !== '—' && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/10">
                        <img src={friend.banner} alt={friend.activity} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{friend.activity}</div>
                      <div className="text-[10.5px] text-slate-400 truncate">{friend.mode}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end space-x-1.5">
                    {friend.status === 'online' ? (
                      <button
                        onClick={() => onShowToast({ type: 'success', title: 'Joined World', message: `Joining ${friend.username}'s world...` })}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-[11px] shadow-sm"
                      >
                        Join
                      </button>
                    ) : (
                      <button
                        onClick={() => onShowToast({ type: 'info', title: 'Invite Sent', message: `Invited ${friend.username} to party.` })}
                        className="px-3 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 font-bold text-[11px]"
                      >
                        Invite
                      </button>
                    )}
                    <button className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= RIGHT SOCIAL SIDEBAR (4 cols) ================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Current Party Card (Matching reference) */}
          <div className="p-5 rounded-3xl bg-[#0c1228]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Current Party (4/4)
              </h3>
              <SettingsIcon className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer" />
            </div>

            {/* Party Sub-Banner */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 p-3 h-20 flex items-end">
              <img src={bgPortalHero} alt="Party world" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1228] via-[#0c1228]/40 to-transparent" />
              <div className="relative z-10">
                <div className="text-xs font-bold text-white">Galaxy SMP</div>
                <div className="text-[10px] text-slate-300">Survival • 1.21.1 • Fabric</div>
              </div>
            </div>

            {/* 4 Avatars Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center -space-x-2">
                <div className="w-9 h-9 rounded-full bg-indigo-600 border-2 border-[#0c1228] flex items-center justify-center text-xs font-bold text-white shadow-md">
                  👑
                </div>
                <div className="w-9 h-9 rounded-full bg-amber-600 border-2 border-[#0c1228] flex items-center justify-center text-xs font-bold text-white shadow-md">
                  NR
                </div>
                <div className="w-9 h-9 rounded-full bg-emerald-600 border-2 border-[#0c1228] flex items-center justify-center text-xs font-bold text-white shadow-md">
                  PP
                </div>
                <div className="w-9 h-9 rounded-full bg-purple-600 border-2 border-[#0c1228] flex items-center justify-center text-xs font-bold text-white shadow-md">
                  AX
                </div>
              </div>

              <button className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-slate-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </div>

            {/* Big Join World Button */}
            <button
              onClick={() => onShowToast({ type: 'success', title: 'Connecting', message: 'Connecting to party world...' })}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-glow-sm flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Join World</span>
            </button>

            {/* Split Voice Chat & Party Settings */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06]">
              <button className="py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voice Chat</span>
              </button>
              <button className="py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors">
                <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Party Settings</span>
              </button>
            </div>
          </div>

          {/* Friend Requests Box */}
          <div className="p-5 rounded-3xl bg-[#0c1228]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Friend Requests (2)
              </h3>
              <span className="text-xs text-indigo-400 font-semibold cursor-pointer">View All →</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'MineLegend', tag: '#8831' },
                { name: 'StevePro', tag: '#9102' },
              ].map((req, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{req.name}</div>
                    <div className="text-[10px] text-slate-400">Wants to be your friend</div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onShowToast({ type: 'success', title: 'Accepted', message: `Added ${req.name} to friends.` })}
                      className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onShowToast({ type: 'info', title: 'Declined', message: `Declined request from ${req.name}.` })}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Friends */}
          <div className="p-5 rounded-3xl bg-[#0c1228]/85 backdrop-blur-2xl border border-white/[0.08] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Suggested Friends
              </h3>
              <span className="text-xs text-indigo-400 font-semibold cursor-pointer">View All →</span>
            </div>

            <div className="space-y-2">
              {[
                { name: 'EnderBoi', tag: '#7711', mutual: '12 mutual friends' },
                { name: 'BlockQueen', tag: '#6620', mutual: '8 mutual friends' },
                { name: 'RedstoneKing', tag: '#4455', mutual: '5 mutual friends' },
              ].map((sug, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05]">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{sug.name}</div>
                    <div className="text-[10px] text-slate-400">{sug.mutual}</div>
                  </div>
                  <button
                    onClick={() => onShowToast({ type: 'success', title: 'Request Sent', message: `Friend request sent to ${sug.name}.` })}
                    className="px-3 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-bold transition-colors"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#0c1228] border border-white/15 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-smooth-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-white">Add a Friend</h3>
              <button onClick={() => setShowAddFriendModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Enter your friend's Galaxy username and tag (e.g. Explorer#0001) to connect.
            </p>
            <input
              type="text"
              placeholder="Username#0000"
              value={friendTagInput}
              onChange={(e) => setFriendTagInput(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (friendTagInput.trim()) {
                    onShowToast({ type: 'success', title: 'Friend Request Sent', message: `Sent request to ${friendTagInput}` });
                    setFriendTagInput('');
                    setShowAddFriendModal(false);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-glow-sm"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
