export type ModLoader = 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt';
export type JvmProfile = 'aikar' | 'zgc' | 'shenandoah' | 'vanilla';

export interface WorldBackup {
  id: string;
  filename: string;
  worldName: string;
  timestamp: string;
  sizeBytes: number;
}

export interface Instance {
  id: string;
  name: string;
  version: string;
  loader: ModLoader;
  loaderVersion?: string;
  icon?: string;
  iconBackground?: string;
  banner?: string;
  memoryMin: number; // in MB
  memoryMax: number; // in MB
  jvmArgs?: string;
  jvmProfile?: JvmProfile;
  javaPath?: string;
  lastPlayed?: string;
  playTimeMinutes: number;
  launchCount?: number;
  isFavorite?: boolean;
  resolution: {
    width: number;
    height: number;
    fullscreen: boolean;
  };
  isRunning?: boolean;
  isOptimized?: boolean;
  createdAt: string;
}


export interface MinecraftVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  time: string;
  releaseTime: string;
}

export interface ModLoaderVersion {
  version: string;
  stable: boolean;
}

export interface GalaxyCosmetics {
  equippedCape?: string;
  equippedWings?: string;
  equippedHalo?: string;
  capeAnimationSpeed?: number;
  wingsFlapSpeed?: number;
  haloRotationSpeed?: number;
}

export interface CloneInstanceOptions {
  name: string;
  copyMods?: boolean;
  copyConfigurations?: boolean;
  copyResourcePacks?: boolean;
  copyShaderPacks?: boolean;
  copyWorlds?: boolean;
  copyScreenshots?: boolean;
  copyStatistics?: boolean;
}

export interface InstanceShareData {
  code: string;
  shareString: string;
  instanceName: string;
  version: string;
  loader: ModLoader;
  modsCount: number;
  payload: any;
}

export interface Account {
  id: string;
  username: string;
  uuid: string;
  type: 'cracked' | 'microsoft';
  skinUrl?: string;
  capeUrl?: string;
  cosmetics?: GalaxyCosmetics;
  accessToken?: string;
  isActive: boolean;
  modelType?: 'classic' | 'slim';
}

export interface Mod {
  filename: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
  enabled: boolean;
  authors?: string[];
  id?: string;
  path: string;
  sizeBytes: number;
  url?: string;
}

export interface ResourcePack {
  filename: string;
  name: string;
  version?: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  authors?: string[];
  id?: string;
  path: string;
  sizeBytes?: number;
  url?: string;
}

export interface ShaderPack {
  filename: string;
  name: string;
  version?: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  authors?: string[];
  id?: string;
  path: string;
  sizeBytes?: number;
  url?: string;
}

export interface WorldSave {
  folderName: string;
  name: string;
  lastPlayed: number;
  sizeBytes: number;
  icon?: string;
  gameMode?: string;
}

export interface MarketplaceProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  clientSide: string;
  serverSide: string;
  body?: string;
  iconUrl?: string;
  downloads: number;
  follows: number;
  dateUpdated: string;
  author: string;
  projectType: 'mod' | 'modpack' | 'resourcepack' | 'shader';
  versions?: MarketplaceVersion[];
  gallery?: string[];
}

export interface MarketplaceDependency {
  version_id?: string | null;
  project_id?: string | null;
  file_name?: string | null;
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded';
}

export interface MarketplaceVersion {
  id: string;
  versionNumber: string;
  name: string;
  gameVersions: string[];
  loaders: string[];
  files: {
    url: string;
    filename: string;
    primary: boolean;
    size: number;
    hashes: {
      sha1?: string;
      sha512?: string;
    };
  }[];
  dependencies?: MarketplaceDependency[];
  datePublished: string;
  versionType?: 'release' | 'beta' | 'alpha' | string;
}

export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadProgress?: number;
  bytesPerSecond?: number;
  errorMessage?: string;
}

export interface ScreenshotItem {
  id: string;
  filename: string;
  filePath: string;
  instanceId: string;
  instanceName: string;
  createdAt: string;
  sizeBytes: number;
  previewUrl: string;
}

