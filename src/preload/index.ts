import { contextBridge, ipcRenderer } from 'electron';
import type {
  Instance,
  Account,
  LauncherSettings,
  JavaInstallation,
  Mod,
  ResourcePack,
  ShaderPack,
  WorldSave,
  MinecraftVersion,
  MarketplaceProject,
  MarketplaceVersion,
  LaunchProgress,
  LogEntry,
  CrashReportAnalysis,
  ModLoader,
  UpdateStatus,
  GalaxyCosmetics,
  InstanceShareData
} from './types';

const galaxyApi = {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),

  // Instances
  listInstances: (): Promise<Instance[]> => ipcRenderer.invoke('instances:list'),
  getInstance: (id: string): Promise<Instance | null> => ipcRenderer.invoke('instances:get', id),
  createInstance: (options: {
    name: string;
    version: string;
    loader: ModLoader;
    loaderVersion?: string;
    icon?: string;
    iconBackground?: string;
    banner?: string;
    memoryMin?: number;
    memoryMax?: number;
    jvmArgs?: string;
    javaPath?: string;
  }): Promise<Instance> => ipcRenderer.invoke('instances:create', options),
  updateInstance: (inst: Instance): Promise<Instance> => ipcRenderer.invoke('instances:update', inst),
  deleteInstance: (id: string): Promise<boolean> => ipcRenderer.invoke('instances:delete', id),
  cloneInstance: (id: string, optionsOrName: string | import('./types').CloneInstanceOptions): Promise<Instance | null> => ipcRenderer.invoke('instances:clone', id, optionsOrName),
  toggleInstanceFavorite: (id: string): Promise<boolean> => ipcRenderer.invoke('instances:toggleFavorite', id),
  getMods: (id: string): Promise<Mod[]> => ipcRenderer.invoke('instances:getMods', id),
  importFiles: (id: string, subDir: string, filePaths: string[]): Promise<number> => ipcRenderer.invoke('instances:importFiles', id, subDir, filePaths),

  toggleMod: (id: string, filename: string, enabled: boolean): Promise<boolean> => ipcRenderer.invoke('instances:toggleMod', id, filename, enabled),
  deleteMod: (id: string, filename: string): Promise<boolean> => ipcRenderer.invoke('instances:deleteMod', id, filename),
  getResourcePacks: (id: string): Promise<ResourcePack[]> => ipcRenderer.invoke('instances:getResourcePacks', id),
  toggleResourcePack: (id: string, filename: string, enabled: boolean): Promise<boolean> => ipcRenderer.invoke('instances:toggleResourcePack', id, filename, enabled),
  deleteResourcePack: (id: string, filename: string): Promise<boolean> => ipcRenderer.invoke('instances:deleteResourcePack', id, filename),
  getShaderPacks: (id: string): Promise<ShaderPack[]> => ipcRenderer.invoke('instances:getShaderPacks', id),
  toggleShaderPack: (id: string, filename: string, enabled: boolean): Promise<boolean> => ipcRenderer.invoke('instances:toggleShaderPack', id, filename, enabled),
  deleteShaderPack: (id: string, filename: string): Promise<boolean> => ipcRenderer.invoke('instances:deleteShaderPack', id, filename),
  openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke('shell:openExternal', url),
  getWorldSaves: (id: string): Promise<WorldSave[]> => ipcRenderer.invoke('instances:getWorldSaves', id),
  openInstanceFolder: (id: string, subDir?: string): Promise<void> => ipcRenderer.invoke('instances:openFolder', id, subDir),
  createWorldBackup: (id: string, worldFolderName: string): Promise<any> => ipcRenderer.invoke('instances:createWorldBackup', id, worldFolderName),
  listWorldBackups: (id: string): Promise<any[]> => ipcRenderer.invoke('instances:listWorldBackups', id),
  restoreWorldBackup: (id: string, backupFilename: string): Promise<boolean> => ipcRenderer.invoke('instances:restoreWorldBackup', id, backupFilename),
  deleteWorldBackup: (id: string, backupFilename: string): Promise<boolean> => ipcRenderer.invoke('instances:deleteWorldBackup', id, backupFilename),
  importLocalModpack: (filePath: string, customName?: string): Promise<Instance> => ipcRenderer.invoke('instances:importLocalModpack', filePath, customName),
  generateShareCode: (id: string): Promise<InstanceShareData> => ipcRenderer.invoke('instances:generateShareCode', id),
  importFromShareCode: (codeOrPayload: string, customName?: string): Promise<Instance> => ipcRenderer.invoke('instances:importFromShareCode', codeOrPayload, customName),

  // Versions
  getMojangVersions: (): Promise<MinecraftVersion[]> => ipcRenderer.invoke('versions:getMojang'),
  getFabricVersions: (gameVersion: string): Promise<string[]> => ipcRenderer.invoke('versions:getFabric', gameVersion),
  getQuiltVersions: (gameVersion: string): Promise<string[]> => ipcRenderer.invoke('versions:getQuilt', gameVersion),

  // Accounts
  getAccounts: (): Promise<Account[]> => ipcRenderer.invoke('accounts:list'),
  getActiveAccount: (): Promise<Account | null> => ipcRenderer.invoke('accounts:getActive'),
  setActiveAccount: (id: string): Promise<Account | null> => ipcRenderer.invoke('accounts:setActive', id),
  createOfflineAccount: (username: string, skinUrl?: string, modelType?: 'classic' | 'slim'): Promise<Account> => {
    return ipcRenderer.invoke('accounts:createOffline', username, skinUrl, modelType);
  },
  addMicrosoftAccount: (data: Omit<Account, 'id' | 'isActive'>): Promise<Account> => ipcRenderer.invoke('accounts:addMicrosoft', data),
  verifyOfficialMinecraftAccount: (usernameOrGamertag: string) => ipcRenderer.invoke('accounts:verifyOfficial', usernameOrGamertag),
  removeAccount: (id: string): Promise<boolean> => ipcRenderer.invoke('accounts:remove', id),
  updateAccountSkin: (id: string, skinUrl: string, modelType?: 'classic' | 'slim'): Promise<Account | null> => {
    return ipcRenderer.invoke('accounts:updateSkin', id, skinUrl, modelType);
  },
  updateAccountCosmetics: (id: string, cosmetics: GalaxyCosmetics): Promise<Account | null> => {
    return ipcRenderer.invoke('accounts:updateCosmetics', id, cosmetics);
  },

  // Java
  detectAllJava: (): Promise<JavaInstallation[]> => ipcRenderer.invoke('java:detectAll'),
  probeJava: (javaPath: string): Promise<JavaInstallation | null> => ipcRenderer.invoke('java:probe', javaPath),
  downloadJava: (majorVersion?: number): Promise<JavaInstallation> => ipcRenderer.invoke('java:download', majorVersion),
  checkJavaSetup: (): Promise<{ hasJava: boolean; javaCount: number; instancesCount: number }> => ipcRenderer.invoke('java:checkSetup'),
  onJavaDownloadProgress: (callback: (data: { percent: number; step: string; downloadedBytes?: number; totalBytes?: number }) => void): (() => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('java:downloadProgress', handler);
    return () => {
      ipcRenderer.removeListener('java:downloadProgress', handler);
    };
  },

  // Game execution
  launchInstance: (id: string): Promise<void> => ipcRenderer.invoke('game:launch', id),
  killInstance: (id: string): Promise<boolean> => ipcRenderer.invoke('game:kill', id),
  isInstanceRunning: (id: string): Promise<boolean> => ipcRenderer.invoke('game:isRunning', id),
  analyzeCrash: (logs: LogEntry[]): Promise<CrashReportAnalysis> => ipcRenderer.invoke('game:analyzeCrash', logs),

  // Marketplace
  searchMarketplace: (params: {
    query?: string;
    projectType?: 'mod' | 'modpack' | 'resourcepack' | 'shader';
    gameVersion?: string;
    loader?: string;
    category?: string;
    sortBy?: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';
    limit?: number;
    offset?: number;
  }): Promise<{ projects: MarketplaceProject[]; totalHits: number }> => {
    return ipcRenderer.invoke('marketplace:search', params);
  },
  getMarketplaceProject: (idOrSlug: string): Promise<MarketplaceProject | null> => {
    return ipcRenderer.invoke('marketplace:getProject', idOrSlug);
  },
  getMarketplaceVersions: (idOrSlug: string, loaders?: string[], gameVersions?: string[]): Promise<MarketplaceVersion[]> => {
    return ipcRenderer.invoke('marketplace:getVersions', idOrSlug, loaders, gameVersions);
  },
  getMarketplaceVersionById: (versionId: string): Promise<MarketplaceVersion | null> => {
    return ipcRenderer.invoke('marketplace:getVersionById', versionId);
  },
  installMarketplaceItem: (
    instanceId: string,
    projectType: 'mod' | 'resourcepack' | 'shader',
    downloadUrl: string,
    filename: string,
    sha1?: string
  ): Promise<string> => {
    return ipcRenderer.invoke('marketplace:installItem', instanceId, projectType, downloadUrl, filename, sha1);
  },
  installMarketplaceModWithDependencies: (
    instanceId: string,
    downloadUrl: string,
    filename: string,
    sha1?: string,
    dependencies?: any[],
    loader?: string,
    gameVersion?: string
  ): Promise<{ installedFiles: string[]; dependencyNames: string[] }> => {
    return ipcRenderer.invoke('marketplace:installWithDependencies', instanceId, downloadUrl, filename, sha1, dependencies, loader, gameVersion);
  },
  installModpack: (mrpackUrl: string, modpackName: string): Promise<string> => {
    return ipcRenderer.invoke('marketplace:installModpack', mrpackUrl, modpackName);
  },

  // Settings & System Specs
  getSettings: (): Promise<LauncherSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: LauncherSettings): Promise<void> => ipcRenderer.invoke('settings:save', settings),
  getSystemSpecs: (): Promise<import('./types').SystemSpecs> => ipcRenderer.invoke('system:getSpecs'),

  // Filesystem & Dialogs
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('fs:selectDirectory'),
  selectFile: (filters?: { name: string; extensions: string[] }[]): Promise<string | null> => {
    return ipcRenderer.invoke('fs:selectFile', filters);
  },
  selectMultipleFiles: (filters?: { name: string; extensions: string[] }[]): Promise<string[]> => {
    return ipcRenderer.invoke('fs:selectMultipleFiles', filters);
  },
  openLauncherDir: (): Promise<void> => ipcRenderer.invoke('fs:openLauncherDir'),
  wipeAllData: (): Promise<boolean> => ipcRenderer.invoke('fs:wipeAllData'),

  // Updates
  checkForUpdates: (): Promise<UpdateStatus> => ipcRenderer.invoke('updates:check'),
  downloadUpdate: (): Promise<boolean> => ipcRenderer.invoke('updates:download'),
  quitAndInstallUpdate: (): Promise<void> => ipcRenderer.invoke('updates:install'),
  getUpdateStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke('updates:getStatus'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),

  // Achievements & Progression
  getAchievements: (): Promise<import('./types').Achievement[]> => ipcRenderer.invoke('achievements:list'),
  getAchievementStats: (): Promise<import('./types').AchievementStats> => ipcRenderer.invoke('achievements:getStats'),
  unlockAchievement: (id: string): Promise<boolean> => ipcRenderer.invoke('achievements:unlock', id),
  resetAchievements: (): Promise<boolean> => ipcRenderer.invoke('achievements:reset'),
  testSoundAchievement: (): Promise<number> => ipcRenderer.invoke('achievements:testSound'),
  themeChangedAchievement: (themeName: string): Promise<void> => ipcRenderer.invoke('achievements:themeChanged', themeName),

  // Screenshots Gallery
  getScreenshots: (): Promise<import('./types').ScreenshotItem[]> => ipcRenderer.invoke('screenshots:getAll'),
  getScreenshotsByInstance: (instanceId: string): Promise<import('./types').ScreenshotItem[]> => ipcRenderer.invoke('screenshots:getByInstance', instanceId),
  deleteScreenshot: (filePath: string): Promise<boolean> => ipcRenderer.invoke('screenshots:delete', filePath),
  openScreenshotFolder: (filePath?: string): Promise<void> => ipcRenderer.invoke('screenshots:openFolder', filePath),
  copyScreenshotToClipboard: (filePath: string): Promise<boolean> => ipcRenderer.invoke('screenshots:copyToClipboard', filePath),
  getScreenshotBase64: (filePath: string): Promise<string | null> => ipcRenderer.invoke('screenshots:getBase64', filePath),

  // System Tray
  toggleTray: (): Promise<void> => ipcRenderer.invoke('tray:toggle'),
  showFromTray: (): Promise<void> => ipcRenderer.invoke('tray:show'),
  hideToTray: (): Promise<void> => ipcRenderer.invoke('tray:hide'),

  // Galaxy Cloud & Cross-Device Sync
  getCloudSyncState: (): Promise<import('./types').CloudSyncState> => ipcRenderer.invoke('cloud:getState'),
  toggleCloudSync: (enabled: boolean): Promise<import('./types').CloudSyncState> => ipcRenderer.invoke('cloud:toggle', enabled),
  syncAllToCloud: (): Promise<import('./types').CloudSyncState> => ipcRenderer.invoke('cloud:syncAll'),
  backupInstanceToCloud: (instanceId: string): Promise<import('./types').CloudInstanceSnapshot | null> => {
    return ipcRenderer.invoke('cloud:backupInstance', instanceId);
  },
  restoreInstanceFromCloud: (cloudInstanceId: string): Promise<import('./types').Instance | null> => {
    return ipcRenderer.invoke('cloud:restoreInstance', cloudInstanceId);
  },
  deleteCloudInstance: (cloudInstanceId: string): Promise<boolean> => {
    return ipcRenderer.invoke('cloud:deleteInstance', cloudInstanceId);
  },

  // Galaxy Friends & Social Network
  getFriends: (): Promise<import('./types').GalaxyFriend[]> => ipcRenderer.invoke('friends:list'),
  addFriend: (usernameOrTag: string): Promise<import('./types').GalaxyFriend | null> => {
    return ipcRenderer.invoke('friends:add', usernameOrTag);
  },
  removeFriend: (friendId: string): Promise<boolean> => ipcRenderer.invoke('friends:remove', friendId),
  toggleFavoriteFriend: (friendId: string): Promise<boolean> => ipcRenderer.invoke('friends:toggleFavorite', friendId),
  getSocialProfile: (): Promise<import('./types').UserSocialProfile> => ipcRenderer.invoke('social:getProfile'),
  updateSocialProfile: (data: Partial<import('./types').UserSocialProfile>): Promise<import('./types').UserSocialProfile> => {
    return ipcRenderer.invoke('social:updateProfile', data);
  },
  getFriendRequests: (): Promise<import('./types').FriendRequest[]> => ipcRenderer.invoke('social:getRequests'),
  sendFriendRequest: (tag: string): Promise<import('./types').FriendRequest | null> => {
    return ipcRenderer.invoke('social:sendRequest', tag);
  },
  acceptFriendRequest: (id: string): Promise<import('./types').GalaxyFriend | null> => {
    return ipcRenderer.invoke('social:acceptRequest', id);
  },
  declineFriendRequest: (id: string): Promise<boolean> => ipcRenderer.invoke('social:declineRequest', id),
  getGameStats: (): Promise<import('./types').GlobalGameStats> => ipcRenderer.invoke('social:getStats'),

  // Event Listeners
  onQuickLaunch: (callback: (instanceId: string) => void): (() => void) => {
    const handler = (_: any, instanceId: string) => callback(instanceId);
    ipcRenderer.on('game:quick-launch', handler);
    return () => {
      ipcRenderer.removeListener('game:quick-launch', handler);
    };
  },
  onFriendsUpdated: (callback: (friends: import('./types').GalaxyFriend[]) => void): (() => void) => {
    const handler = (_: any, data: import('./types').GalaxyFriend[]) => callback(data);
    ipcRenderer.on('social:friends-updated', handler);
    return () => {
      ipcRenderer.removeListener('social:friends-updated', handler);
    };
  },
  onRequestsUpdated: (callback: (requests: import('./types').FriendRequest[]) => void): (() => void) => {
    const handler = (_: any, data: import('./types').FriendRequest[]) => callback(data);
    ipcRenderer.on('social:requests-updated', handler);
    return () => {
      ipcRenderer.removeListener('social:requests-updated', handler);
    };
  },
  onProfileUpdated: (callback: (profile: import('./types').UserSocialProfile) => void): (() => void) => {
    const handler = (_: any, data: import('./types').UserSocialProfile) => callback(data);
    ipcRenderer.on('social:profile-updated', handler);
    return () => {
      ipcRenderer.removeListener('social:profile-updated', handler);
    };
  },
  onAchievementUnlocked: (callback: (achievement: import('./types').Achievement) => void): (() => void) => {
    const handler = (_: any, data: import('./types').Achievement) => callback(data);
    ipcRenderer.on('achievement:unlocked', handler);
    return () => {
      ipcRenderer.removeListener('achievement:unlocked', handler);
    };
  },
  onAchievementStatsUpdated: (callback: (data: { achievements: import('./types').Achievement[]; stats: import('./types').AchievementStats }) => void): (() => void) => {
    const handler = (_: any, data: { achievements: import('./types').Achievement[]; stats: import('./types').AchievementStats }) => callback(data);
    ipcRenderer.on('achievement:stats-updated', handler);
    return () => {
      ipcRenderer.removeListener('achievement:stats-updated', handler);
    };
  },
  onCloudSyncUpdated: (callback: (state: import('./types').CloudSyncState) => void): (() => void) => {
    const handler = (_: any, data: import('./types').CloudSyncState) => callback(data);
    ipcRenderer.on('cloud:sync-updated', handler);
    return () => {
      ipcRenderer.removeListener('cloud:sync-updated', handler);
    };
  },
  onUpdateStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
    const handler = (_: any, data: UpdateStatus) => callback(data);
    ipcRenderer.on('update:status', handler);
    return () => {
      ipcRenderer.removeListener('update:status', handler);
    };
  },
  onLaunchProgress: (callback: (progress: LaunchProgress) => void): (() => void) => {
    const handler = (_: any, data: LaunchProgress) => callback(data);
    ipcRenderer.on('game:launch-progress', handler);
    return () => {
      ipcRenderer.removeListener('game:launch-progress', handler);
    };
  },
  onLog: (callback: (log: LogEntry) => void): (() => void) => {
    const handler = (_: any, data: LogEntry) => callback(data);
    ipcRenderer.on('game:log', handler);
    return () => {
      ipcRenderer.removeListener('game:log', handler);
    };
  },
  onDownloadProgress: (callback: (data: { filename: string; bytes: number; total: number }) => void): (() => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('marketplace:download-progress', handler);
    return () => {
      ipcRenderer.removeListener('marketplace:download-progress', handler);
    };
  },
  onModpackProgress: (callback: (data: { completed: number; total: number; item?: string }) => void): (() => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('marketplace:modpack-progress', handler);
    return () => {
      ipcRenderer.removeListener('marketplace:modpack-progress', handler);
    };
  },
  onGameCrashed: (callback: (data: { instanceId: string; instanceName: string; analysis: CrashReportAnalysis; code: number }) => void): (() => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('game:crashed', handler);
    return () => {
      ipcRenderer.removeListener('game:crashed', handler);
    };
  },
  onGameStopped: (callback: (data: { instanceId: string; code: number }) => void): (() => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('game:stopped', handler);
    return () => {
      ipcRenderer.removeListener('game:stopped', handler);
    };
  }
};

contextBridge.exposeInMainWorld('galaxy', galaxyApi);


