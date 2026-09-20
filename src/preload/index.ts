import { contextBridge, ipcRenderer } from 'electron';
import {
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
  UpdateStatus
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
    banner?: string;
    memoryMin?: number;
    memoryMax?: number;
    jvmArgs?: string;
    javaPath?: string;
  }): Promise<Instance> => ipcRenderer.invoke('instances:create', options),
  updateInstance: (inst: Instance): Promise<Instance> => ipcRenderer.invoke('instances:update', inst),
  deleteInstance: (id: string): Promise<boolean> => ipcRenderer.invoke('instances:delete', id),
  cloneInstance: (id: string, newName: string): Promise<Instance | null> => ipcRenderer.invoke('instances:clone', id, newName),
  getMods: (id: string): Promise<Mod[]> => ipcRenderer.invoke('instances:getMods', id),
  toggleMod: (id: string, filename: string, enabled: boolean): Promise<boolean> => ipcRenderer.invoke('instances:toggleMod', id, filename, enabled),
  deleteMod: (id: string, filename: string): Promise<boolean> => ipcRenderer.invoke('instances:deleteMod', id, filename),
  getResourcePacks: (id: string): Promise<ResourcePack[]> => ipcRenderer.invoke('instances:getResourcePacks', id),
  getShaderPacks: (id: string): Promise<ShaderPack[]> => ipcRenderer.invoke('instances:getShaderPacks', id),
  getWorldSaves: (id: string): Promise<WorldSave[]> => ipcRenderer.invoke('instances:getWorldSaves', id),
  openInstanceFolder: (id: string, subDir?: string): Promise<void> => ipcRenderer.invoke('instances:openFolder', id, subDir),

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
  removeAccount: (id: string): Promise<boolean> => ipcRenderer.invoke('accounts:remove', id),
  updateAccountSkin: (id: string, skinUrl: string, modelType?: 'classic' | 'slim'): Promise<Account | null> => {
    return ipcRenderer.invoke('accounts:updateSkin', id, skinUrl, modelType);
  },

  // Java
  detectAllJava: (): Promise<JavaInstallation[]> => ipcRenderer.invoke('java:detectAll'),
  probeJava: (javaPath: string): Promise<JavaInstallation | null> => ipcRenderer.invoke('java:probe', javaPath),

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
  installMarketplaceItem: (
    instanceId: string,
    projectType: 'mod' | 'resourcepack' | 'shader',
    downloadUrl: string,
    filename: string,
    sha1?: string
  ): Promise<string> => {
    return ipcRenderer.invoke('marketplace:installItem', instanceId, projectType, downloadUrl, filename, sha1);
  },
  installModpack: (mrpackUrl: string, modpackName: string): Promise<string> => {
    return ipcRenderer.invoke('marketplace:installModpack', mrpackUrl, modpackName);
  },

  // Settings
  getSettings: (): Promise<LauncherSettings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: LauncherSettings): Promise<void> => ipcRenderer.invoke('settings:save', settings),

  // Filesystem & Dialogs
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('fs:selectDirectory'),
  selectFile: (filters?: { name: string; extensions: string[] }[]): Promise<string | null> => {
    return ipcRenderer.invoke('fs:selectFile', filters);
  },
  openLauncherDir: (): Promise<void> => ipcRenderer.invoke('fs:openLauncherDir'),
  wipeAllData: (): Promise<boolean> => ipcRenderer.invoke('fs:wipeAllData'),

  // Updates
  checkForUpdates: (): Promise<UpdateStatus> => ipcRenderer.invoke('updates:check'),
  downloadUpdate: (): Promise<boolean> => ipcRenderer.invoke('updates:download'),
  quitAndInstallUpdate: (): Promise<void> => ipcRenderer.invoke('updates:install'),
  getUpdateStatus: (): Promise<UpdateStatus> => ipcRenderer.invoke('updates:getStatus'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),

  // Event Listeners
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
  }
};

contextBridge.exposeInMainWorld('galaxy', galaxyApi);

export type GalaxyAPI = typeof galaxyApi;
