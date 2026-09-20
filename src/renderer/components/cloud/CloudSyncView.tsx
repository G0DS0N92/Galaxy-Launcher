import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  HardDrive,
  Download,
  Trash2,
  Users,
  UserPlus,
  Star,
  Sparkles,
  Monitor,
  Laptop,
  CheckCircle2,
  Clock,
  Boxes,
  Zap,
  ShieldCheck,
  Copy,
  Gamepad2
} from 'lucide-react';
import { CloudSyncState, CloudInstanceSnapshot, GalaxyFriend, Instance } from '../../types';
import { sounds } from '../../services/soundEngine';

interface CloudSyncViewProps {
  onShowToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
  onInstanceRestored?: (instance: Instance) => void;
}

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({ onShowToast, onInstanceRestored }) => {
  const [cloudState, setCloudState] = useState<CloudSyncState | null>(null);
  const [friends, setFriends] = useState<GalaxyFriend[]>([]);
  const [friendInput, setFriendInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'cloud' | 'friends'>('cloud');

  const loadCloudData = async () => {
    try {
      if (window.galaxy) {
        const [state, friendsList] = await Promise.all([
          window.galaxy.getCloudSyncState(),
          window.galaxy.getFriends()
        ]);
        setCloudState(state || null);
        setFriends(friendsList || []);
      }
    } catch (err) {
      console.error('Failed to load cloud sync state:', err);
    }
  };

  useEffect(() => {
    loadCloudData();

    if (window.galaxy) {
      const unsub = window.galaxy.onCloudSyncUpdated((state) => {
        setCloudState(state);
      });
      return () => unsub();
    }
  }, []);

  const handleToggleCloud = async () => {
    if (!window.galaxy || !cloudState) return;
    try {
      sounds.playSwitch();
      const updated = await window.galaxy.toggleCloudSync(!cloudState.enabled);
      setCloudState(updated);
      onShowToast({
        type: updated.enabled ? 'success' : 'info',
        title: updated.enabled ? 'Galaxy Cloud Enabled' : 'Galaxy Cloud Disabled',
        message: updated.enabled
          ? 'Instances and configurations will now sync automatically.'
          : 'Local data remains stored safely on this machine.'
      });
    } catch (err) {
      console.error(err);
      onShowToast({ type: 'error', title: 'Failed to update Cloud Sync state' });
    }
  };

  const handleSyncAll = async () => {
    if (!window.galaxy) return;
    setIsSyncing(true);
    sounds.playSwitch();
    try {
      const updated = await window.galaxy.syncAllToCloud();
      setCloudState(updated);
      sounds.playSuccess();
      onShowToast({
        type: 'success',
        title: 'Cloud Sync Complete',
        message: `Synced ${updated.cloudInstances.length} instance(s) to Galaxy Cloud.`
      });
    } catch (err) {
      console.error(err);
      onShowToast({ type: 'error', title: 'Sync Failed', message: 'Could not sync instances to cloud.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreInstance = async (snapshot: CloudInstanceSnapshot) => {
    if (!window.galaxy) return;
    setRestoringId(snapshot.id);
    sounds.playClick();
    try {
      const restored = await window.galaxy.restoreInstanceFromCloud(snapshot.id);
      if (restored) {
        sounds.playSuccess();
        onShowToast({
          type: 'success',
          title: `Restored "${snapshot.name}"`,
          message: 'Instance restored and available in your Instances tab!'
        });
        if (onInstanceRestored) {
          onInstanceRestored(restored);
        }
      }
    } catch (err) {
      console.error(err);
      onShowToast({ type: 'error', title: 'Restore Failed', message: 'Could not restore instance from cloud.' });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string, name: string) => {
    if (!confirm(`Delete cloud backup for "${name}"? This will free space on your cloud storage.`)) return;
    if (!window.galaxy) return;
    try {
      sounds.playClick();
      await window.galaxy.deleteCloudInstance(snapshotId);
      await loadCloudData();
      onShowToast({
        type: 'info',
        title: 'Cloud Backup Removed',
        message: `Deleted "${name}" from Galaxy Cloud.`
      });
    } catch (err) {
      console.error(err);
      onShowToast({ type: 'error', title: 'Failed to remove cloud backup' });
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendInput.trim() || !window.galaxy) return;
    try {
      const newFriend = await window.galaxy.addFriend(friendInput.trim());
      if (newFriend) {
        sounds.playSuccess();
        setFriendInput('');
        const updated = await window.galaxy.getFriends();
        setFriends(updated);
        onShowToast({
          type: 'success',
          title: `Added "${newFriend.username}"`,
          message: `Friend ${newFriend.tag} connected to your Galaxy network.`
        });
      }
    } catch (err) {
      console.error(err);
      onShowToast({ type: 'error', title: 'Failed to add friend' });
    }
  };

  const handleToggleFavoriteFriend = async (friendId: string) => {
    if (!window.galaxy) return;
    sounds.playClick();
    await window.galaxy.toggleFavoriteFriend(friendId);
    const updated = await window.galaxy.getFriends();
    setFriends(updated);
  };

  const handleRemoveFriend = async (friend: GalaxyFriend) => {
    if (!confirm(`Remove ${friend.username} from your friends list?`)) return;
    if (!window.galaxy) return;
    sounds.playClick();
    await window.galaxy.removeFriend(friend.id);
    const updated = await window.galaxy.getFriends();
    setFriends(updated);
    onShowToast({ type: 'info', title: `Removed ${friend.username}` });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const usedBytes = cloudState?.storageUsedBytes || 0;
  const maxBytes = cloudState?.storageMaxBytes || 1024 * 1024 * 1024 * 5;
  const storagePercent = Math.min(100, Math.max(1, (usedBytes / maxBytes) * 100));

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 space-y-6 select-none custom-scrollbar">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl p-6 overflow-hidden border border-white/10 bg-gradient-to-r from-galaxy-950/90 via-indigo-950/40 to-slate-950/90 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-glow-sm">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-black text-white tracking-wide">
                    Galaxy Cloud & Network
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Cross-Device Sync
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Seamlessly back up instances, play across PCs, and connect with your Galaxy friends.
                </p>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => {
                  sounds.playSwitch();
                  setActiveSubTab('cloud');
                }}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSubTab === 'cloud'
                    ? 'bg-theme-accent text-white shadow-glow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud Sync & Backups</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/30">
                  {cloudState?.cloudInstances.length || 0}
                </span>
              </button>

              <button
                onClick={() => {
                  sounds.playSwitch();
                  setActiveSubTab('friends');
                }}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSubTab === 'friends'
                    ? 'bg-theme-accent text-white shadow-glow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Friends Network</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/30">
                  {friends.length}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Actions / Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Enable/Disable Toggle */}
            <button
              onClick={handleToggleCloud}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                cloudState?.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {cloudState?.enabled ? <CloudCheck className="w-4 h-4 text-emerald-400" /> : <CloudOff className="w-4 h-4" />}
              <span>{cloudState?.enabled ? 'Cloud Enabled' : 'Enable Cloud'}</span>
            </button>

            {/* Sync All Button */}
            <button
              onClick={handleSyncAll}
              disabled={isSyncing || !cloudState?.enabled}
              className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all btn-accent shadow-glow-sm ${
                isSyncing || !cloudState?.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-glow-md'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync All Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {activeSubTab === 'cloud' ? (
        <div className="space-y-6">
          {/* Storage & Device Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Storage Quota Card */}
            <div className="rounded-2xl p-4 border border-white/10 bg-black/30 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-slate-200">Cloud Storage</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  5.0 GB Quota
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-white font-bold">{formatBytes(usedBytes)}</span>
                  <span className="text-slate-400 text-[11px]">of {formatBytes(maxBytes)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/50 border border-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                <span>Free Cosmic Cloud Tier</span>
                <span className="text-emerald-400 font-mono">{(100 - storagePercent).toFixed(1)}% Free</span>
              </div>
            </div>

            {/* Current Device Identifier */}
            <div className="rounded-2xl p-4 border border-white/10 bg-black/30 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-slate-200">Active Device</span>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                  CURRENT RIG
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white truncate">
                  {cloudState?.deviceName || 'Galaxy Desktop Rig'}
                </h3>
                <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                  ID: {cloudState?.deviceId || 'device-primary'}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>End-to-end synced & cached locally</span>
              </div>
            </div>

            {/* Sync Timestamp & State */}
            <div className="rounded-2xl p-4 border border-white/10 bg-black/30 backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-200">Sync Status</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ONLINE
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-white">
                  {cloudState?.lastSyncedAt
                    ? new Date(cloudState.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Not synced yet'}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {cloudState?.lastSyncedAt
                    ? `Last synced on ${new Date(cloudState.lastSyncedAt).toLocaleDateString()}`
                    : 'Press Sync All Now to backup instances.'}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                <span>Auto-sync interval</span>
                <span className="text-purple-300 font-mono">Continuous</span>
              </div>
            </div>
          </div>

          {/* Cloud Backups List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Cloud Instances</h2>
                <p className="text-xs text-slate-400">
                  Instances available in your Galaxy Cloud. Restore them on this machine in one click.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {cloudState?.cloudInstances.length || 0} Snapshot(s)
              </span>
            </div>

            {(!cloudState?.cloudInstances || cloudState.cloudInstances.length === 0) ? (
              <div className="text-center py-16 space-y-3 bg-black/20 rounded-3xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                  <Cloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-300">No Cloud Backups Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Enable Galaxy Cloud and click &quot;Sync All Now&quot; to back up your Minecraft instances to the cloud.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cloudState.cloudInstances.map((snap) => (
                  <div
                    key={snap.id}
                    className="rounded-2xl p-4 border border-white/10 bg-black/30 hover:border-white/20 backdrop-blur-xl transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                          <Boxes className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-theme-accent transition-colors">
                            {snap.name}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                            <span className="capitalize font-medium text-slate-300">{snap.loader}</span>
                            <span>•</span>
                            <span>{snap.version}</span>
                            <span>•</span>
                            <span>{formatBytes(snap.sizeBytes)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleRestoreInstance(snap)}
                          disabled={restoringId === snap.id}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-theme-accent/20 hover:bg-theme-accent/30 text-theme-accent border border-theme-accent/40 text-xs font-bold transition-all shadow-glow-sm"
                          title="Restore to this computer"
                        >
                          <Download className={`w-3.5 h-3.5 ${restoringId === snap.id ? 'animate-bounce' : ''}`} />
                          <span>{restoringId === snap.id ? 'Restoring...' : 'Restore'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id, snap.name)}
                          className="p-1.5 rounded-xl bg-white/[0.04] text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-white/10 transition-colors"
                          title="Delete from cloud"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-slate-300">
                        {snap.modsCount} Mods
                      </span>
                      {snap.shadersList && snap.shadersList.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-slate-300">
                          {snap.shadersList.length} Shaders
                        </span>
                      )}
                      {snap.playTimeMinutes > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-slate-300">
                          {Math.floor(snap.playTimeMinutes / 60)}h {snap.playTimeMinutes % 60}m played
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-1">
                        <Laptop className="w-2.5 h-2.5" />
                        Galaxy Cloud
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Galaxy Friends Network Tab */
        <div className="space-y-6">
          {/* Add Friend Form */}
          <div className="rounded-2xl p-4 border border-white/10 bg-black/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-theme-accent" />
                Add Galaxy Friend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect with players using their username or Galaxy Tag (e.g. Player#1234).
              </p>
            </div>

            <form onSubmit={handleAddFriend} className="flex items-center space-x-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Username#1234"
                value={friendInput}
                onChange={(e) => setFriendInput(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-theme-accent w-64 transition-all"
              />
              <button
                type="submit"
                disabled={!friendInput.trim()}
                className="px-4 py-2 rounded-xl btn-accent text-xs font-bold shadow-glow-sm hover:shadow-glow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Friends List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Your Friends</h3>
              <span className="text-xs text-slate-400">{friends.length} Friends</span>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-16 space-y-3 bg-black/20 rounded-3xl border border-white/5">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-slate-500">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-300">No Friends Added Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Type a friend&apos;s tag above to connect and see what servers they are playing on.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="rounded-2xl p-3.5 border border-white/10 bg-black/30 hover:border-white/20 backdrop-blur-xl transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Avatar with status bubble */}
                      <div className="relative flex-shrink-0">
                        {friend.avatarUrl ? (
                          <img
                            src={friend.avatarUrl}
                            alt={friend.username}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                            friend.status === 'in-game'
                              ? 'bg-emerald-400 animate-pulse'
                              : friend.status === 'online'
                              ? 'bg-cyan-400'
                              : 'bg-slate-500'
                          }`}
                        />
                      </div>

                      {/* Name & Activity */}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs font-bold text-white truncate">
                            {friend.username}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            #{friend.tag.split('#')[1] || '0000'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          {friend.status === 'in-game' ? (
                            <>
                              <Gamepad2 className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">{friend.activity || 'Playing Minecraft'}</span>
                            </>
                          ) : friend.status === 'online' ? (
                            <span className="text-cyan-300">Online in Launcher</span>
                          ) : (
                            <span className="text-slate-500">Offline</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleToggleFavoriteFriend(friend.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          friend.isFavorite
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'
                        }`}
                        title={friend.isFavorite ? 'Unfavorite' : 'Favorite'}
                      >
                        <Star className={`w-3.5 h-3.5 ${friend.isFavorite ? 'fill-amber-400' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(friend.tag);
                          onShowToast({ type: 'info', title: 'Copied Tag', message: friend.tag });
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                        title="Copy Tag"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(friend)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
