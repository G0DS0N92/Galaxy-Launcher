import { GalaxyAPI } from '../../preload/types';
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
      firstTimeSetupCompleted: false,
      enableAchievementPopups: true,
      startupAnimation: true
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
          resolution: { width: 1920, height: 1080, fullscreen: true },
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
      cloneInstance: async (id, optionsOrName) => {
        const found = mockInstances.find(i => i.id === id);
        if (!found) return null;
        const name = typeof optionsOrName === 'string' ? optionsOrName : optionsOrName.name;
        const cloned: Instance = { ...found, id: id + '-clone', name: name || `${found.name} (Copy)` };
        mockInstances.push(cloned);
        return cloned;
      },
      toggleInstanceFavorite: async (id) => {
        const found = mockInstances.find(i => i.id === id);
        if (found) {
          found.isFavorite = !found.isFavorite;
          return true;
        }
        return false;
      },
      getMods: async (id) => mockMods[id] || [],
      importFiles: async (id, subDir, filePaths) => filePaths.length,
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
        { filename: 'faithful_32x.zip', name: 'Faithful 32x', version: 'v1.21', description: 'Enhanced high-res vanilla textures', enabled: true, authors: ['Faithful Team'], path: '' },
        { filename: 'bare_bones.zip', name: 'Bare Bones', version: 'v1.20', description: 'Trailer aesthetic minimalist pack', enabled: true, authors: ['RobotPantaloons'], path: '' }
      ],
      toggleResourcePack: async () => true,
      deleteResourcePack: async () => true,
      getShaderPacks: async () => [
        { filename: 'BSL_v10.1.8.zip', name: 'BSL Shaders', version: '10.1.8', description: 'Bright, colorful, and distinct shaderpack.', enabled: true, authors: ['CaptTatsu'], path: '', icon: 'https://cdn.modrinth.com/data/Q1vvjJYV/2a611a3cb434fb52fb81fa5dace13c5d8b67e55d_96.webp', url: 'https://modrinth.com/shader/bsl-shaders' },
        { filename: 'ComplementaryReimagined_r5.9.3.zip', name: 'Complementary Shaders - Reimagined', version: '5.9.3', description: 'Exceptional quality, detail, and performance.', enabled: true, authors: ['EminGT'], path: '', icon: 'https://cdn.modrinth.com/data/HVnmMxH1/79cb7c8123bbc54945305b2ebad6b8881efdf5f8_96.webp', url: 'https://modrinth.com/shader/complementary-reimagined' },
        { filename: 'EclipseShaders.zip', name: 'Eclipse Shaders', version: 'Release', description: 'Atmospheric and balanced visuals.', enabled: true, authors: ['Community'], path: '', icon: 'https://cdn.modrinth.com/data/s8ZCVd1a/eabeacef221a8a550d446ede0c8d383aa8061b94_96.webp', url: 'https://modrinth.com/shader/eclipse-shaders' }
      ],
      toggleShaderPack: async () => true,
      deleteShaderPack: async () => true,
      openExternal: async () => true,
      openInstanceFolder: async () => {},
      openInstancesRootDir: async () => {},
      getWorldSaves: async () => [
        { folderName: 'Cosmic Survival', name: 'Cosmic Survival', lastPlayed: Date.now() - 3600000, sizeBytes: 1024 * 1024 * 24, gameMode: 'Survival' }
      ],
      createWorldBackup: async (instId, saveFolderName) => ({
        id: 'backup-' + Date.now(),
        worldName: saveFolderName,
        fileName: `${saveFolderName}_${Date.now()}.zip`,
        created: Date.now(),
        sizeBytes: 1024 * 1024 * 18,
        filePath: 'C:/Galaxy/backups/' + saveFolderName + '.zip'
      }),
      listWorldBackups: async () => [],
      restoreWorldBackup: async () => true,
      deleteWorldBackup: async () => true,
      importLocalModpack: async (filePath, customName) => {
        const inst: Instance = {
          id: 'imported-' + Date.now(),
          name: customName || 'Imported Modpack',
          version: '1.21.1',
          loader: 'fabric',
          createdAt: new Date().toISOString(),
          lastPlayed: new Date().toISOString(),
          playTimeMinutes: 0,
          memoryMin: 2048,
          memoryMax: 6144,
          jvmProfile: 'aikar',
          resolution: { width: 1920, height: 1080, fullscreen: true },
          isRunning: false
        };
        mockInstances.push(inst);
        return inst;
      },

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
      verifyOfficialMinecraftAccount: async (usernameOrGamertag: string) => {
        const trimmed = usernameOrGamertag.trim();
        if (!trimmed) {
          return { verified: false, username: '', uuid: '', error: 'Gamertag / Username cannot be empty.' };
        }
        return {
          verified: true,
          username: trimmed,
          uuid: '069a79f4-44e9-4726-a5be-17906103666d',
          skinUrl: `https://minotar.net/skin/${trimmed}`,
          modelType: 'classic' as const
        };
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
      updateAccountCosmetics: async (id, cosmetics) => {
        const found = mockAccounts.find(a => a.id === id);
        if (found) {
          found.cosmetics = cosmetics;
          return found;
        }
        return null;
      },

      generateShareCode: async (instanceId) => {
        const inst = mockInstances.find(i => i.id === instanceId) || mockInstances[0];
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const code = `GLX-${randomNum}`;
        const payload = {
          version: '1.0.4',
          name: inst?.name || 'Shared Instance',
          mcVersion: inst?.version || '1.20.1',
          loader: inst?.loader || 'fabric',
          modsCount: 0,
          mods: []
        };
        const shareString = `GLX1_${btoa(JSON.stringify(payload))}`;
        return {
          code,
          shareString,
          instanceName: inst?.name || 'Shared Instance',
          version: inst?.version || '1.20.1',
          loader: inst?.loader || 'fabric',
          modsCount: 0,
          payload
        };
      },
      importFromShareCode: async (codeOrPayload, customName) => {
        const newId = 'inst-share-' + Date.now();
        const newInst: Instance = {
          id: newId,
          name: customName || 'Imported Shared Instance',
          version: '1.20.1',
          loader: 'fabric',
          icon: 'galaxy',
          iconBackground: 'linear-gradient(135deg, #7928CA, #FF0080)',
          createdAt: new Date().toISOString(),
          lastPlayed: undefined,
          playTimeMinutes: 0,
          launchCount: 0,
          memoryMin: 2048,
          memoryMax: 4096,
          resolution: { width: 1920, height: 1080, fullscreen: true }
        };
        mockInstances.push(newInst);
        return newInst;
      },

      detectAllJava: async () => [
        { path: 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11-hotspot\\bin\\java.exe', version: '21.0.11', majorVersion: 21, vendor: 'Eclipse Temurin', arch: '64-Bit', isDefault: true, isValid: true },
        { path: 'C:\\Program Files\\Java\\jdk-17.0.9\\bin\\java.exe', version: '17.0.9', majorVersion: 17, vendor: 'Oracle OpenJDK', arch: '64-Bit', isDefault: false, isValid: true }
      ],
      probeJava: async () => null,
      downloadJava: async () => ({
        path: 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.11-hotspot\\bin\\javaw.exe',
        version: '21.0.11',
        majorVersion: 21,
        vendor: 'Eclipse Adoptium',
        arch: 'x64',
        isDefault: true,
        isValid: true
      }),
      checkJavaSetup: async () => ({ hasJava: true, javaCount: 1, instancesCount: mockInstances.length }),

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
      getMarketplaceVersionById: async (versionId: string) => {
        try {
          const res = await fetch(`https://api.modrinth.com/v2/version/${versionId}`);
          const v = await res.json();
          return {
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
            dependencies: v.dependencies || [],
            datePublished: v.date_published
          };
        } catch {
          return null;
        }
      },
      installMarketplaceItem: async () => 'installed.jar',
      installMarketplaceModWithDependencies: async () => ({ installedFiles: ['mod.jar'], dependencyNames: [] }),
      installModpack: async () => 'modpack-inst-id',

      getSettings: async () => ({ ...mockSettings }),
      saveSettings: async (s) => { mockSettings = { ...s }; },

      selectDirectory: async () => 'C:/Minecraft/Instances',
      selectFile: async () => null,
      selectMultipleFiles: async () => [],
      openLauncherDir: async () => {},
      wipeAllData: async () => true,

      checkForUpdates: async () => ({
        status: 'not-available',
        currentVersion: '1.0.4',
        latestVersion: '1.0.4'
      }),
      downloadUpdate: async () => true,
      quitAndInstallUpdate: async () => {},
      getUpdateStatus: async () => ({
        status: 'not-available',
        currentVersion: '1.0.4'
      }),
      getAppVersion: async () => '1.0.4',

      // Achievements & Progression
      getAchievements: async () => [
        {
          id: 'welcome',
          title: 'Welcome To The Galaxy',
          description: 'Open Galaxy Launcher for the first time.',
          icon: '🌌',
          category: 'exploration',
          rarity: 'common',
          xp: 100,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        },
        {
          id: 'first_launch',
          title: 'First Launch',
          description: 'Create your first Minecraft instance.',
          icon: '🚀',
          category: 'instance',
          rarity: 'common',
          xp: 150,
          unlocked: false
        },
        {
          id: 'getting_started',
          title: 'Getting Started',
          description: 'Play Minecraft for 1 hour through Galaxy Launcher.',
          icon: '🎮',
          category: 'playtime',
          rarity: 'uncommon',
          xp: 250,
          unlocked: false,
          progress: { current: 0, max: 60, unit: 'minutes' }
        },
        {
          id: 'time_traveler',
          title: 'Time Traveler',
          description: 'Accumulate 10 hours of Minecraft playtime through Galaxy Launcher.',
          icon: '⏳',
          category: 'playtime',
          rarity: 'rare',
          xp: 500,
          unlocked: false,
          progress: { current: 0, max: 600, unit: 'minutes' }
        },
        {
          id: 'galaxy_explorer',
          title: 'Galaxy Explorer',
          description: 'Accumulate 50 hours of Minecraft playtime through Galaxy Launcher.',
          icon: '🌠',
          category: 'playtime',
          rarity: 'epic',
          xp: 1000,
          unlocked: false,
          progress: { current: 0, max: 3000, unit: 'minutes' }
        },
        {
          id: 'veteran_traveler',
          title: 'Veteran Traveler',
          description: 'Accumulate 100 hours of Minecraft playtime through Galaxy Launcher.',
          icon: '🪐',
          category: 'playtime',
          rarity: 'epic',
          xp: 2000,
          unlocked: false,
          progress: { current: 0, max: 6000, unit: 'minutes' }
        },
        {
          id: 'galaxy_legend',
          title: 'Galaxy Legend',
          description: 'Accumulate 500 hours of Minecraft playtime through Galaxy Launcher.',
          icon: '👑',
          category: 'playtime',
          rarity: 'legendary',
          xp: 5000,
          unlocked: false,
          progress: { current: 0, max: 30000, unit: 'minutes' }
        },
        {
          id: 'modder',
          title: 'Modder',
          description: 'Install your first mod through the Galaxy Marketplace.',
          icon: '🧩',
          category: 'modding',
          rarity: 'common',
          xp: 150,
          unlocked: false
        },
        {
          id: 'galaxies_conquered',
          title: 'Galaxies Conquered',
          description: 'Unlock 100% of all other achievements in Galaxy Launcher.',
          icon: '🏆',
          category: 'mastery',
          rarity: 'cosmic',
          xp: 10000,
          unlocked: false
        },
        {
          id: 'into_clouds',
          title: 'Into The Clouds',
          description: 'Enable Galaxy Cloud for the first time.',
          icon: '☁️',
          category: 'cloud',
          rarity: 'uncommon',
          xp: 200,
          unlocked: false
        },
        {
          id: 'first_friend',
          title: 'Friend',
          description: 'Add your first Galaxy friend.',
          icon: '👥',
          category: 'social',
          rarity: 'uncommon',
          xp: 250,
          unlocked: false
        },
        {
          id: 'in_it_together',
          title: 'In It Together',
          description: 'Play on a server with a Galaxy friend.',
          icon: '🤝',
          category: 'social',
          rarity: 'rare',
          xp: 500,
          unlocked: false
        }
      ],
      getAchievementStats: async () => ({
        totalUnlocked: 1,
        totalAchievements: 12,
        totalXp: 100,
        level: 1,
        levelProgress: 20,
        totalPlaytimeHours: 0
      }),
      unlockAchievement: async () => true,
      resetAchievements: async () => true,

      // Galaxy Cloud & Cross-Device Sync
      getCloudSyncState: async () => ({
        enabled: true,
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
        deviceId: 'mock-device-win',
        deviceName: 'Galaxy Desktop Rig',
        storageUsedBytes: 1024 * 1024 * 14.5,
        storageMaxBytes: 1024 * 1024 * 1024 * 5,
        syncStatus: 'synced',
        cloudInstances: [
          {
            id: 'cloud-snap-1',
            name: 'Cosmic Survival 1.21.1',
            version: '1.21.1',
            loader: 'fabric',
            loaderVersion: '0.16.5',
            memoryMin: 2048,
            memoryMax: 4096,
            modsCount: 14,
            modsList: [
              { filename: 'sodium-fabric.jar', name: 'Sodium', version: '0.5.11' },
              { filename: 'iris-fabric.jar', name: 'Iris Shaders', version: '1.7.0' }
            ],
            shadersList: ['ComplementaryReimagined.zip'],
            resourcePacksList: ['Faithful32x.zip'],
            lastBackedUpAt: new Date(Date.now() - 3600000).toISOString(),
            playTimeMinutes: 240,
            sizeBytes: 1024 * 1024 * 14.5,
            jvmArgs: '-Xmx4G'
          }
        ]
      }),
      toggleCloudSync: async (enabled) => ({
        enabled,
        autoSync: enabled,
        lastSyncedAt: new Date().toISOString(),
        deviceId: 'mock-device-win',
        deviceName: 'Galaxy Desktop Rig',
        storageUsedBytes: 1024 * 1024 * 14.5,
        storageMaxBytes: 1024 * 1024 * 1024 * 5,
        syncStatus: 'synced',
        cloudInstances: []
      }),
      syncAllToCloud: async () => ({
        enabled: true,
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
        deviceId: 'mock-device-win',
        deviceName: 'Galaxy Desktop Rig',
        storageUsedBytes: 1024 * 1024 * 14.5,
        storageMaxBytes: 1024 * 1024 * 1024 * 5,
        syncStatus: 'synced',
        cloudInstances: []
      }),
      backupInstanceToCloud: async () => null,
      restoreInstanceFromCloud: async () => null,
      deleteCloudInstance: async () => true,

      // Galaxy Friends Network & Social
      getFriends: async () => [],
      addFriend: async (tag) => ({
        id: 'friend-' + Date.now(),
        username: tag.split('#')[0] || tag,
        tag: tag.includes('#') ? tag : `${tag}#${Math.floor(1000 + Math.random() * 9000)}`,
        avatarUrl: '',
        status: 'online',
        activity: 'Browsing Marketplace',
        lastSeen: 'Now',
        isFavorite: false
      }),
      removeFriend: async () => true,
      toggleFavoriteFriend: async () => true,

      getSocialProfile: async () => ({
        username: 'CosmicExplorer',
        tag: 'CosmicExplorer#1337',
        status: 'online',
        statusMessage: 'Venturing into the unknown void 🌌',
        avatarUrl: '',
        favoriteInstanceId: mockInstances[0]?.id || '',
        favoriteInstanceName: mockInstances[0]?.name || 'None',
        customBio: 'Cosmic Explorer & Modpack Creator',
        joinedAt: 'Today'
      }),
      updateSocialProfile: async (data) => ({
        username: 'CosmicExplorer',
        tag: 'CosmicExplorer#1337',
        status: 'online',
        statusMessage: 'Venturing into the unknown void 🌌',
        avatarUrl: '',
        favoriteInstanceId: '',
        favoriteInstanceName: 'None',
        customBio: 'Cosmic Explorer & Modpack Creator',
        joinedAt: 'Today',
        ...data
      }),
      getFriendRequests: async () => [],
      sendFriendRequest: async (tag) => ({
        id: 'req-' + Date.now(),
        senderUsername: 'CosmicExplorer',
        senderTag: 'CosmicExplorer#1337',
        createdAt: 'Just now',
        type: 'outgoing'
      }),
      acceptFriendRequest: async () => null,
      declineFriendRequest: async () => true,
      getGameStats: async () => {
        const totalMins = mockInstances.reduce((acc, i) => acc + (i.playTimeMinutes || 0), 0);
        const totalL = mockInstances.reduce((acc, i) => acc + (i.launchCount || 0), 0);
        const fav = mockInstances.find(i => i.isFavorite) || mockInstances[0];

        return {
          totalPlaytimeMinutes: totalMins,
          totalPlaytimeHours: Math.floor(totalMins / 60),
          totalLaunches: totalL,
          instancesCount: mockInstances.length,
          unlockedAchievementsCount: 0,
          totalXp: 0,
          galaxyLevel: 1,
          favoriteInstanceName: fav?.name || 'None Selected',
          instanceStats: mockInstances.map(i => ({
            id: i.id,
            name: i.name,
            version: i.version,
            loader: i.loader,
            icon: i.icon,
            iconBackground: i.iconBackground,
            playTimeMinutes: i.playTimeMinutes || 0,
            launchCount: i.launchCount || 0,
            lastPlayed: i.lastPlayed,
            isFavorite: Boolean(i.isFavorite)
          }))
        };
      },

      // Screenshots Archive
      getScreenshots: async () => [],
      getScreenshotsByInstance: async () => [],
      deleteScreenshot: async () => true,
      copyScreenshotToClipboard: async () => true,
      openScreenshotFolder: async () => {},
      getScreenshotBase64: async () => null,

      // System Specs
      getSystemSpecs: async () => ({
        totalMemoryMb: 16384,
        freeMemoryMb: 8192,
        cpuModel: 'Intel(R) Core(TM) i7-13700H',
        cpuCores: 16,
        cpuSpeedMhz: 2900,
        platform: 'win32',
        arch: 'x64',
        recommendedRamMb: 4096,
        recommendedResolution: {
          width: 1920,
          height: 1080,
          label: '1080p (Full HD) • Recommended Standard'
        }
      }),

      // Tray & Achievements
      toggleTray: async () => {},
      showFromTray: async () => {},
      hideToTray: async () => {},
      testSoundAchievement: async () => 1,
      themeChangedAchievement: async () => {},

      // Instance Health & Diagnostics
      checkInstanceHealth: async (instanceId: string) => ({
        instanceId,
        instanceName: 'Cosmic Fabric',
        gameVersion: '1.20.4',
        loader: 'fabric' as const,
        score: 94,
        status: 'healthy' as const,
        scannedAt: new Date().toISOString(),
        mods: {
          totalInstalled: 5,
          compatibleCount: 5,
          outdatedCount: 0,
          conflictCount: 0,
          items: [
            { fileName: 'fabric-api-0.92.0.jar', modId: 'fabric-api', name: 'Fabric API', version: '0.92.0', dependencies: [], disabled: false, isCompatible: true },
            { fileName: 'sodium-fabric-0.5.11.jar', modId: 'sodium', name: 'Sodium', version: '0.5.11', dependencies: ['fabric-api'], disabled: false, isCompatible: true },
            { fileName: 'iris-fabric-1.7.0.jar', modId: 'iris', name: 'Iris Shaders', version: '1.7.0', dependencies: ['sodium'], disabled: false, isCompatible: true },
            { fileName: 'lithium-fabric-0.12.7.jar', modId: 'lithium', name: 'Lithium', version: '0.12.7', dependencies: [], disabled: false, isCompatible: true },
            { fileName: 'ferrite-core-6.0.3.jar', modId: 'ferritecore', name: 'FerriteCore', version: '6.0.3', dependencies: [], disabled: false, isCompatible: true }
          ],
          conflicts: [],
          updates: [],
          missingDependencies: []
        },
        java: {
          installedVersion: '21.0.2',
          requiredVersion: '21',
          javaPath: 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.2.13-hotspot\\bin\\javaw.exe',
          isCompatible: true,
          message: 'Using compatible Java 21 LTS 64-bit runtime'
        },
        memory: {
          allocatedMinMb: 2048,
          allocatedMaxMb: 4096,
          totalSystemRamMb: 16384,
          recommendedMinMb: 2048,
          recommendedMaxMb: 4096,
          status: 'optimal' as const,
          message: '4096 MB RAM is perfectly balanced for 5 active mods'
        },
        files: {
          isHealthy: true,
          hasCorruptedOptions: false,
          hasStaleSessionLock: false,
          issues: []
        },
        crashes: {
          recentCrashCount: 0,
          latestCrashSummary: undefined
        }
      }),
      updateHealthMod: async () => true,
      updateAllHealthMods: async () => ({ updated: 1, failed: 0 }),
      disableHealthMod: async () => true,
      deleteHealthMod: async () => true,
      installHealthDependency: async () => true,
      optimizeHealthRam: async () => true,

      onAchievementUnlocked: () => () => {},
      onAchievementStatsUpdated: () => () => {},
      onCloudSyncUpdated: () => () => {},
      onFriendsUpdated: () => () => {},
      onRequestsUpdated: () => () => {},
      onProfileUpdated: () => () => {},
      onUpdateStatus: () => () => {},
      onLaunchProgress: () => () => {},
      onLog: () => () => {},
      onDownloadProgress: () => () => {},
      onModpackProgress: () => () => {},
      onQuickLaunch: () => () => {},
      onGameCrashed: () => () => {},
      onGameStopped: () => () => {},
      onJavaDownloadProgress: () => () => {}
    };

    window.galaxy = mockApi;
  }
}