export interface LauncherSettings {
  theme: 'deep-void' | 'nebula-purple' | 'supernova-cyan' | 'solar-gold' | 'emerald-aurora' | 'crimson-quasar';
  backgroundAnimation: boolean;
  soundEffects: boolean;
  soundVolume: number;
  closeOnLaunch: boolean;
  discordRpc: boolean;
  defaultJavaPath: string;
  defaultRamMin: number;
  defaultRamMax: number;
  defaultResolutionWidth?: number;
  defaultResolutionHeight?: number;
  defaultFullscreen?: boolean;
  instancesDirectory: string;
  firstTimeSetupCompleted?: boolean;
  autoCheckUpdates?: boolean;
  updateChannel?: 'stable' | 'beta';
  enableAchievementPopups?: boolean;
  minimizeToTray?: boolean;
  closeToTray?: boolean;
  startupAnimation?: boolean;
}

export interface JavaInstallation {
  path: string;
  version: string;
  majorVersion: number;
  vendor: string;
  arch: string;
  isDefault: boolean;
  isValid: boolean;
}

export interface LaunchProgress {
  instanceId: string;
  step: string;
  progress: number;
  total: number;
  details?: string;
}

export interface LogEntry {
  id: string;
  instanceId: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  source?: string;
}

export interface CrashReportAnalysis {
  isCrash: boolean;
  title: string;
  explanation: string;
  suggestion: string;
  codeSnippet?: string;
  relevantMod?: string;
}

// --- Achievements & Progression ---
export type AchievementCategory = 'general' | 'exploration' | 'instance' | 'playtime' | 'modding' | 'cloud' | 'social' | 'mastery' | 'secret';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'cosmic';

export interface AchievementProgress {
  current: number;
  max: number;
  unit?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xp: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: AchievementProgress;
  secret?: boolean;
}

export interface AchievementStats {
  totalUnlocked: number;
  totalAchievements: number;
  totalXp: number;
  level: number;
  levelProgress: number; // 0 - 100
  totalPlaytimeHours: number;
}

// --- Galaxy Cloud & Cross-Device Sync ---
export interface CloudInstanceSnapshot {
  id: string;
  name: string;
  version: string;
  loader: ModLoader;
  loaderVersion?: string;
  icon?: string;
  iconBackground?: string;
  banner?: string;
  memoryMin: number;
  memoryMax: number;
  jvmArgs?: string;
  modsCount: number;
  modsList: { filename: string; name: string; version?: string }[];
  shadersList: string[];
  resourcePacksList: string[];
  lastBackedUpAt: string;
  playTimeMinutes: number;
  sizeBytes: number;
}

export interface CloudSyncState {
  enabled: boolean;
  autoSync: boolean;
  lastSyncedAt?: string;
  cloudInstances: CloudInstanceSnapshot[];
  storageUsedBytes: number;
  storageMaxBytes: number;
  deviceId: string;
  deviceName: string;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  errorMessage?: string;
}

// --- Galaxy Friends & Social Network ---
export interface GalaxyFriend {
  id: string;
  username: string;
  tag: string;
  avatarUrl?: string;
  status: 'online' | 'in-game' | 'offline';
  activity?: string;
  gameVersion?: string;
  serverAddress?: string;
  serverName?: string;
  instanceName?: string;
  lastSeen: string;
  isFavorite?: boolean;
  statusMessage?: string;
  isBlocked?: boolean;
}

export interface FriendRequest {
  id: string;
  senderUsername: string;
  senderTag: string;
  avatarUrl?: string;
  createdAt: string;
  type: 'incoming' | 'outgoing';
}

export interface UserSocialProfile {
  username: string;
  tag: string;
  avatarUrl?: string;
  status: 'online' | 'in-game' | 'offline';
  statusMessage?: string;
  favoriteInstanceId?: string;
  favoriteInstanceName?: string;
  customBio?: string;
  joinedAt: string;
}

export interface GlobalGameStats {
  totalPlaytimeMinutes: number;
  totalPlaytimeHours: number;
  totalLaunches: number;
  instancesCount: number;
  unlockedAchievementsCount: number;
  totalXp: number;
  galaxyLevel: number;
  favoriteInstanceName?: string;
  instanceStats: {
    id: string;
    name: string;
    version: string;
    loader: string;
    icon?: string;
    iconBackground?: string;
    playTimeMinutes: number;
    launchCount: number;
    lastPlayed?: string;
    isFavorite?: boolean;
  }[];
  mostPlayedInstance?: {
    id: string;
    name: string;
    playTimeMinutes: number;
  };
}

