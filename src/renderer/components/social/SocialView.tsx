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
  CloudCheck,
  CloudOff,
  RefreshCw,
  Trophy,
  Activity,
  Send,
  UserCheck,
  UserX,
  Radio,
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
  X
} from 'lucide-react';
import {
  GalaxyFriend,
  FriendRequest,
  UserSocialProfile,
  GlobalGameStats,
  CloudSyncState,
  CloudInstanceSnapshot,
  Instance,
  Account
} from '../../../preload/types';
import { sounds } from '../../services/soundEngine';
import { ConfirmModal } from '../common/ConfirmModal';

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
  
  // Data State
  const [friends, setFriends] = useState<GalaxyFriend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [profile, setProfile] = useState<UserSocialProfile | null>(null);
  const [gameStats, setGameStats] = useState<GlobalGameStats | null>(null);
  const [cloudState, setCloudState] = useState<CloudSyncState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Forms & Modals
  const [friendTagInput, setFriendTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-game' | 'online' | 'offline'>('all');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editingStatusText, setEditingStatusText] = useState('');
  const [copiedTag, setCopiedTag] = useState(false);
  const [copiedServerIp, setCopiedServerIp] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [restoringCloudId, setRestoringCloudId] = useState<string | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<GalaxyFriend | null>(null);

  // Avatar Customization State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const loadAllSocialData = async () => {
    try {
      if (!window.galaxy) return;
      setIsLoading(true);

      const [
        friendsList,
        reqsList,
        userProf,
        statsData,
        cloud
      ] = await Promise.all([
        window.galaxy.getFriends().catch(() => []),
        window.galaxy.getFriendRequests().catch(() => []),
        window.galaxy.getSocialProfile().catch(() => null),
        window.galaxy.getGameStats().catch(() => null),
        window.galaxy.getCloudSyncState().catch(() => null)
      ]);

      setFriends(friendsList || []);
      setRequests(reqsList || []);
      setProfile(userProf);
      setGameStats(statsData);
      setCloudState(cloud);
      if (userProf?.statusMessage) {
        setEditingStatusText(userProf.statusMessage);
      }
    } catch (err) {
      console.error('Failed to load social data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllSocialData();

    if (window.galaxy) {
      const unsubFriends = window.galaxy.onFriendsUpdated?.((data) => setFriends(data));
      const unsubReqs = window.galaxy.onRequestsUpdated?.((data) => setRequests(data));
      const unsubProf = window.galaxy.onProfileUpdated?.((data) => setProfile(data));
      const unsubCloud = window.galaxy.onCloudSyncUpdated?.((data) => setCloudState(data));

      return () => {
        unsubFriends?.();
        unsubReqs?.();
        unsubProf?.();
        unsubCloud?.();
      };
    }
  }, []);

  // Copy Tag to Clipboard
  const handleCopyTag = () => {
    const tag = profile?.tag || (activeAccount ? `${activeAccount.username}#1337` : 'Player#1337');
    navigator.clipboard.writeText(tag);
    setCopiedTag(true);
    sounds.playClick();
    onShowToast({
      type: 'success',
      title: 'Galaxy Tag Copied',
      message: `${tag} copied to clipboard! Share it with friends.`
    });
    setTimeout(() => setCopiedTag(false), 2500);
  };

  // Copy Server IP
  const handleCopyServer = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedServerIp(ip);
    sounds.playClick();
    onShowToast({
      type: 'info',
      title: 'Server IP Copied',
      message: `${ip} copied to clipboard!`
    });
    setTimeout(() => setCopiedServerIp(null), 2500);
  };

  // Send Friend Request
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const tag = friendTagInput.trim();
    if (!tag) return;

    if (!tag.includes('#')) {
      onShowToast({
        type: 'warning',
        title: 'Invalid Tag Format',
        message: 'Please include the 4-digit tag, e.g. "CosmicPlayer#1234".'
      });
      return;
    }

    try {
      sounds.playClick();
      const res = await window.galaxy?.sendFriendRequest(tag);
      if (res) {
        sounds.playSuccess();
        setFriendTagInput('');
        const updatedReqs = await window.galaxy?.getFriendRequests();
        setRequests(updatedReqs || []);
        onShowToast({
          type: 'success',
          title: 'Friend Request Sent',
          message: `Request successfully sent to ${tag}!`
        });
      }
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        type: 'error',
        title: 'Failed to Send Request',
        message: err.message || 'Could not find player or request already exists.'
      });
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = async (reqId: string, senderName: string) => {
    try {
      sounds.playSuccess();
      const newFriend = await window.galaxy?.acceptFriendRequest(reqId);
      if (newFriend) {
        const [updatedFriends, updatedReqs] = await Promise.all([
          window.galaxy?.getFriends(),
          window.galaxy?.getFriendRequests()
        ]);
        setFriends(updatedFriends || []);
        setRequests(updatedReqs || []);
        onShowToast({
          type: 'success',
          title: 'Friend Added!',
          message: `You and ${senderName} are now Galaxy friends!`
        });
      }
    } catch (err) {
      onShowToast({ type: 'error', title: 'Failed to accept friend request' });
    }
  };

  // Decline Friend Request
  const handleDeclineRequest = async (reqId: string) => {
    try {
      sounds.playClick();
      await window.galaxy?.declineFriendRequest(reqId);
      const updatedReqs = await window.galaxy?.getFriendRequests();
      setRequests(updatedReqs || []);
      onShowToast({ type: 'info', title: 'Friend request declined' });
    } catch (err) {
      onShowToast({ type: 'error', title: 'Failed to decline request' });
    }
  };

  // Toggle Favorite Friend
  const handleToggleFavoriteFriend = async (friendId: string) => {
    try {
      sounds.playClick();
      await window.galaxy?.toggleFavoriteFriend(friendId);
      const updated = await window.galaxy?.getFriends();
      setFriends(updated || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Remove Friend
  const handleConfirmRemoveFriend = async () => {
    if (!friendToRemove) return;
    try {
      sounds.playClick();
      await window.galaxy?.removeFriend(friendToRemove.id);
      const updated = await window.galaxy?.getFriends();
      setFriends(updated || []);
      onShowToast({
        type: 'info',
        title: 'Friend Removed',
        message: `Removed ${friendToRemove.username} from your friends list.`
      });
    } catch (err) {
      onShowToast({ type: 'error', title: 'Failed to remove friend' });
    } finally {
      setFriendToRemove(null);
    }
  };

  // Update Status Message
  const handleSaveStatusMessage = async () => {
    try {
      sounds.playSuccess();
      const updated = await window.galaxy?.updateSocialProfile({
        statusMessage: editingStatusText.trim() || 'Exploring the cosmic void 🌌'
      });
      if (updated) {
        setProfile(updated);
        setIsEditingStatus(false);
        onShowToast({
          type: 'success',
          title: 'Status Updated',
          message: 'Your custom status message is now visible to friends.'
        });
      }
    } catch (err) {
      onShowToast({ type: 'error', title: 'Failed to update status message' });
    }
  };

  // Toggle Instance Favorite
  const handleToggleInstanceFavorite = async (instanceId: string) => {
    try {
      sounds.playClick();
      await window.galaxy?.toggleInstanceFavorite(instanceId);
      const stats = await window.galaxy?.getGameStats();
      setGameStats(stats || null);
    } catch (err) {
      console.error(err);
    }
  };

  // Avatar Management
  const handleOpenAvatarModal = () => {
    sounds.playClick();
    setAvatarPreview(currentSkinUrl);
    setCustomAvatarInput('');
    setShowAvatarModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      onShowToast({ type: 'warning', title: 'Image Too Large', message: 'Please select an image smaller than 3 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        sounds.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToMinecraftSkin = () => {
    sounds.playClick();
    setAvatarPreview(defaultSkinUrl);
  };

  const handleCustomPlayerPreview = () => {
    const trimmed = customAvatarInput.trim();
    if (!trimmed) return;
    sounds.playClick();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
      setAvatarPreview(trimmed);
    } else {
      setAvatarPreview(`https://minotar.net/helm/${encodeURIComponent(trimmed)}/128`);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    try {
      setIsSavingAvatar(true);
      sounds.playSuccess();
      const updated = await window.galaxy?.updateSocialProfile({
        avatarUrl: avatarPreview
      });
      if (updated) {
        setProfile(updated);
        setShowAvatarModal(false);
        onShowToast({
          type: 'success',
          title: 'Profile Picture Updated',
          message: 'Your new avatar is now active across Galaxy Launcher.'
        });
      }
    } catch (err) {
      onShowToast({ type: 'error', title: 'Failed to update avatar' });
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Cloud Actions
  const handleToggleCloud = async () => {
    if (!cloudState) return;
    try {
      sounds.playSwitch();
      const updated = await window.galaxy?.toggleCloudSync(!cloudState.enabled);
      setCloudState(updated || null);
      onShowToast({
        type: updated?.enabled ? 'success' : 'info',
        title: updated?.enabled ? 'Galaxy Cloud Active' : 'Galaxy Cloud Disabled',
        message: updated?.enabled ? 'Instances and data now sync across all your devices.' : 'Sync paused.'
      });
    } catch (err) {
      onShowToast({ type: 'error', title: 'Failed to toggle cloud sync' });
    }
  };

  const handleSyncAllCloud = async () => {
    setIsSyncingCloud(true);
    sounds.playSwitch();
    try {
      const updated = await window.galaxy?.syncAllToCloud();
      setCloudState(updated || null);
      sounds.playSuccess();
      onShowToast({
        type: 'success',
        title: 'Cloud Sync Complete',
        message: `Synced ${updated?.cloudInstances.length || 0} snapshot(s) to Galaxy Cloud.`
      });
    } catch (err) {
      onShowToast({ type: 'error', title: 'Sync Failed' });
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleRestoreCloudSnapshot = async (snap: CloudInstanceSnapshot) => {
    setRestoringCloudId(snap.id);
    sounds.playClick();
    try {
      const restored = await window.galaxy?.restoreInstanceFromCloud(snap.id);
      if (restored) {
        sounds.playSuccess();
        onShowToast({
          type: 'success',
          title: `Restored "${snap.name}"`,
          message: 'Instance restored and available in your library!'
        });
        onInstanceRestored?.(restored);
      }
    } catch (err) {
      onShowToast({ type: 'error', title: 'Failed to restore instance' });
    } finally {
      setRestoringCloudId(null);
    }
  };

  const handleDeleteCloudSnapshot = async (id: string, name: string) => {
    if (!confirm(`Delete cloud backup for "${name}"?`)) return;
    try {
      sounds.playClick();
      await window.galaxy?.deleteCloudInstance(id);
      const updated = await window.galaxy?.getCloudSyncState();
      setCloudState(updated || null);
      onShowToast({ type: 'info', title: 'Backup Deleted' });
    } catch (err) {
      onShowToast({ type: 'error', title: 'Failed to delete snapshot' });
    }
  };

  // Filtered Friends
  const filteredFriends = friends.filter((f) => {
    const matchesSearch = f.username.toLowerCase().includes(searchQuery.toLowerCase()) || f.tag.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'in-game') return f.status === 'in-game';
    if (statusFilter === 'online') return f.status === 'online' || f.status === 'in-game';
    if (statusFilter === 'offline') return f.status === 'offline';
    return true;
  });

  const onlineCount = friends.filter((f) => f.status === 'online' || f.status === 'in-game').length;
  const inGameCount = friends.filter((f) => f.status === 'in-game').length;
  const incomingReqsCount = requests.filter((r) => r.type === 'incoming').length;

  // Profile Username, Tag and Avatar resolution
  const currentUsername = activeAccount?.username || (profile?.username && profile.username !== 'Admin' && profile.username !== 'GalaxyVoyager' ? profile.username : 'Random Gamer');
  const currentTag = profile?.tag || (activeAccount ? `#${Math.floor(1000 + Math.random() * 9000)}` : '#4383');
  
  const defaultSkinUrl = (activeAccount?.skinUrl && !activeAccount.skinUrl.includes('/skin/'))
    ? activeAccount.skinUrl
    : `https://minotar.net/helm/${encodeURIComponent(currentUsername)}/128`;

  const currentSkinUrl = (profile?.avatarUrl && !profile.avatarUrl.includes('/avatar/Admin') && !profile.avatarUrl.includes('/helm/Admin') && !profile.avatarUrl.includes('/helm/GalaxyVoyager'))
    ? profile.avatarUrl
    : defaultSkinUrl;

  // Level & XP System
  const totalXp = gameStats?.totalXp || 0;
  const currentLevel = gameStats?.galaxyLevel || Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1);
  const currentLevelBaseXp = Math.pow(currentLevel - 1, 2) * 100;
  const nextLevelBaseXp = Math.pow(currentLevel, 2) * 100;
  const xpSpanForCurrentLevel = Math.max(1, nextLevelBaseXp - currentLevelBaseXp);
  const currentLevelXpEarned = Math.max(0, totalXp - currentLevelBaseXp);
  const xpToNextLevel = Math.max(0, nextLevelBaseXp - totalXp);
  const levelProgressPercent = Math.min(100, Math.round((currentLevelXpEarned / xpSpanForCurrentLevel) * 100));

  const getRankTitle = (lvl: number) => {
    if (lvl >= 30) return 'Universal Overlord 👑';
    if (lvl >= 20) return 'Celestial Sovereign 🌌';
    if (lvl >= 15) return 'Galactic Legend ⭐';
    if (lvl >= 10) return 'Nebula Master 🪐';
    if (lvl >= 5) return 'Cosmic Voyager 🚀';
    if (lvl >= 3) return 'Star Explorer 🧭';
    return 'Void Wanderer 🌑';
  };

  const formattedJoinedDate = profile?.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Recently';

  return (
    <div className="h-full flex flex-col overflow-hidden bg-galaxy-950/40 select-none">
      {/* Top Header Bar */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-white/[0.06] bg-galaxy-950/60 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
              <Users className="w-6 h-6 text-theme-accent" />
              <span>Galaxy Social & Statistics</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-theme-accent/15 text-theme-accent border border-theme-accent/30 shadow-glow-sm">
              v1.0.4 Update
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time player activity, per-instance gameplay stats, and multi-device cloud saves.
          </p>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center space-x-3">
          {/* Own Tag Badge */}
          <button
            onClick={handleCopyTag}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 transition-all group"
            title="Click to copy your Galaxy Tag"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-mono text-theme-accent">{currentTag}</span>
            {copiedTag ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              sounds.playClick();
              loadAllSocialData();
            }}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-200 transition-all"
            title="Refresh Social & Activity Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-theme-accent' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex-shrink-0 px-8 pt-4 pb-2 flex items-center space-x-2 border-b border-white/[0.04]">
        <button
          onClick={() => {
            sounds.playSwitch();
            setActiveTab('friends');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'friends'
              ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/40 shadow-glow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Friends & Activity</span>
          {friends.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-md bg-white/[0.08] text-[10px] font-mono">
              {onlineCount}/{friends.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sounds.playSwitch();
            setActiveTab('requests');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all relative ${
            activeTab === 'requests'
              ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/40 shadow-glow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Friend Requests</span>
          {incomingReqsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-theme-accent text-white text-[10px] font-bold animate-pulse">
              {incomingReqsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sounds.playSwitch();
            setActiveTab('cloud');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'cloud'
              ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent/40 shadow-glow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Galaxy Cloud Sync</span>
        </button>
      </div>

      {/* Main Tab Viewport */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar w-full">
        {/* TAB 1: FRIENDS & ACTIVITY */}
        {activeTab === 'friends' && (
          <div className="space-y-6 w-full">
            {/* Control Bar: Search, Filters & Add Friend Form */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
              {/* Search & Status Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-theme-accent w-48 sm:w-60"
                  />
                </div>

                <div className="flex items-center space-x-1 p-1 rounded-xl bg-black/30 border border-white/[0.04]">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setStatusFilter('all');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === 'all' ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({friends.length})
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setStatusFilter('in-game');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                      statusFilter === 'in-game' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>In-Game ({inGameCount})</span>
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setStatusFilter('online');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === 'online' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Online ({onlineCount})
                  </button>
                </div>
              </div>

              {/* Quick Add Friend Input */}
              <form onSubmit={handleSendRequest} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={friendTagInput}
                  onChange={(e) => setFriendTagInput(e.target.value)}
                  placeholder="Enter Player#1234"
                  className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-theme-accent w-48 sm:w-56"
                />
                <button
                  type="submit"
                  disabled={!friendTagInput.trim()}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl btn-accent font-medium text-xs shadow-glow-sm disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* Friends Grid */}
            {filteredFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl bg-white/[0.02] border border-white/[0.04]">
                <div className="w-16 h-16 rounded-2xl bg-theme-accent/10 border border-theme-accent/30 flex items-center justify-center text-theme-accent mb-4 shadow-glow-md">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-200 mb-1">
                  {searchQuery ? 'No matching friends found' : 'Your Galaxy is Empty'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  {searchQuery
                    ? 'Try searching with a different username or tag.'
                    : 'Connect with friends to see what modpacks they are playing, join multiplayer servers together, and compare playtime stats.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setActiveTab('requests');
                    }}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl btn-accent text-xs font-semibold shadow-glow-md hover:scale-[1.02] transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Send a Friend Request</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFriends.map((friend) => {
                  const isInGame = friend.status === 'in-game';
                  const isOnline = friend.status === 'online';

                  return (
                    <div
                      key={friend.id}
                      className={`p-4 rounded-2xl border transition-all relative group overflow-hidden ${
                        isInGame
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                          : isOnline
                          ? 'bg-white/[0.03] border-white/[0.08] hover:border-theme-accent/40'
                          : 'bg-white/[0.015] border-white/[0.04] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Avatar & User Info */}
                        <div className="flex items-start space-x-3.5">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/[0.1] overflow-hidden flex items-center justify-center shadow-md">
                              {friend.avatarUrl ? (
                                <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full object-cover" />
                              ) : (
                                <img
                                  src={`https://minotar.net/avatar/${friend.username}/64`}
                                  alt={friend.username}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                            {/* Status Indicator Dot */}
                            <span
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-galaxy-950 flex items-center justify-center ${
                                isInGame
                                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                                  : isOnline
                                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                  : 'bg-slate-600'
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-sm text-slate-100">{friend.username}</span>
                              <span className="text-[11px] font-mono text-slate-400">{friend.tag}</span>
                            </div>

                            {/* Status Badge */}
                            <div className="mt-1 flex items-center space-x-2">
                              {isInGame ? (
                                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                                  <Gamepad2 className="w-3 h-3" />
                                  <span>Playing Minecraft</span>
                                </span>
                              ) : isOnline ? (
                                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30">
                                  <Radio className="w-3 h-3" />
                                  <span>Online in Launcher</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{friend.lastSeen}</span>
                                </span>
                              )}
                            </div>

                            {/* Custom Status Message */}
                            {friend.statusMessage && (
                              <p className="text-xs text-slate-300 mt-1.5 italic line-clamp-1">
                                "{friend.statusMessage}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Top Actions: Star & Remove */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleFavoriteFriend(friend.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              friend.isFavorite
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 shadow-glow-sm'
                                : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border-white/[0.06]'
                            }`}
                            title={friend.isFavorite ? 'Unstar friend' : 'Star as favorite friend'}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>

                          <button
                            onClick={() => setFriendToRemove(friend)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/[0.06] hover:border-red-500/30 transition-all"
                            title="Remove Friend"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* IN-GAME DETAILS BOX */}
                      {isInGame && (
                        <div className="mt-3.5 pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1.5 text-xs text-emerald-200 font-medium">
                              <Zap className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{friend.instanceName || 'Minecraft Instance'}</span>
                              {friend.gameVersion && (
                                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                                  {friend.gameVersion}
                                </span>
                              )}
                            </div>
                            {friend.serverAddress && (
                              <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-300">
                                <Server className="w-3 h-3 text-slate-400" />
                                <span>{friend.serverAddress}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Join / Copy IP buttons */}
                          {friend.serverAddress && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCopyServer(friend.serverAddress!)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-[11px] font-medium transition-all"
                                title="Copy Server Address"
                              >
                                {copiedServerIp === friend.serverAddress ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>{copiedServerIp === friend.serverAddress ? 'Copied' : 'Copy IP'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FRIEND REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-6 w-full">
            {/* Send Request Card */}
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2 mb-2">
                <UserPlus className="w-4 h-4 text-theme-accent" />
                <span>Send a Galaxy Friend Request</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Connect directly with players by entering their unique Galaxy Tag (Username#0000).
              </p>

              <form onSubmit={handleSendRequest} className="flex items-center gap-3">
                <input
                  type="text"
                  value={friendTagInput}
                  onChange={(e) => setFriendTagInput(e.target.value)}
                  placeholder="e.g. CosmicMiner#4920"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-theme-accent"
                />
                <button
                  type="submit"
                  disabled={!friendTagInput.trim()}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl btn-accent font-semibold text-xs shadow-glow-sm disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Request</span>
                </button>
              </form>
            </div>

            {/* Incoming Requests */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                Incoming Requests ({requests.filter((r) => r.type === 'incoming').length})
              </h3>

              {requests.filter((r) => r.type === 'incoming').length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.015] border border-white/[0.04] text-center text-xs text-slate-500">
                  No pending incoming friend requests.
                </div>
              ) : (
                requests
                  .filter((r) => r.type === 'incoming')
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/[0.1] overflow-hidden flex items-center justify-center">
                          <img
                            src={`https://minotar.net/avatar/${req.senderUsername}/48`}
                            alt={req.senderUsername}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-100">{req.senderUsername}</div>
                          <div className="text-[11px] font-mono text-slate-400">{req.senderTag}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Received {req.createdAt}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAcceptRequest(req.id, req.senderUsername)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 text-xs font-medium transition-all"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/[0.06] transition-all"
                          title="Decline"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Outgoing Requests */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                Outgoing Requests ({requests.filter((r) => r.type === 'outgoing').length})
              </h3>

              {requests.filter((r) => r.type === 'outgoing').length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.015] border border-white/[0.04] text-center text-xs text-slate-500">
                  No outgoing requests pending approval.
                </div>
              ) : (
                requests
                  .filter((r) => r.type === 'outgoing')
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <div>
                          <span className="text-xs font-mono text-slate-300">{req.senderTag}</span>
                          <span className="text-[10px] text-slate-500 ml-2">Pending acceptance</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeclineRequest(req.id)}
                        className="text-[11px] text-slate-400 hover:text-red-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GALAXY CLOUD SYNC & BACKUPS */}
        {activeTab === 'cloud' && (
          <div className="space-y-6 w-full">
            {/* Cloud Status Hero Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] backdrop-blur-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-theme-accent/20 border border-theme-accent/40 flex items-center justify-center text-theme-accent shadow-glow-md">
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                        <span>Galaxy Cross-Device Cloud Sync</span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Device: <span className="font-mono text-slate-300">{cloudState?.deviceName || 'Desktop'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSyncAllCloud}
                    disabled={isSyncingCloud}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl btn-accent font-semibold text-xs shadow-glow-sm disabled:opacity-40 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                    <span>Sync All Instances Now</span>
                  </button>

                  <button
                    onClick={handleToggleCloud}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      cloudState?.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-sm'
                        : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                    }`}
                  >
                    {cloudState?.enabled ? 'Auto-Sync: Active' : 'Enable Auto-Sync'}
                  </button>
                </div>
              </div>

              {/* Storage Meter */}
              <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Cloud Storage Quota</span>
                  <span className="text-theme-accent font-semibold">
                    {((cloudState?.storageUsedBytes || 0) / (1024 * 1024)).toFixed(1)} MB / 5.0 GB
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-theme-accent rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        2,
                        ((cloudState?.storageUsedBytes || 0) / (cloudState?.storageMaxBytes || 1)) * 100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Cloud Snapshots List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200">
                Backed Up Cloud Snapshots ({cloudState?.cloudInstances?.length || 0})
              </h3>

              {(!cloudState?.cloudInstances || cloudState.cloudInstances.length === 0) ? (
                <div className="p-8 rounded-2xl bg-white/[0.015] border border-white/[0.04] text-center text-xs text-slate-500">
                  No cloud snapshots stored yet. Click "Sync All Instances Now" to back up your local instances.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cloudState.cloudInstances.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">{snap.name}</h4>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {snap.loader} {snap.version} • {snap.modsCount} mod(s)
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Backed up: {new Date(snap.lastBackedUpAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleRestoreCloudSnapshot(snap)}
                            disabled={restoringCloudId === snap.id}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-theme-accent/20 hover:bg-theme-accent/30 text-theme-accent border border-theme-accent/40 text-xs font-semibold shadow-glow-sm disabled:opacity-40 transition-all"
                            title="Restore this instance to your local launcher"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{restoringCloudId === snap.id ? 'Restoring...' : 'Restore'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCloudSnapshot(snap.id, snap.name)}
                            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/[0.06] transition-all"
                            title="Delete snapshot from cloud"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Remove Friend Confirmation Modal */}
      {friendToRemove && (
        <ConfirmModal
          isOpen={Boolean(friendToRemove)}
          title="Remove Friend"
          description={`Are you sure you want to remove "${friendToRemove.username}" (${friendToRemove.tag}) from your friends list?`}
          confirmText="Remove Friend"
          type="danger"
          onConfirm={handleConfirmRemoveFriend}
          onClose={() => setFriendToRemove(null)}
        />
      )}

      {/* Avatar Customization Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-galaxy-900/95 border border-white/10 shadow-2xl space-y-6 overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-theme-accent/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent shadow-glow-sm">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Customize Profile Picture</h3>
                  <p className="text-xs text-slate-400">Change your avatar or use your active Minecraft skin</p>
                </div>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3 relative z-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-black/80 border-2 border-theme-accent shadow-glow-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={avatarPreview || currentSkinUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultSkinUrl;
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-[10px] shadow-glow-md border border-white/30 font-mono">
                  Lv. {currentLevel}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-slate-200">{currentUsername}</div>
                <div className="text-[11px] text-theme-accent font-mono">{currentTag}</div>
              </div>
            </div>

            {/* Avatar Input Options */}
            <div className="space-y-3 relative z-10">
              {/* Option 1: File Upload */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Upload Custom Image
                </label>
                <label className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-theme-accent/50 text-xs font-medium text-slate-300 hover:text-white cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-theme-accent" />
                  <span>Choose Image File (PNG, JPG, WebP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option 2: Enter Minecraft IGN or URL */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Or Enter Minecraft Username / URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customAvatarInput}
                    onChange={(e) => setCustomAvatarInput(e.target.value)}
                    placeholder="e.g. Notch or https://..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-theme-accent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomPlayerPreview();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCustomPlayerPreview}
                    disabled={!customAvatarInput.trim()}
                    className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 disabled:opacity-40 transition-all"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Option 3: Reset to Active Minecraft Account Skin */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResetToMinecraftSkin}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center space-x-2 transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-theme-accent" />
                  <span>Reset to Active Minecraft Skin ({currentUsername})</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/[0.08] relative z-10">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                disabled={isSavingAvatar || !avatarPreview}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl btn-accent text-xs font-bold shadow-glow-md disabled:opacity-40 transition-all"
              >
                {isSavingAvatar ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Avatar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
