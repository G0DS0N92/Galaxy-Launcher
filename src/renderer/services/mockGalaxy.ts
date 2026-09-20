import { GalaxyAPI } from '../../preload/index';
import { Instance, Account, LauncherSettings, JavaInstallation, Mod, ResourcePack, ShaderPack, WorldSave, MinecraftVersion, MarketplaceProject, MarketplaceVersion, LaunchProgress, LogEntry, CrashReportAnalysis } from '../../preload/types';

export function setupMockGalaxy(): void {
  if (typeof window !== 'undefined' && !window.galaxy) {
    let mockInstances: Instance[] = [];

    let mockAccounts: Account[] = [];

    let mockSettings: LauncherSettings = {
      theme: 'nebula-purple',
      backgroundAnimation: true,
      soundEffects: true,
      soundVolume: 0.7,
      closeOnLaunch: false,
      discordRpc: true,
      defaultJavaPath: '',
      defaultRamMin: 2048,
      defaultRamMax: 4096,
      instancesDirectory: 'D:/Galaxy Launcher/instances',
      firstTimeSetupCompleted: false
    };

    let mockMods: Record<string, Mod[]> = {
      'cosmic-fabric-121': [
        { filename: 'sodium-fabric-0.5.11.jar', name: 'Sodium', version: '0.5.11', description: 'Next-generation rendering engine and modern graphics optimizer.', enabled: true, path: '', sizeBytes: 1024 * 1024 * 2.1 },
        { filename: 'iris-fabric-1.7.0.jar', name: 'Iris Shaders', version: '1.7.0', description: 'Modern shader pack loader for Minecraft.', enabled: true, path: '', sizeBytes: 1024 * 1024 * 3.4 },
        { filename: 'lithium-fabric-0.12.7.jar', name: 'Lithium', version: '0.12.7', description: 'Optimization mod for physics, chunk loading, and AI.', enabled: true, path: '', sizeBytes: 1024 * 1024 * 1.2 },
        { filename: 'ferrite-core-6.0.3.jar', name: 'FerriteCore', version: '6.0.3', description: 'Memory usage optimizations for modded environments.', enabled: true, path: '', sizeBytes: 1024 * 350 },
        { filename: 'fabric-api-0.92.0.jar', name: 'Fabric API', version: '0.92.0', description: 'Core essential hooks and inter-mod communication library.', enabled: true, path: '', sizeBytes: 1024 * 1024 * 2.8 }
      ]
    };

    const mockApi: GalaxyAPI = {
      minimize: async () => {},
      maximize: async () => {},
      close: async () => {},
      isMaximized: async () => false,

      listInstances: async () => [...mockInstances],
      getInstance: async (id) => mockInstances.find(i => i.id === id) || null,
      createInstance: async (options) => {
        const newInst: Instance = {
          id: options.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
          name: options.name,
          version: options.version,
          loader: options.loader,
          loaderVersion: options.loaderVersion,
          memoryMin: options.memoryMin || 2048,
          memoryMax: options.memoryMax || 4096,
          playTimeMinutes: 0,
          resolution: { width: 1280, height: 720, fullscreen: false },
          createdAt: new Date().toISOString()
        };
        mockInstances.push(newInst);
        return newInst;
      },
      updateInstance: async (inst) => {
        mockInstances = mockInstances.map(i => i.id === inst.id ? inst : i);
        return inst;
      },
      deleteInstance: async (id) => {
        mockInstances = mockInstances.filter(i => i.id !== id);
        return true;
      },
      cloneInstance: async (id, newName) => {
        const found = mockInstances.find(i => i.id === id);
        if (!found) return null;
        const cloned: Instance = { ...found, id: id + '-clone', name: newName };
        mockInstances.push(cloned);
        return cloned;
      },
      getMods: async (id) => mockMods[id] || [],
      toggleMod: async (id, filename, enabled) => {
        if (mockMods[id]) {
          mockMods[id] = mockMods[id].map(m => m.filename === filename ? { ...m, enabled } : m);
        }
        return true;
      },
      deleteMod: async (id, filename) => {
        if (mockMods[id]) {
          mockMods[id] = mockMods[id].filter(m => m.filename !== filename);
        }
        return true;
      },
      getResourcePacks: async () => [
        { filename: 'faithful_32x.zip', name: 'Faithful 32x', description: 'Enhanced high-res vanilla textures', enabled: true, path: '' },
        { filename: 'bare_bones.zip', name: 'Bare Bones', description: 'Trailer aesthetic minimalist pack', enabled: true, path: '' }
      ],
      getShaderPacks: async () => [
        { filename: 'ComplementaryReimagined_r5.2.2.zip', name: 'Complementary Reimagined', enabled: true, path: '' },
        { filename: 'BSL_v8.2.09.zip', name: 'BSL Shaders', enabled: true, path: '' }
      ],
      getWorldSaves: async () => [
        { folderName: 'Cosmic Survival', name: 'Cosmic Survival', lastPlayed: Date.now() - 3600000, sizeBytes: 1024 * 1024 * 24, gameMode: 'Survival' }
      ],
      openInstanceFolder: async () => {},

      getMojangVersions: async () => [
        { id: '1.21.4', type: 'release', url: '', time: '', releaseTime: '' },
        { id: '1.21.3', type: 'release', url: '', time: '', releaseTime: '' },
        { id: '1.21.1', type: 'release', url: '', time: '', releaseTime: '' },
        { id: '1.20.4', type: 'release', url: '', time: '', releaseTime: '' },
        { id: '1.20.1', type: 'release', url: '', time: '', releaseTime: '' },
        { id: '1.19.4', type: 'release', url: '', time: '', releaseTime: '' },
        { id: '1.16.5', type: 'release', url: '', time: '', releaseTime: '' },
        { id: '1.12.2', type: 'release', url: '', time: '', releaseTime: '' },
        { id: '1.8.9', type: 'release', url: '', time: '', releaseTime: '' }
      ],
      getFabricVersions: async () => ['0.16.10', '0.16.9', '0.16.5', '0.15.11'],
      getQuiltVersions: async () => ['0.27.1-beta.1', '0.26.4', '0.25.0'],

      getAccounts: async () => [...mockAccounts],
      getActiveAccount: async () => mockAccounts.find(a => a.isActive) || mockAccounts[0] || null,
      setActiveAccount: async (id) => {
        mockAccounts = mockAccounts.map(a => ({ ...a, isActive: a.id === id }));
        return mockAccounts.find(a => a.id === id) || null;
      },
      createOfflineAccount: async (username, skinUrl, modelType) => {
        const newAcc: Account = {
          id: 'cracked-' + Date.now(),
          username,
          uuid: '069a79f4-44e9-4726-a5be-' + Date.now().toString().slice(-12),
          type: 'cracked',
          skinUrl: skinUrl || `https://minotar.net/skin/${username}`,
          isActive: false,
          modelType: modelType || 'classic'
        };
        mockAccounts.push(newAcc);
        return newAcc;
      },
      addMicrosoftAccount: async (data) => {
        const newAcc: Account = { ...data, id: 'ms-' + Date.now(), type: 'microsoft', isActive: true };
        mockAccounts = mockAccounts.map(a => ({ ...a, isActive: false }));
        mockAccounts.push(newAcc);
        return newAcc;
      },
      removeAccount: async (id) => {
        mockAccounts = mockAccounts.filter(a => a.id !== id);
        return true;
      },
      updateAccountSkin: async (id, skinUrl, modelType) => {
        const found = mockAccounts.find(a => a.id === id);
        if (found) {
          found.skinUrl = skinUrl;
          if (modelType) found.modelType = modelType;
          return found;
        }
        return null;
      },

      detectAllJava: async () => [
        { path: 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11-hotspot\\bin\\java.exe', version: '21.0.11', majorVersion: 21, vendor: 'Eclipse Temurin', arch: '64-Bit', isDefault: true, isValid: true },
        { path: 'C:\\Program Files\\Java\\jdk-17.0.9\\bin\\java.exe', version: '17.0.9', majorVersion: 17, vendor: 'Oracle OpenJDK', arch: '64-Bit', isDefault: false, isValid: true }
      ],
      probeJava: async () => null,

      launchInstance: async (id) => {
        const inst = mockInstances.find(i => i.id === id);
        if (!inst) return;
        inst.isRunning = true;
      },
      killInstance: async (id) => {
        const inst = mockInstances.find(i => i.id === id);
        if (inst) inst.isRunning = false;
        return true;
      },
      isInstanceRunning: async (id) => {
        return Boolean(mockInstances.find(i => i.id === id)?.isRunning);
      },
      analyzeCrash: async () => ({
        isCrash: false,
        title: 'No Crash Detected',
        explanation: '',
        suggestion: ''
      }),

      searchMarketplace: async (params) => {
        // Direct query to Modrinth API even in web mode
        try {
          const res = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(params.query || '')}&limit=${params.limit || 20}&facets=[["project_type:${params.projectType || 'mod'}"]]`);
          const data = await res.json();
          const projects = (data.hits || []).map((h: any) => ({
            id: h.project_id,
            slug: h.slug,
            title: h.title,
            description: h.description,
            categories: h.categories || [],
            clientSide: h.client_side,
            serverSide: h.server_side,
            iconUrl: h.icon_url,
            downloads: h.downloads || 0,
            follows: h.follows || 0,
            dateUpdated: h.date_modified,
            author: h.author,
            projectType: h.project_type as any,
            gallery: h.gallery || []
          }));
          return { projects, totalHits: data.total_hits || 0 };
        } catch {
          return { projects: [], totalHits: 0 };
        }
      },
      getMarketplaceProject: async (id) => {
        try {
          const res = await fetch(`https://api.modrinth.com/v2/project/${id}`);
          const data = await res.json();
          return {
            id: data.id,
            slug: data.slug,
            title: data.title,
            description: data.description,
            body: data.body,
            categories: data.categories || [],
            clientSide: data.client_side,
            serverSide: data.server_side,
            iconUrl: data.icon_url,
            downloads: data.downloads || 0,
            follows: data.followers || 0,
            dateUpdated: data.updated,
            author: '',
            projectType: data.project_type as any,
            gallery: (data.gallery || []).map((g: any) => g.url)
          };
        } catch {
          return null;
        }
      },
      getMarketplaceVersions: async (id) => {
        try {
          const res = await fetch(`https://api.modrinth.com/v2/project/${id}/version`);
          const list = await res.json();
          return list.map((v: any) => ({
            id: v.id,
            versionNumber: v.version_number,
            name: v.name,
            gameVersions: v.game_versions || [],
            loaders: v.loaders || [],
            files: (v.files || []).map((f: any) => ({
              url: f.url,
              filename: f.filename,
              primary: f.primary,
              size: f.size,
              hashes: f.hashes || {}
            })),
            datePublished: v.date_published
          }));
        } catch {
          return [];
        }
      },
      installMarketplaceItem: async () => 'installed.jar',
      installModpack: async () => 'modpack-inst-id',

      getSettings: async () => ({ ...mockSettings }),
      saveSettings: async (s) => { mockSettings = { ...s }; },

      selectDirectory: async () => 'C:/Minecraft/Instances',
      selectFile: async () => null,
      openLauncherDir: async () => {},
      wipeAllData: async () => true,

      checkForUpdates: async () => ({
        status: 'not-available',
        currentVersion: '1.0.0',
        latestVersion: '1.0.0'
      }),
      downloadUpdate: async () => true,
      quitAndInstallUpdate: async () => {},
      getUpdateStatus: async () => ({
        status: 'not-available',
        currentVersion: '1.0.0'
      }),
      getAppVersion: async () => '1.0.0',

      onUpdateStatus: () => () => {},
      onLaunchProgress: () => () => {},
      onLog: () => () => {},
      onDownloadProgress: () => () => {},
      onModpackProgress: () => () => {}
    };

    window.galaxy = mockApi;
  }
}
