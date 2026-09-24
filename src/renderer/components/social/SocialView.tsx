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
  MoreVertical,
  MoreHorizontal,
  Crown,
  Tag,
  Loader2,
  CheckSquare,
  Package
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

  // Sync activeTab when prop changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Data State
  const [friends, setFriends] = useState<GalaxyFriend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [profile, setProfile] = useState<UserSocialProfile | null>(null);
  const [cloudState, setCloudState] = useState<CloudSyncState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search States
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'in-game' | 'pending' | 'blocked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cloudCategoryTab, setCloudCategoryTab] = useState<'worlds' | 'modpacks' | 'settings' | 'screenshots' | 'resourcepacks'>('worlds');
  const [cloudSearchQuery, setCloudSearchQuery] = useState('');
  const [friendTagInput, setFriendTagInput] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const loadAllSocialData = async () => {
    try {
      if (!window.galaxy) return;
      setIsLoading(true);

      const [friendsList, reqsList, userProf, cState] = await Promise.all([
        window.galaxy.getFriends ? window.galaxy.getFriends() : Promise.resolve([]),
        window.galaxy.getFriendRequests ? window.galaxy.getFriendRequests() : Promise.resolve([]),
        window.galaxy.getSocialProfile ? window.galaxy.getSocialProfile() : Promise.resolve(null),
        window.galaxy.getCloudSyncState ? window.galaxy.getCloudSyncState() : Promise.resolve(null)
      ]);

      setFriends(friendsList || []);
      setRequests(reqsList || []);
      setProfile(userProf);
      setCloudState(cState);
    } catch (err) {
      console.error('Failed to load social/cloud data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllSocialData();
    const interval = setInterval(loadAllSocialData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Friend Actions
  const handleSendFriendRequest = async () => {
    if (!friendTagInput.trim()) return;
    try {
      sounds.playClick();
      const res = await window.galaxy?.sendFriendRequest(friendTagInput.trim());
      if (res) {
        sounds.playSuccess();
        onShowToast({
          type: 'success',
          title: 'Friend Request Sent!',
          message: `Sent to ${friendTagInput.trim()}`
        });
        setFriendTagInput('');
        setShowAddFriendModal(false);
        loadAllSocialData();
      }
    } catch (err: any) {
      onShowToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not send friend request.'
      });
    }
  };

  const handleAcceptRequest = async (reqId: string) => {
    sounds.playSuccess();
    await window.galaxy?.acceptFriendRequest(reqId);
    onShowToast({ type: 'success', title: 'Friend Request Accepted!' });
    loadAllSocialData();
  };

  const handleDeclineRequest = async (reqId: string) => {
    sounds.playClick();
    await window.galaxy?.declineFriendRequest(reqId);
    onShowToast({ type: 'info', title: 'Request Declined' });
    loadAllSocialData();
  };

  const handleSyncCloud = async () => {
    sounds.playClick();
    setIsSyncingCloud(true);
    try {
      if (window.galaxy?.syncAllToCloud) {
        const newState = await window.galaxy.syncAllToCloud();
        setCloudState(newState);
      }
      sounds.playSuccess();
      onShowToast({ type: 'success', title: 'Cloud Sync Complete', message: 'All backups are up to date.' });
    } catch (e: any) {
      onShowToast({ type: 'error', title: 'Sync Failed', message: e.message });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Metrics
  const onlineFriends = friends.filter((f) => f.status === 'online' || f.status === 'in-game');
  const inGameFriends = friends.filter((f) => f.status === 'in-game');
  const inLauncherFriends = friends.filter((f) => f.status === 'online');

  // Filtered Friends
  const filteredFriends = friends.filter((f) => {
    if (friendFilter === 'online') return f.status === 'online' || f.status === 'in-game';
    if (friendFilter === 'in-game') return f.status === 'in-game';
    if (searchQuery) {
      return (
        f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.tag && f.tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  // -------------------------------------------------------------
  // RENDER: CLOUD VIEW (activeTab === 'cloud')
  // -------------------------------------------------------------
  if (activeTab === 'cloud') {
    return (
      <div className="min-h-full p-6 space-y-6 select-none max-w-7xl mx-auto">
        {/* 1. PANORAMIC CLOUD HEADER BANNER */}
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-56 md:h-64 group">
          <img
            src={bgCloudSync}
            alt="Cloud Banner"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-galaxy-950/95 via-galaxy-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950/90 via-transparent to-transparent" />

          {/* Top Right Quote */}
          <div className="absolute top-5 right-6 text-right hidden sm:block">
            <p className="text-xs font-display font-medium text-slate-300/80 italic tracking-wider">
              "Save Today Explore Tomorrow"
            </p>
          </div>

          <div className="relative h-full flex flex-col justify-between p-8 z-10">
            <div>
              <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-cyan-300 uppercase block mb-1 drop-shadow">
                G A L A X Y &nbsp; C L O U D
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                Your Worlds, Everywhere
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 max-w-lg">
                Backup, sync and manage your Minecraft data across all your devices. Safe, secure and seamless.
              </p>
            </div>

            {/* 4 Feature Pills */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Automatic Backups</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sync Across Devices</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>Multiple Data Types</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200 hidden md:flex">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. OVERVIEW ROW (Storage Card + Sync Status Card) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Storage Quota Card */}
          <div className="rounded-3xl p-5 bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-mono font-bold text-white">
                    24.8 GB <span className="text-slate-400 text-xs">/ 100 GB Used</span>
                  </div>
                  <div className="text-xs text-slate-400">Cloud Storage Quota</div>
                </div>
              </div>

              <button className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs shadow-sm">
                ★ Upgrade Plan
              </button>
            </div>

            {/* Storage Meter Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden flex">
                <div className="h-full bg-blue-500 w-[50%]" title="Worlds" />
                <div className="h-full bg-purple-500 w-[25%]" title="Mods" />
                <div className="h-full bg-cyan-400 w-[13%]" title="Resource Packs" />
                <div className="h-full bg-indigo-500 w-[12%]" title="Other" />
              </div>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Worlds: 12.4 GB</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Mods: 6.1 GB</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Resource Packs: 3.2 GB</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Other: 3.1 GB</span>
                </span>
              </div>
            </div>
          </div>

          {/* Sync Status Card */}
          <div className="rounded-3xl p-5 bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Sync Status</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-display font-bold text-white text-base">
                  All data is synced
                </span>
              </div>
              <div className="text-xs text-slate-400">Last synced 12 minutes ago</div>
              <button
                onClick={handleSyncCloud}
                disabled={isSyncingCloud}
                className="mt-1 flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 text-xs text-slate-300 border-l border-white/[0.08] pl-4 shrink-0">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="text-slate-200">Worlds</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="text-slate-200">Mods & Modpacks</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="text-slate-200">Settings</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span className="text-slate-200">Screenshots</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 2-COLUMN MAIN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: BACKUP MANAGER TABLE (~65% -> 8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Category Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar pb-1">
              {[
                { id: 'worlds', label: `World Backups (${instances.length})`, icon: Boxes },
                { id: 'modpacks', label: 'Modpacks (4)', icon: Package },
                { id: 'settings', label: 'Settings (2)', icon: SettingsIcon },
                { id: 'screenshots', label: 'Screenshots (12)', icon: Camera },
                { id: 'resourcepacks', label: 'Resource Packs (5)', icon: Tag }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = cloudCategoryTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sounds.playSwitch();
                      setCloudCategoryTab(tab.id as any);
                    }}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow-sm'
                        : 'bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Backups Rows */}
            <div className="rounded-3xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] p-4 space-y-3">
              {instances.length > 0 ? (
                instances.map((inst, idx) => (
                  <div
                    key={inst.id}
                    className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all gap-4"
                  >
                    {/* World Info */}
                    <div className="flex items-center space-x-3 min-w-0 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
                        <img
                          src={idx % 2 === 0 ? bgNether : bgSunset}
                          alt={inst.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-display font-bold text-white text-xs truncate">
                            {inst.name}
                          </h4>
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        </div>
                        <div className="flex items-center space-x-2 text-[10.5px] text-slate-400 mt-0.5">
                          <span>{inst.version} • {inst.loader}</span>
                          <span>•</span>
                          <span>2.8 GB</span>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Backup Toggle & Actions */}
                    <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.06]">
                      <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                        <RefreshCw className="w-3 h-3" />
                        <span>Auto Backup</span>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playLaunch();
                          onLaunchInstance(inst);
                        }}
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Play</span>
                      </button>
                      <button className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Cloud className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No world backups found on your Galaxy Cloud.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CLOUD TOOLS (~35% -> 4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Upload World Dropzone */}
            <div className="rounded-3xl bg-galaxy-950/70 backdrop-blur-2xl border border-white/[0.1] p-5 space-y-4 shadow-2xl">
              <div>
                <h3 className="font-display font-bold text-white text-sm flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload World</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload a world from your device to your Galaxy Cloud.
                </p>
              </div>

              <div className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-2xl p-6 text-center space-y-3 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 mx-auto group-hover:scale-110 transition-all" />
                <p className="text-xs text-slate-300">
                  Drag & drop a world folder here or click to select
                </p>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm">
                  Select World Folder
                </button>
              </div>
            </div>

            {/* Recent Activity / Cloud Log */}
            <div className="rounded-3xl bg-galaxy-950/70 backdrop-blur-2xl border border-white/[0.1] p-5 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-display font-bold text-white text-sm">
                    Recent Activity
                  </h3>
                </div>
                <span className="text-[11px] text-indigo-400 font-semibold cursor-pointer">View All →</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Upload className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Backed up "Galaxy SMP"</p>
                    <p className="text-[10px] text-slate-500">2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Synced mods for "Mod Testing"</p>
                    <p className="text-[10px] text-slate-500">5 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    <HardDrive className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Uploaded resource pack</p>
                    <p className="text-[10px] text-slate-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: FRIENDS VIEW (activeTab === 'friends' | 'requests')
  // -------------------------------------------------------------
  return (
    <div className="min-h-full p-6 space-y-6 select-none max-w-7xl mx-auto">
      {/* 1. PANORAMIC CAMPFIRE FRIENDS BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl h-56 md:h-64 group">
        <img
          src={bgCampfireFriends}
          alt="Friends Banner"
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-galaxy-950/95 via-galaxy-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950/90 via-transparent to-transparent" />

        {/* Top Right Quote */}
        <div className="absolute top-5 right-6 text-right hidden sm:block">
          <p className="text-xs font-display font-medium text-slate-300/80 italic tracking-wider">
            "Good Friends Make Greater Worlds"
          </p>
        </div>

        <div className="relative h-full flex flex-col justify-between p-8 z-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
              Friends <Users className="w-7 h-7 text-indigo-400 inline-block" />
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 max-w-lg">
              Connect with friends, join parties and play together across worlds.
            </p>
          </div>

          {/* 4 Social Stats Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>{onlineFriends.length} Online</span>
            </div>
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{friends.length} Total Friends</span>
            </div>
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
              <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{inGameFriends.length} In Game</span>
            </div>
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200 hidden md:flex">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{inLauncherFriends.length} In Launcher</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 bg-galaxy-950/60 backdrop-blur-xl p-1 rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => {
              sounds.playSwitch();
              setFriendFilter('all');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              friendFilter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => {
              sounds.playSwitch();
              setFriendFilter('online');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              friendFilter === 'online'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Online ({onlineFriends.length})
          </button>
          <button
            onClick={() => {
              sounds.playSwitch();
              setFriendFilter('in-game');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              friendFilter === 'in-game'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            In Game ({inGameFriends.length})
          </button>
          <button
            onClick={() => {
              sounds.playSwitch();
              setFriendFilter('pending');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              friendFilter === 'pending'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({requests.length})
          </button>
        </div>

        {/* Right Search & Add Friend */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="bg-galaxy-950/60 border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              setShowAddFriendModal(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm hover:from-blue-500 hover:to-indigo-500 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>
      </div>

      {/* 3. 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: FRIENDS TABLE (~65% -> 8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="rounded-3xl bg-galaxy-950/60 backdrop-blur-xl border border-white/[0.08] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Friend</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-4">Current Activity</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {filteredFriends.length > 0 ? (
              <div className="divide-y divide-white/[0.04]">
                {filteredFriends.map((f) => (
                  <div
                    key={f.id}
                    className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center text-xs hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Friend Avatar & Tag */}
                    <div className="col-span-4 flex items-center space-x-3 min-w-0">
                      <div className="relative">
                        <img
                          src={f.avatarUrl || `https://minotar.net/avatar/${f.username}/32`}
                          alt={f.username}
                          className="w-8 h-8 rounded-xl bg-slate-800 object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-galaxy-950 ${
                            f.status === 'in-game'
                              ? 'bg-amber-400'
                              : f.status === 'online'
                              ? 'bg-emerald-400'
                              : 'bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-white truncate">
                          {f.username}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {f.tag ? `#${f.tag}` : `#${f.id.slice(0, 4)}`}
                        </div>
                      </div>
                    </div>

                    {/* Status Text */}
                    <div className="col-span-2">
                      <span
                        className={`text-[11px] font-semibold ${
                          f.status === 'in-game'
                            ? 'text-amber-400'
                            : f.status === 'online'
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {f.status === 'in-game'
                          ? 'In Game'
                          : f.status === 'online'
                          ? 'Online'
                          : 'Offline'}
                      </span>
                    </div>

                    {/* Current Activity Badge */}
                    <div className="col-span-4">
                      {f.activity || f.instanceName || f.serverName ? (
                        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] text-slate-200">
                          <Gamepad2 className="w-3 h-3 text-indigo-400" />
                          <span className="truncate">{f.activity || f.instanceName || f.serverName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="col-span-2 flex items-center justify-end space-x-1.5">
                      <button className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-[11px]">
                        Join
                      </button>
                      <button className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 space-y-3">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="max-w-sm mx-auto">
                  No friends added yet. Connect with players by sharing your tag or adding their username!
                </p>
                <button
                  onClick={() => setShowAddFriendModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs"
                >
                  + Add Your First Friend
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: SOCIAL HUB (~35% -> 4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Current Party Card */}
          <div className="rounded-3xl bg-galaxy-950/70 backdrop-blur-2xl border border-white/[0.1] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-sm">
                Current Party (1/4)
              </h3>
              <button className="p-1 text-slate-400 hover:text-white">
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Active World Banner */}
            <div className="relative rounded-2xl overflow-hidden h-24 border border-white/10 p-3 flex flex-col justify-end">
              <img
                src={bgNether}
                alt="Party World"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950 via-galaxy-950/40 to-transparent" />
              <div className="relative z-10">
                <h4 className="font-bold text-white text-xs">Galaxy SMP</h4>
                <p className="text-[10px] text-slate-300">Survival • 1.21.1 • Fabric</p>
              </div>
            </div>

            {/* Party Members Avatars Row */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <img
                  src={
                    activeAccount?.skinUrl ||
                    `https://minotar.net/avatar/${activeAccount?.username || 'Steve'}/32`
                  }
                  alt="You"
                  className="w-10 h-10 rounded-xl bg-slate-800 object-cover ring-2 ring-indigo-500"
                />
                <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
              </div>
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="w-10 h-10 rounded-xl border-2 border-dashed border-white/20 hover:border-indigo-500/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Invite to party"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Party Actions */}
            <div className="space-y-2 pt-1">
              <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs shadow-glow flex items-center justify-center space-x-2">
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Join World</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice Chat</span>
                </button>
                <button className="py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5">
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>Party Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Friend Requests Card */}
          <div className="rounded-3xl bg-galaxy-950/70 backdrop-blur-2xl border border-white/[0.1] p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="font-display font-bold text-white text-sm">
                Friend Requests ({requests.length})
              </h3>
            </div>

            {requests.length > 0 ? (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs"
                  >
                    <div className="truncate">
                      <div className="font-bold text-white truncate">
                        {r.senderUsername}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Wants to be your friend
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(r.id)}
                        className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(r.id)}
                        className="p-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/40"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-slate-400">
                No pending friend requests.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 bg-galaxy-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-smooth-in">
          <div className="w-full max-w-md bg-galaxy-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-base">
                Add Friend
              </h3>
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Enter your friend's Galaxy Username or Tag (e.g. <code>Player#1234</code>):
              </p>
              <input
                type="text"
                value={friendTagInput}
                onChange={(e) => setFriendTagInput(e.target.value)}
                placeholder="Username or Galaxy Tag..."
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowAddFriendModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSendFriendRequest}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm"
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
