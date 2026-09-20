export type ModLoader = 'vanilla' | 'fabric' | 'forge' | 'neoforge' | 'quilt';

export interface Instance {
  id: string;
  name: string;
  version: string;
  loader: ModLoader;
  loaderVersion?: string;
  icon?: string;
  banner?: string;
  memoryMin: number; // in MB
  memoryMax: number; // in MB
  jvmArgs?: string;
  javaPath?: string;
  lastPlayed?: string;
  playTimeMinutes: number;
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

export interface Account {
  id: string;
  username: string;
  uuid: string;
  type: 'cracked' | 'microsoft';
  skinUrl?: string;
  capeUrl?: string;
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
}

export interface ResourcePack {
  filename: string;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  path: string;
}

export interface ShaderPack {
  filename: string;
  name: string;
  enabled: boolean;
  path: string;
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
  datePublished: string;
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

export interface LauncherSettings {
  theme: 'nebula-purple' | 'supernova-cyan' | 'solar-gold' | 'deep-void' | 'emerald-aurora';
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