// --- System Hardware Specifications ---
export interface SystemSpecs {
  totalMemoryMb: number;
  freeMemoryMb: number;
  cpuModel: string;
  cpuCores: number;
  cpuSpeedMhz?: number;
  platform: string;
  arch: string;
  recommendedRamMb: number;
  recommendedResolution: {
    width: number;
    height: number;
    label: string;
  };
}

export interface GalaxyAPI {
  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;

  // Instances
  listInstances: () => Promise<Instance[]>;
  getInstance: (id: string) => Promise<Instance | null>;
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
  }) => Promise<Instance>;
  updateInstance: (inst: Instance) => Promise<Instance>;
  deleteInstance: (id: string) => Promise<boolean>;
  cloneInstance: (id: string, optionsOrName: string | CloneInstanceOptions) => Promise<Instance | null>;
  toggleInstanceFavorite: (id: string) => Promise<boolean>;
  getMods: (id: string) => Promise<Mod[]>;
  importFiles: (id: string, subDir: string, filePaths: string[]) => Promise<number>;
  toggleMod: (id: string, filename: string, enabled: boolean) => Promise<boolean>;
  deleteMod: (id: string, filename: string) => Promise<boolean>;
  getResourcePacks: (id: string) => Promise<ResourcePack[]>;
  toggleResourcePack: (id: string, filename: string, enabled: boolean) => Promise<boolean>;
  deleteResourcePack: (id: string, filename: string) => Promise<boolean>;
  getShaderPacks: (id: string) => Promise<ShaderPack[]>;
  toggleShaderPack: (id: string, filename: string, enabled: boolean) => Promise<boolean>;
  deleteShaderPack: (id: string, filename: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  getWorldSaves: (id: string) => Promise<WorldSave[]>;
  openInstanceFolder: (id: string, subDir?: string) => Promise<void>;
  createWorldBackup: (id: string, worldFolderName: string) => Promise<any>;
  listWorldBackups: (id: string) => Promise<any[]>;
  restoreWorldBackup: (id: string, backupFilename: string) => Promise<boolean>;
  deleteWorldBackup: (id: string, backupFilename: string) => Promise<boolean>;
  importLocalModpack: (filePath: string, customName?: string) => Promise<Instance>;
  generateShareCode: (id: string) => Promise<InstanceShareData>;
  importFromShareCode: (codeOrPayload: string, customName?: string) => Promise<Instance>;

  // Versions
  getMojangVersions: () => Promise<MinecraftVersion[]>;
  getFabricVersions: (gameVersion: string) => Promise<string[]>;
  getQuiltVersions: (gameVersion: string) => Promise<string[]>;

  // Accounts
  getAccounts: () => Promise<Account[]>;
  getActiveAccount: () => Promise<Account | null>;
  setActiveAccount: (id: string) => Promise<Account | null>;
  createOfflineAccount: (username: string, skinUrl?: string, modelType?: 'classic' | 'slim') => Promise<Account>;
  addMicrosoftAccount: (data: Omit<Account, 'id' | 'isActive'>) => Promise<Account>;
  verifyOfficialMinecraftAccount: (usernameOrGamertag: string) => Promise<{
    verified: boolean;
    username: string;
    uuid: string;
    skinUrl?: string;
    modelType?: 'classic' | 'slim';
    error?: string;
  }>;
  removeAccount: (id: string) => Promise<boolean>;
  updateAccountSkin: (id: string, skinUrl: string, modelType?: 'classic' | 'slim') => Promise<Account | null>;
  updateAccountCosmetics: (id: string, cosmetics: GalaxyCosmetics) => Promise<Account | null>;

  // Java
  detectAllJava: () => Promise<JavaInstallation[]>;
  probeJava: (javaPath: string) => Promise<JavaInstallation | null>;
  downloadJava: (majorVersion?: number) => Promise<JavaInstallation>;
  checkJavaSetup: () => Promise<{ hasJava: boolean; javaCount: number; instancesCount: number }>;
  onJavaDownloadProgress: (callback: (data: { percent: number; step: string; downloadedBytes?: number; totalBytes?: number }) => void) => () => void;

  // Game execution
  launchInstance: (id: string) => Promise<void>;
  killInstance: (id: string) => Promise<boolean>;
  isInstanceRunning: (id: string) => Promise<boolean>;
  analyzeCrash: (logs: LogEntry[]) => Promise<CrashReportAnalysis>;

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
  }) => Promise<{ projects: MarketplaceProject[]; totalHits: number }>;
  getMarketplaceProject: (idOrSlug: string) => Promise<MarketplaceProject | null>;
  getMarketplaceVersions: (idOrSlug: string, loaders?: string[], gameVersions?: string[]) => Promise<MarketplaceVersion[]>;
  getMarketplaceVersionById: (versionId: string) => Promise<MarketplaceVersion | null>;
  installMarketplaceItem: (
    instanceId: string,
    projectType: 'mod' | 'resourcepack' | 'shader',
    downloadUrl: string,
    filename: string,
    sha1?: string
  ) => Promise<string>;
  installMarketplaceModWithDependencies: (
    instanceId: string,
    downloadUrl: string,
    filename: string,
    sha1?: string,
    dependencies?: any[],
    loader?: string,
    gameVersion?: string
  ) => Promise<{ installedFiles: string[]; dependencyNames: string[] }>;
  installModpack: (mrpackUrl: string, modpackName: string) => Promise<string>;

  // Settings & System Specs
  getSettings: () => Promise<LauncherSettings>;
  saveSettings: (settings: LauncherSettings) => Promise<void>;
  getSystemSpecs: () => Promise<SystemSpecs>;

  // Filesystem & Dialogs
  selectDirectory: () => Promise<string | null>;
  selectFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>;
  selectMultipleFiles: (filters?: { name: string; extensions: string[] }[]) => Promise<string[]>;
  openLauncherDir: () => Promise<void>;
  wipeAllData: () => Promise<boolean>;

  // Updates
  checkForUpdates: () => Promise<UpdateStatus>;
  downloadUpdate: () => Promise<boolean>;
  quitAndInstallUpdate: () => Promise<void>;
  getUpdateStatus: () => Promise<UpdateStatus>;
  getAppVersion: () => Promise<string>;

  // Achievements & Progression
  getAchievements: () => Promise<Achievement[]>;
  getAchievementStats: () => Promise<AchievementStats>;
  unlockAchievement: (id: string) => Promise<boolean>;
  resetAchievements: () => Promise<boolean>;
  testSoundAchievement: () => Promise<number>;
  themeChangedAchievement: (themeName: string) => Promise<void>;

  // Screenshots Gallery
  getScreenshots: () => Promise<ScreenshotItem[]>;
  getScreenshotsByInstance: (instanceId: string) => Promise<ScreenshotItem[]>;
  deleteScreenshot: (filePath: string) => Promise<boolean>;
  openScreenshotFolder: (filePath?: string) => Promise<void>;
  copyScreenshotToClipboard: (filePath: string) => Promise<boolean>;
  getScreenshotBase64: (filePath: string) => Promise<string | null>;

  // System Tray
  toggleTray: () => Promise<void>;
  showFromTray: () => Promise<void>;
  hideToTray: () => Promise<void>;

  // Galaxy Cloud & Cross-Device Sync
  getCloudSyncState: () => Promise<CloudSyncState>;
  toggleCloudSync: (enabled: boolean) => Promise<CloudSyncState>;
  syncAllToCloud: () => Promise<CloudSyncState>;
  backupInstanceToCloud: (instanceId: string) => Promise<CloudInstanceSnapshot | null>;
  restoreInstanceFromCloud: (cloudInstanceId: string) => Promise<Instance | null>;
  deleteCloudInstance: (cloudInstanceId: string) => Promise<boolean>;

  // Galaxy Friends & Social Network
  getFriends: () => Promise<GalaxyFriend[]>;
  addFriend: (usernameOrTag: string) => Promise<GalaxyFriend | null>;
  removeFriend: (friendId: string) => Promise<boolean>;
  toggleFavoriteFriend: (friendId: string) => Promise<boolean>;
  getSocialProfile: () => Promise<UserSocialProfile>;
  updateSocialProfile: (data: Partial<UserSocialProfile>) => Promise<UserSocialProfile>;
  getFriendRequests: () => Promise<FriendRequest[]>;
  sendFriendRequest: (tag: string) => Promise<FriendRequest | null>;
  acceptFriendRequest: (id: string) => Promise<GalaxyFriend | null>;
  declineFriendRequest: (id: string) => Promise<boolean>;
  getGameStats: () => Promise<GlobalGameStats>;

  // Instance Health & Diagnostics
  checkInstanceHealth: (instanceId: string) => Promise<InstanceHealthReport>;
  updateHealthMod: (instanceId: string, oldFileName: string, newDownloadUrl: string, newFileName: string, sha1?: string) => Promise<boolean>;
  updateAllHealthMods: (instanceId: string, updates: { oldFileName: string; downloadUrl: string; newFileName: string; sha1?: string }[]) => Promise<{ updated: number; failed: number }>;
  disableHealthMod: (instanceId: string, fileName: string) => Promise<boolean>;
  deleteHealthMod: (instanceId: string, fileName: string) => Promise<boolean>;
  installHealthDependency: (instanceId: string, dependencySlug: string) => Promise<boolean>;
  optimizeHealthRam: (instanceId: string, recommendedMaxMb: number) => Promise<boolean>;

  // Event Listeners
  onQuickLaunch: (callback: (instanceId: string) => void) => () => void;
  onFriendsUpdated: (callback: (friends: GalaxyFriend[]) => void) => () => void;
  onRequestsUpdated: (callback: (requests: FriendRequest[]) => void) => () => void;
  onProfileUpdated: (callback: (profile: UserSocialProfile) => void) => () => void;
  onAchievementUnlocked: (callback: (achievement: Achievement) => void) => () => void;
  onAchievementStatsUpdated: (callback: (data: { achievements: Achievement[]; stats: AchievementStats }) => void) => () => void;
  onCloudSyncUpdated: (callback: (state: CloudSyncState) => void) => () => void;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
  onLaunchProgress: (callback: (progress: LaunchProgress) => void) => () => void;
  onLog: (callback: (log: LogEntry) => void) => () => void;
  onDownloadProgress: (callback: (data: { filename: string; bytes: number; total: number }) => void) => () => void;
  onModpackProgress: (callback: (data: { completed: number; total: number; item?: string }) => void) => () => void;
  onGameCrashed: (callback: (data: { instanceId: string; instanceName: string; analysis: CrashReportAnalysis; code: number }) => void) => () => void;
  onGameStopped: (callback: (data: { instanceId: string; code: number }) => void) => () => void;
}

