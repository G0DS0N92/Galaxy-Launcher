import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { BrowserWindow } from 'electron';
import {
  CloudSyncState,
  CloudInstanceSnapshot,
  GalaxyFriend,
  Instance,
  FriendRequest,
  UserSocialProfile,
  GlobalGameStats
} from '../preload/types';
import { InstanceManager } from './instanceManager';
import { AchievementsManager } from './achievementsManager';

export class CloudService {
  private baseDir: string;
  private cloudFile: string;
  private friendsFile: string;
  private requestsFile: string;
  private profileFile: string;
  private state: CloudSyncState;
  private friends: GalaxyFriend[] = [];
  private friendRequests: FriendRequest[] = [];
  private userProfile: UserSocialProfile;
  private mainWindow: BrowserWindow | null = null;
  private instanceManager: InstanceManager;

  constructor(baseDir: string, instanceManager: InstanceManager) {
    this.baseDir = baseDir;
    this.instanceManager = instanceManager;
    this.cloudFile = path.join(baseDir, 'cloud_sync.json');
    this.friendsFile = path.join(baseDir, 'friends.json');
    this.requestsFile = path.join(baseDir, 'friend_requests.json');
    this.profileFile = path.join(baseDir, 'user_profile.json');

    const deviceId = crypto.createHash('sha256').update(os.hostname() + os.userInfo().username).digest('hex').substring(0, 12);
    const deviceName = `${os.hostname()} (${os.platform() === 'win32' ? 'Windows' : os.platform()})`;

    this.state = {
      enabled: false,
      autoSync: true,
      lastSyncedAt: undefined,
      cloudInstances: [],
      storageUsedBytes: 0,
      storageMaxBytes: 5 * 1024 * 1024 * 1024, // 5 GB Free Cloud Quota
      deviceId,
      deviceName,
      syncStatus: 'offline'
    };

    this.userProfile = {
      username: 'GalaxyVoyager',
      tag: `#${Math.floor(1000 + Math.random() * 9000)}`,
      avatarUrl: `https://minotar.net/helm/GalaxyVoyager/128`,
      status: 'online',
      statusMessage: 'Ready to conquer Minecraft worlds 🚀',
      joinedAt: new Date().toISOString()
    };

    this.loadState();
    this.loadFriends();
    this.loadRequests();
    this.loadProfile();
  }


  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.cloudFile)) {
        const data = JSON.parse(fs.readFileSync(this.cloudFile, 'utf-8'));
        this.state = {
          ...this.state,
          ...data,
          syncStatus: data.enabled ? 'synced' : 'offline'
        };
      }
    } catch (err) {
      console.error('[CloudService] Failed to load cloud state:', err);
    }
  }

  private saveState(): void {
    try {
      fs.writeFileSync(this.cloudFile, JSON.stringify(this.state, null, 2), 'utf-8');
      this.broadcastSync();
    } catch (err) {
      console.error('[CloudService] Failed to save cloud state:', err);
    }
  }

  private loadFriends(): void {
    try {
      if (fs.existsSync(this.friendsFile)) {
        const raw = JSON.parse(fs.readFileSync(this.friendsFile, 'utf-8'));
        // Purge any legacy sample dummy friends
        this.friends = Array.isArray(raw)
          ? raw.filter(
              (f: GalaxyFriend) =>
                f &&
                f.id !== 'friend-1' &&
                f.id !== 'friend-2' &&
                f.id !== 'friend-3' &&
                f.username !== 'AstroNova' &&
                f.username !== 'CosmicVoyager' &&
                f.username !== 'SolarFlare'
            )
          : [];
      } else {
        this.friends = [];
      }
      this.saveFriends();
    } catch (err) {
      console.error('[CloudService] Failed to load friends:', err);
      this.friends = [];
    }
  }

  private saveFriends(): void {
    try {
      fs.writeFileSync(this.friendsFile, JSON.stringify(this.friends, null, 2), 'utf-8');
    } catch (err) {
      console.error('[CloudService] Failed to save friends:', err);
    }
  }

  private broadcastSync(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('cloud:sync-updated', this.state);
    }
  }

  public getState(): CloudSyncState {
    return { ...this.state };
  }

  public toggleCloud(enabled: boolean): CloudSyncState {
    this.state.enabled = enabled;
    this.state.syncStatus = enabled ? 'synced' : 'offline';
    if (enabled && !this.state.lastSyncedAt) {
      this.state.lastSyncedAt = new Date().toISOString();
    }
    this.saveState();
    return this.getState();
  }

  public async syncAll(): Promise<CloudSyncState> {
    if (!this.state.enabled) {
      this.state.enabled = true;
    }
    this.state.syncStatus = 'syncing';
    this.broadcastSync();

    try {
      const localInstances = await this.instanceManager.listInstances();
      const updatedSnapshots: CloudInstanceSnapshot[] = [];
      let totalBytes = 0;

      for (const inst of localInstances) {
        const mods = await this.instanceManager.getMods(inst.id);
        const shaders = await this.instanceManager.getShaderPacks(inst.id);
        const resourcePacks = await this.instanceManager.getResourcePacks(inst.id);

        const instBytes = mods.reduce((sum, m) => sum + (m.sizeBytes || 0), 0) + 1024 * 1024 * 2;
        totalBytes += instBytes;

        updatedSnapshots.push({
          id: inst.id,
          name: inst.name,
          version: inst.version,
          loader: inst.loader,
          loaderVersion: inst.loaderVersion,
          icon: inst.icon,
          iconBackground: inst.iconBackground,
          banner: inst.banner,
          memoryMin: inst.memoryMin,
          memoryMax: inst.memoryMax,
          jvmArgs: inst.jvmArgs,
          modsCount: mods.length,
          modsList: mods.map(m => ({ filename: m.filename, name: m.name, version: m.version })),
          shadersList: shaders.map(s => s.name),
          resourcePacksList: resourcePacks.map(r => r.name),
          lastBackedUpAt: new Date().toISOString(),
          playTimeMinutes: inst.playTimeMinutes || 0,
          sizeBytes: instBytes
        });
      }

      this.state.cloudInstances = updatedSnapshots;
      this.state.storageUsedBytes = totalBytes;
      this.state.lastSyncedAt = new Date().toISOString();
      this.state.syncStatus = 'synced';
      this.state.errorMessage = undefined;
    } catch (err: any) {
      this.state.syncStatus = 'error';
      this.state.errorMessage = err.message;
    }

    this.saveState();
    return this.getState();
  }

  public async backupInstance(instanceId: string): Promise<CloudInstanceSnapshot | null> {
    const inst = await this.instanceManager.getInstance(instanceId);
    if (!inst) return null;

    const mods = await this.instanceManager.getMods(inst.id);
    const shaders = await this.instanceManager.getShaderPacks(inst.id);
    const resourcePacks = await this.instanceManager.getResourcePacks(inst.id);

    const instBytes = mods.reduce((sum, m) => sum + (m.sizeBytes || 0), 0) + 1024 * 1024 * 2;

    const snapshot: CloudInstanceSnapshot = {
      id: inst.id,
      name: inst.name,
      version: inst.version,
      loader: inst.loader,
      loaderVersion: inst.loaderVersion,
      icon: inst.icon,
      iconBackground: inst.iconBackground,
      banner: inst.banner,
      memoryMin: inst.memoryMin,
      memoryMax: inst.memoryMax,
      jvmArgs: inst.jvmArgs,
      modsCount: mods.length,
      modsList: mods.map(m => ({ filename: m.filename, name: m.name, version: m.version })),
      shadersList: shaders.map(s => s.name),
      resourcePacksList: resourcePacks.map(r => r.name),
      lastBackedUpAt: new Date().toISOString(),
      playTimeMinutes: inst.playTimeMinutes || 0,
      sizeBytes: instBytes
    };

    // Upsert snapshot in cloudInstances
    const idx = this.state.cloudInstances.findIndex(c => c.id === inst.id);
    if (idx >= 0) {
      this.state.cloudInstances[idx] = snapshot;
    } else {
      this.state.cloudInstances.push(snapshot);
    }

    this.state.storageUsedBytes = this.state.cloudInstances.reduce((sum, c) => sum + c.sizeBytes, 0);
    this.state.lastSyncedAt = new Date().toISOString();
    this.state.syncStatus = 'synced';
    this.saveState();

    return snapshot;
  }

  public async restoreInstance(cloudInstanceId: string): Promise<Instance | null> {
    const snapshot = this.state.cloudInstances.find(c => c.id === cloudInstanceId);
    if (!snapshot) return null;

    // Check if local instance already exists
    let existing = await this.instanceManager.getInstance(snapshot.id);
    if (existing) {
      // Update metadata
      existing.name = snapshot.name;
      existing.version = snapshot.version;
      existing.loader = snapshot.loader;
      existing.loaderVersion = snapshot.loaderVersion;
      existing.icon = snapshot.icon;
      existing.iconBackground = snapshot.iconBackground;
      existing.memoryMin = snapshot.memoryMin;
      existing.memoryMax = snapshot.memoryMax;
      existing.jvmArgs = snapshot.jvmArgs;
      await this.instanceManager.updateInstance(existing);
      return existing;
    }

    // Create new local instance from cloud snapshot
    const newInst = await this.instanceManager.createInstance({
      name: snapshot.name,
      version: snapshot.version,
      loader: snapshot.loader,
      loaderVersion: snapshot.loaderVersion,
      icon: snapshot.icon,
      iconBackground: snapshot.iconBackground,
      banner: snapshot.banner,
      memoryMin: snapshot.memoryMin,
      memoryMax: snapshot.memoryMax,
      jvmArgs: snapshot.jvmArgs
    });

    return newInst;
  }

  public deleteCloudInstance(cloudInstanceId: string): boolean {
    const initialLen = this.state.cloudInstances.length;
    this.state.cloudInstances = this.state.cloudInstances.filter(c => c.id !== cloudInstanceId);
    if (this.state.cloudInstances.length !== initialLen) {
      this.state.storageUsedBytes = this.state.cloudInstances.reduce((sum, c) => sum + c.sizeBytes, 0);
      this.saveState();
      return true;
    }
    return false;
  }

  private loadRequests(): void {
    try {
      if (fs.existsSync(this.requestsFile)) {
        const raw = JSON.parse(fs.readFileSync(this.requestsFile, 'utf-8'));
        this.friendRequests = Array.isArray(raw) ? raw : [];
      } else {
        this.friendRequests = [];
      }
    } catch (err) {
      console.error('[CloudService] Failed to load friend requests:', err);
      this.friendRequests = [];
    }
  }

  private saveRequests(): void {
    try {
      fs.writeFileSync(this.requestsFile, JSON.stringify(this.friendRequests, null, 2), 'utf-8');
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('social:requests-updated', this.friendRequests);
      }
    } catch (err) {
      console.error('[CloudService] Failed to save friend requests:', err);
    }
  }

  private loadProfile(): void {
    try {
      if (fs.existsSync(this.profileFile)) {
        const raw = JSON.parse(fs.readFileSync(this.profileFile, 'utf-8'));
        if (raw.username === 'Admin') {
          delete raw.username;
        }
        if (raw.avatarUrl && (raw.avatarUrl.includes('/avatar/Admin') || raw.avatarUrl.includes('/helm/Admin'))) {
          delete raw.avatarUrl;
        }
        this.userProfile = { ...this.userProfile, ...raw };
      }
    } catch (err) {
      console.error('[CloudService] Failed to load profile:', err);
    }
  }

  private saveProfile(): void {
    try {
      fs.writeFileSync(this.profileFile, JSON.stringify(this.userProfile, null, 2), 'utf-8');
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('social:profile-updated', this.userProfile);
      }
    } catch (err) {
      console.error('[CloudService] Failed to save profile:', err);
    }
  }

  // --- Friends API ---
  public getFriends(): GalaxyFriend[] {
    return [...this.friends];
  }

  public addFriend(usernameOrTag: string, optionalData?: Partial<GalaxyFriend>): GalaxyFriend | null {
    const trimmed = usernameOrTag.trim();
    if (!trimmed) return null;

    let username = trimmed;
    let tag = `#${Math.floor(1000 + Math.random() * 9000)}`;

    if (trimmed.includes('#')) {
      const parts = trimmed.split('#');
      username = parts[0];
      tag = `#${parts[1]}`;
    }

    const newFriend: GalaxyFriend = {
      id: `friend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username,
      tag,
      avatarUrl: `https://minotar.net/avatar/${encodeURIComponent(username)}/64`,
      status: optionalData?.status || 'online',
      activity: optionalData?.activity || 'Exploring Galaxy Launcher',
      gameVersion: optionalData?.gameVersion,
      serverAddress: optionalData?.serverAddress,
      serverName: optionalData?.serverName,
      instanceName: optionalData?.instanceName,
      statusMessage: optionalData?.statusMessage,
      lastSeen: new Date().toISOString(),
      ...optionalData
    };

    this.friends.push(newFriend);
    this.saveFriends();
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('social:friends-updated', this.friends);
    }
    return newFriend;
  }

  public removeFriend(friendId: string): boolean {
    const initialLen = this.friends.length;
    this.friends = this.friends.filter(f => f.id !== friendId);
    if (this.friends.length !== initialLen) {
      this.saveFriends();
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('social:friends-updated', this.friends);
      }
      return true;
    }
    return false;
  }

  public toggleFavoriteFriend(friendId: string): boolean {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      friend.isFavorite = !friend.isFavorite;
      this.saveFriends();
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('social:friends-updated', this.friends);
      }
      return true;
    }
    return false;
  }

  // --- Friend Requests API ---
  public getFriendRequests(): FriendRequest[] {
    return [...this.friendRequests];
  }

  public sendFriendRequest(targetTag: string): FriendRequest | null {
    const trimmed = targetTag.trim();
    if (!trimmed) return null;

    let senderUsername = trimmed;
    let senderTag = `#${Math.floor(1000 + Math.random() * 9000)}`;
    if (trimmed.includes('#')) {
      const parts = trimmed.split('#');
      senderUsername = parts[0];
      senderTag = `#${parts[1]}`;
    }

    const req: FriendRequest = {
      id: `req-${Date.now()}`,
      senderUsername,
      senderTag,
      avatarUrl: `https://minotar.net/avatar/${encodeURIComponent(senderUsername)}/64`,
      createdAt: new Date().toISOString(),
      type: 'outgoing'
    };

    this.friendRequests.push(req);
    this.saveRequests();
    return req;
  }

  public acceptFriendRequest(requestId: string): GalaxyFriend | null {
    const idx = this.friendRequests.findIndex(r => r.id === requestId);
    if (idx === -1) return null;

    const req = this.friendRequests[idx];
    this.friendRequests.splice(idx, 1);
    this.saveRequests();

    return this.addFriend(`${req.senderUsername}${req.senderTag}`);
  }

  public declineFriendRequest(requestId: string): boolean {
    const initialLen = this.friendRequests.length;
    this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
    if (this.friendRequests.length !== initialLen) {
      this.saveRequests();
      return true;
    }
    return false;
  }

  // --- Social Profile API ---
  public getUserProfile(): UserSocialProfile {
    return { ...this.userProfile };
  }

  public updateUserProfile(data: Partial<UserSocialProfile>): UserSocialProfile {
    this.userProfile = {
      ...this.userProfile,
      ...data
    };
    this.saveProfile();
    return this.getUserProfile();
  }

  // --- Live Player Activity Broadcasting ---
  public setPlayerActivity(
    status: 'online' | 'in-game' | 'offline',
    details?: {
      instanceName?: string;
      gameVersion?: string;
      serverAddress?: string;
      serverName?: string;
      statusMessage?: string;
    }
  ): void {
    this.userProfile.status = status;
    if (details?.statusMessage) {
      this.userProfile.statusMessage = details.statusMessage;
    }
    this.saveProfile();
  }

  // --- Game Statistics Calculation ---
  public async getGlobalStats(achievementsManager: AchievementsManager): Promise<GlobalGameStats> {
    const instances = await this.instanceManager.listInstances();
    const achStats = achievementsManager.getStats();

    let totalPlaytimeMinutes = 0;
    let totalLaunches = 0;
    let mostPlayedInstance: { id: string; name: string; playTimeMinutes: number } | undefined = undefined;

    const instanceStats = instances.map(inst => {
      const minutes = inst.playTimeMinutes || 0;
      const launches = inst.launchCount || 0;
      totalPlaytimeMinutes += minutes;
      totalLaunches += launches;

      if (!mostPlayedInstance || minutes > mostPlayedInstance.playTimeMinutes) {
        mostPlayedInstance = {
          id: inst.id,
          name: inst.name,
          playTimeMinutes: minutes
        };
      }

      return {
        id: inst.id,
        name: inst.name,
        version: inst.version,
        loader: inst.loader,
        icon: inst.icon,
        iconBackground: inst.iconBackground,
        playTimeMinutes: minutes,
        launchCount: launches,
        lastPlayed: inst.lastPlayed,
        isFavorite: inst.isFavorite
      };
    });

    const favoriteInst = instances.find(i => i.isFavorite) || instances[0];

    return {
      totalPlaytimeMinutes,
      totalPlaytimeHours: Math.round((totalPlaytimeMinutes / 60) * 10) / 10,
      totalLaunches,
      instancesCount: instances.length,
      unlockedAchievementsCount: achStats.totalUnlocked,
      totalXp: achStats.totalXp,
      galaxyLevel: achStats.level,
      favoriteInstanceName: favoriteInst?.name,
      instanceStats,
      mostPlayedInstance
    };
  }
}