// ----------------------------------------------------
// Health Checkup & Diagnostics Types
// ----------------------------------------------------
export interface HealthModInfo {
  fileName: string;
  modId: string;
  name: string;
  version: string;
  description?: string;
  dependencies: string[];
  disabled: boolean;
  isCompatible: boolean;
}

export interface HealthModConflict {
  type: 'incompatible' | 'duplicate' | 'missing_dependency';
  severity: 'error' | 'warning';
  modA: string;
  modB: string;
  modAFile?: string;
  modBFile?: string;
  description: string;
  fixAction: 'disable_mod' | 'disable_duplicate' | 'delete_mod' | 'install_dependency';
  fixTargetFile?: string;
  suggestion?: string;
}

export interface HealthModUpdate {
  modName: string;
  currentVersion: string;
  latestVersion: string;
  oldFileName: string;
  newFileName: string;
  downloadUrl: string;
  sha1?: string;
}

export interface HealthJavaCheck {
  installedVersion: string;
  requiredVersion: string;
  javaPath: string;
  isCompatible: boolean;
  message: string;
}

export interface HealthMemoryCheck {
  allocatedMinMb: number;
  allocatedMaxMb: number;
  totalSystemRamMb: number;
  recommendedMinMb: number;
  recommendedMaxMb: number;
  status: 'optimal' | 'low' | 'excessive' | 'warning';
  message: string;
}

export interface HealthFileCheck {
  isHealthy: boolean;
  hasCorruptedOptions: boolean;
  hasStaleSessionLock: boolean;
  issues: string[];
}

export interface HealthCrashCheck {
  recentCrashCount: number;
  latestCrashSummary?: string;
}

export interface InstanceHealthReport {
  instanceId: string;
  instanceName: string;
  gameVersion: string;
  loader: ModLoader;
  score: number; // 0 - 100
  status: 'healthy' | 'warning' | 'critical';
  scannedAt: string;
  mods: {
    totalInstalled: number;
    compatibleCount: number;
    outdatedCount: number;
    conflictCount: number;
    items: HealthModInfo[];
    conflicts: HealthModConflict[];
    updates: HealthModUpdate[];
    missingDependencies: { modName: string; requiredDependency: string; dependencySlug: string }[];
  };
  java: HealthJavaCheck;
  memory: HealthMemoryCheck;
  files: HealthFileCheck;
  crashes: HealthCrashCheck;
}




