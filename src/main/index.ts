import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { InstanceManager } from './instanceManager';
import { AccountsManager } from './accountsManager';
import { MinecraftLauncher } from './minecraftLauncher';
import { JavaDetector } from './javaDetector';
import { MarketplaceService } from './marketplaceService';
import { UpdateManager } from './updateManager';
import { DiscordRpcService } from './discordRpc';
import { AchievementsManager } from './achievementsManager';
import { CloudService } from './cloudService';
import { ScreenshotsManager } from './screenshotsManager';
import { TrayManager } from './trayManager';
import { HealthCheckService } from './healthCheckService';
import { LauncherSettings, ModLoader } from '../preload/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register custom galaxy-file protocol for fast secure local asset/screenshot loading
protocol.registerSchemesAsPrivileged([
  { scheme: 'galaxy-file', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true } }
]);

process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Register App User Model ID on Windows for system tray, notification grouping, and taskbar identity
if (process.platform === 'win32') {
  app.setAppUserModelId('com.galaxy.launcher');
}

// Track app startup time for speedrunner secret achievement
const appStartupTime = Date.now();

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(false);
    }
  });
}

let mainWindow: BrowserWindow | null = null;

const userDataPath = app.getPath('userData');
const launcherDir = path.join(userDataPath, 'GalaxyLauncher');
const instancesDir = path.join(launcherDir, 'instances');
const settingsFile = path.join(launcherDir, 'launcher-config.json');

fs.mkdirSync(launcherDir, { recursive: true });
fs.mkdirSync(instancesDir, { recursive: true });

const instanceManager = new InstanceManager(instancesDir);
const accountsManager = new AccountsManager(launcherDir);
const minecraftLauncher = new MinecraftLauncher(launcherDir);
const updateManager = new UpdateManager();
const discordRpc = new DiscordRpcService();
const achievementsManager = new AchievementsManager(launcherDir);
const cloudService = new CloudService(launcherDir, instanceManager);
const screenshotsManager = new ScreenshotsManager(launcherDir, instanceManager);
const trayManager = new TrayManager();
const healthCheckService = new HealthCheckService(launcherDir, instanceManager);

function getSavedSettings(): LauncherSettings {
  const defaultSettings: LauncherSettings = {
    theme: 'deep-void',
    backgroundAnimation: true,
    soundEffects: true,
    soundVolume: 0.7,
    closeOnLaunch: false,
    discordRpc: true,
    defaultJavaPath: '',
    defaultRamMin: 2048,
    defaultRamMax: 4096,
    defaultResolutionWidth: 1920,
    defaultResolutionHeight: 1080,
    defaultFullscreen: false,
    autoCheckUpdates: true,
    updateChannel: 'stable',
    instancesDirectory: instancesDir,
    minimizeToTray: true,
    closeToTray: true,
    startupAnimation: true
  };

  try {
    if (fs.existsSync(settingsFile)) {
      const raw = fs.readFileSync(settingsFile, 'utf-8');
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to read settings:', err);
  }
  return defaultSettings;
}

function saveLauncherSettings(settings: LauncherSettings): void {
  try {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8');
    if (settings.instancesDirectory && settings.instancesDirectory !== instanceManager.getInstancesDir()) {
      instanceManager.setInstancesDir(settings.instancesDirectory);
    }
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

async function createWindow() {
  const preloadCandidates = [
    path.join(__dirname, '../preload/index.cjs'),
    path.join(__dirname, '../preload/index.js'),
    path.join(app.getAppPath(), 'dist-electron/preload/index.cjs'),
    path.join(app.getAppPath(), 'dist-electron/preload/index.js')
  ];
  let preloadPath = preloadCandidates[0];
  for (const candidate of preloadCandidates) {
    if (fs.existsSync(candidate)) {
      preloadPath = candidate;
      break;
    }
  }
  console.log('[Main] Using preload script:', preloadPath);

  const iconCandidates = [
    path.join(app.getAppPath(), 'build/icon.ico'),
    path.join(app.getAppPath(), 'build/icon.png'),
    path.join(app.getAppPath(), 'public/icon.png'),
    path.join(process.cwd(), 'build/icon.ico'),
    path.join(process.cwd(), 'build/icon.png'),
    path.join(process.cwd(), 'public/icon.png'),
    path.join(__dirname, '../../build/icon.ico'),
    path.join(__dirname, '../../build/icon.png'),
    path.join(__dirname, '../../public/icon.png')
  ];
  let windowIcon: string | undefined;
  for (const ic of iconCandidates) {
    if (fs.existsSync(ic)) {
      windowIcon = ic;
      break;
    }
  }

  mainWindow = new BrowserWindow({
    title: 'Galaxy Launcher',
    icon: windowIcon,
    width: 1280,
    height: 800,
    minWidth: 1060,
    minHeight: 680,
    frame: false,
    backgroundColor: '#07080e',
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    console.log(`[Renderer] [${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (e, errorCode, errorDesc, validatedURL) => {
    console.error('Window failed to load:', errorCode, errorDesc, validatedURL);
  });

  // Load URL or build file
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const candidates = [
      path.join(app.getAppPath(), 'dist/index.html'),
      path.join(__dirname, '../../dist/index.html'),
      path.join(__dirname, '../renderer/index.html'),
      path.join(__dirname, 'index.html')
    ];
    let loaded = false;
    for (const htmlPath of candidates) {
      if (fs.existsSync(htmlPath)) {
        console.log('Loading UI from:', htmlPath);
        mainWindow.loadFile(htmlPath);
        loaded = true;
        break;
      }
    }
    if (!loaded) {
      mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    }
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Minimize to tray on close (if closeToTray setting is active)
  mainWindow.on('close', (e) => {
    const settings = getSavedSettings();
    if (!trayManager.isAppQuitting() && settings.closeToTray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  updateManager.setMainWindow(mainWindow);
  updateManager.setOnQuittingCallback(() => {
    trayManager.setAppQuitting(true);
    trayManager.destroy();
  });
  achievementsManager.setMainWindow(mainWindow);
  cloudService.setMainWindow(mainWindow);
}

app.whenReady().then(async () => {
  // Protocol handler for secure local screenshot previews
  try {
    protocol.handle('galaxy-file', (request) => {
      try {
        const urlStr = request.url.replace(/^galaxy-file:\/\//, '');
        const decodedPath = decodeURIComponent(urlStr);
        return net.fetch(`file:///${decodedPath.replace(/^file:\/\/\/?/, '')}`);
      } catch (e) {
        return new Response('Not found', { status: 404 });
      }
    });
  } catch (err) {
    console.warn('[Main] Protocol registration note:', err);
  }

  setupIpcHandlers();
  await createWindow();

  if (mainWindow) {
    trayManager.init(mainWindow);
    trayManager.setQuickLaunchHandler(async () => {
      const instances = await instanceManager.listInstances();
      if (instances.length > 0) {
        mainWindow?.webContents.send('game:quick-launch', instances[0].id);
      }
    });
    trayManager.setCheckUpdatesHandler(() => {
      updateManager.checkForUpdates().catch(() => {});
    });
  }

  const activeAcc = accountsManager.getActiveAccount();
  achievementsManager.switchAccount(activeAcc?.id || null);

  achievementsManager.setAccountChecker(() => {
    const active = accountsManager.getActiveAccount();
    return !!active;
  });

  // Playtime Tracking Ticker (increments playtime for active instances every 60 seconds)
  setInterval(async () => {
    try {
      const instances = await instanceManager.listInstances();
      let anyRunning = false;
      for (const inst of instances) {
        if (minecraftLauncher.isInstanceRunning(inst.id)) {
          anyRunning = true;
          inst.playTimeMinutes = (inst.playTimeMinutes || 0) + 1;
          await instanceManager.updateInstance(inst);
        }
      }
      if (anyRunning) {
        achievementsManager.addPlaytime(1);
      }
    } catch (err) {
      console.warn('[Main] Playtime tracking tick error:', err);
    }
  }, 60000);

  const settings = getSavedSettings();
  if (!settings.firstTimeSetupCompleted) {
    // Ensure clean state on first launch: purge legacy test demo instances if present
    const existingInsts = await instanceManager.listInstances();
    for (const inst of existingInsts) {
      if (inst.name === 'Cosmic Fabric 1.21' || inst.name === 'Vanilla Odyssey') {
        await instanceManager.deleteInstance(inst.id);
      }
    }
  }

  if (settings.discordRpc !== false) {
    discordRpc.setActivity({
      details: 'Exploring Cosmic Universe',
      state: 'In Launcher Menu',
      startTimestamp: Math.floor(Date.now() / 1000)
    });
  }

  if (settings.autoCheckUpdates !== false) {
    setTimeout(() => {
      updateManager.checkForUpdates().catch((e) => console.log('[Main] Auto-update check note:', e));
    }, 4000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      trayManager.showWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (trayManager.isAppQuitting()) {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});

function setupIpcHandlers() {
  // --- Window Controls ---
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() || false);

  // --- Instances ---
  ipcMain.handle('instances:list', async () => instanceManager.listInstances());
  ipcMain.handle('instances:get', async (_, id: string) => instanceManager.getInstance(id));
  ipcMain.handle('instances:create', async (_, options) => {
    const inst = await instanceManager.createInstance(options);
    achievementsManager.unlock('first_launch');
    return inst;
  });
  ipcMain.handle('instances:update', async (_, inst) => instanceManager.updateInstance(inst));
  ipcMain.handle('instances:delete', async (_, id) => instanceManager.deleteInstance(id));
  ipcMain.handle('instances:clone', async (_, id, newName) => instanceManager.cloneInstance(id, newName));
  ipcMain.handle('instances:toggleFavorite', async (_, id: string) => instanceManager.toggleFavorite(id));
  ipcMain.handle('instances:getMods', async (_, id) => instanceManager.getMods(id));
  ipcMain.handle('instances:importFiles', async (_, id: string, subDir: string, filePaths: string[]) => {
    return instanceManager.importFiles(id, subDir, filePaths);
  });

  ipcMain.handle('instances:toggleMod', async (_, id, filename, enabled) => instanceManager.toggleMod(id, filename, enabled));
  ipcMain.handle('instances:deleteMod', async (_, id, filename) => instanceManager.deleteMod(id, filename));
  ipcMain.handle('instances:getResourcePacks', async (_, id) => instanceManager.getResourcePacks(id));
  ipcMain.handle('instances:toggleResourcePack', async (_, id, filename, enabled) => instanceManager.toggleResourcePack(id, filename, enabled));
  ipcMain.handle('instances:deleteResourcePack', async (_, id, filename) => instanceManager.deleteResourcePack(id, filename));
  ipcMain.handle('instances:getShaderPacks', async (_, id) => instanceManager.getShaderPacks(id));
  ipcMain.handle('instances:toggleShaderPack', async (_, id, filename, enabled) => instanceManager.toggleShaderPack(id, filename, enabled));
  ipcMain.handle('instances:deleteShaderPack', async (_, id, filename) => instanceManager.deleteShaderPack(id, filename));
  ipcMain.handle('shell:openExternal', async (_, url: string) => {
    if (url && typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
      return true;
    }
    return false;
  });
  ipcMain.handle('instances:getWorldSaves', async (_, id) => instanceManager.getWorldSaves(id));
  ipcMain.handle('instances:openFolder', async (_, id, subDir?: string) => {
    const instPath = instanceManager.getInstancePath(id);
    const target = subDir ? path.join(instPath, subDir) : instPath;
    fs.mkdirSync(target, { recursive: true });
    shell.openPath(target);
  });
  ipcMain.handle('instances:createWorldBackup', async (_, id: string, worldFolderName: string) => {
    return instanceManager.createWorldBackup(id, worldFolderName);
  });
  ipcMain.handle('instances:listWorldBackups', async (_, id: string) => {
    return instanceManager.listWorldBackups(id);
  });
  ipcMain.handle('instances:restoreWorldBackup', async (_, id: string, backupFilename: string) => {
    return instanceManager.restoreWorldBackup(id, backupFilename);
  });
  ipcMain.handle('instances:deleteWorldBackup', async (_, id: string, backupFilename: string) => {
    return instanceManager.deleteWorldBackup(id, backupFilename);
  });
  ipcMain.handle('instances:importLocalModpack', async (_, filePath: string, customName?: string) => {
    return instanceManager.importLocalModpack(filePath, customName);
  });
  ipcMain.handle('instances:generateShareCode', async (_, id: string) => {
    return instanceManager.generateShareCode(id);
  });
  ipcMain.handle('instances:importFromShareCode', async (_, codeOrPayload: string, customName?: string) => {
    const inst = await instanceManager.importFromShareCode(codeOrPayload, customName);
    achievementsManager.unlock('first_launch');
    return inst;
  });

  // --- Minecraft Versions & Loaders ---
  ipcMain.handle('versions:getMojang', async () => MinecraftLauncher.getMojangVersions());
  ipcMain.handle('versions:getFabric', async (_, gameVersion: string) => MinecraftLauncher.getFabricLoaderVersions(gameVersion));
  ipcMain.handle('versions:getQuilt', async (_, gameVersion: string) => MinecraftLauncher.getQuiltLoaderVersions(gameVersion));

  // --- Accounts ---
  ipcMain.handle('accounts:list', async () => accountsManager.getAccounts());
  ipcMain.handle('accounts:getActive', async () => accountsManager.getActiveAccount());
  ipcMain.handle('accounts:setActive', async (_, id: string) => {
    const acc = accountsManager.setActiveAccount(id);
    achievementsManager.switchAccount(acc?.id || null);
    return acc;
  });
  ipcMain.handle('accounts:createOffline', async (_, username: string, skinUrl?: string, modelType?: any) => {
    const acc = accountsManager.createOfflineAccount(username, skinUrl, modelType);
    if (acc.isActive) {
      achievementsManager.switchAccount(acc.id);
    }
    return acc;
  });
  ipcMain.handle('accounts:addMicrosoft', async (_, data) => {
    const acc = accountsManager.addMicrosoftAccount(data);
    if (acc.isActive) {
      achievementsManager.switchAccount(acc.id);
    }
    return acc;
  });
  ipcMain.handle('accounts:verifyOfficial', async (_, usernameOrGamertag: string) => {
    return AccountsManager.verifyOfficialMinecraftAccount(usernameOrGamertag);
  });
  ipcMain.handle('accounts:remove', async (_, id: string) => {
    const res = accountsManager.removeAccount(id);
    const activeAcc = accountsManager.getActiveAccount();
    achievementsManager.switchAccount(activeAcc?.id || null);
    return res;
  });
  ipcMain.handle('accounts:updateSkin', async (_, id: string, skinUrl: string, modelType?: any) => {
    return accountsManager.updateSkin(id, skinUrl, modelType);
  });
  ipcMain.handle('accounts:updateCosmetics', async (_, id: string, cosmetics: any) => {
    return accountsManager.updateCosmetics(id, cosmetics);
  });

  // --- Java Detection & Auto-Downloader ---
  ipcMain.handle('java:detectAll', async () => {
    const runtimesDir = path.join(app.getPath('userData'), 'runtimes');
    return JavaDetector.detectAllJava(runtimesDir);
  });
  ipcMain.handle('java:probe', async (_, javaPath: string) => JavaDetector.probeJava(javaPath));
  ipcMain.handle('java:download', async (_, majorVersion = 21) => {
    const runtimesDir = path.join(app.getPath('userData'), 'runtimes');
    const installed = await JavaDetector.downloadAdoptiumJava(runtimesDir, majorVersion, (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('java:downloadProgress', data);
      }
    });

    try {
      const currentSettings = getSavedSettings();
      saveSettingsSync({ ...currentSettings, defaultJavaPath: installed.path });
    } catch {}

    return installed;
  });
  ipcMain.handle('java:checkSetup', async () => {
    const runtimesDir = path.join(app.getPath('userData'), 'runtimes');
    const javaList = await JavaDetector.detectAllJava(runtimesDir);
    const instancesList = await instanceManager.listInstances();
    return {
      hasJava: javaList.length > 0,
      javaCount: javaList.length,
      instancesCount: instancesList.length
    };
  });

  // --- Launch & Game Execution ---
  ipcMain.handle('game:launch', async (_, instanceId: string) => {
    const instance = await instanceManager.getInstance(instanceId);
    if (!instance) throw new Error('Instance not found');
    const account = accountsManager.getActiveAccount();
    if (!account) throw new Error('No active account selected. Please select or add an account.');

    if (!mainWindow) throw new Error('Main window not available');

    const settings = getSavedSettings();
    if (settings.discordRpc !== false) {
      discordRpc.setActivity({
        details: `Playing ${instance.name}`,
        state: `Minecraft ${instance.version} • ${instance.loader.toUpperCase()}`,
        startTimestamp: Math.floor(Date.now() / 1000)
      });
    }

    // Secret Achievement Triggers
    if (Date.now() - appStartupTime <= 5000) {
      achievementsManager.unlock('secret_speedrunner');
    }
    const currentHour = new Date().getHours();
    if (currentHour >= 1 && currentHour <= 4) {
      achievementsManager.unlock('secret_night_owl');
    }
    if (instance.memoryMax >= 12288) {
      achievementsManager.unlock('secret_ram_titan');
    }

    // Record instance launch and social activity
    await instanceManager.recordLaunch(instanceId);
    cloudService.setPlayerActivity('in-game', {
      instanceName: instance.name,
      gameVersion: instance.version,
      statusMessage: `Playing ${instance.name}`
    });

    return minecraftLauncher.launch(
      instance,
      account,
      instanceManager,
      mainWindow,
      (progress) => {
        mainWindow?.webContents.send('game:launch-progress', progress);
      },
      (log) => {
        mainWindow?.webContents.send('game:log', log);
      },
      () => {
        cloudService.setPlayerActivity('online', { statusMessage: 'In Launcher Menu' });
        const s = getSavedSettings();
        if (s.discordRpc !== false) {
          discordRpc.setActivity({
            details: 'Exploring Cosmic Universe',
            state: 'In Launcher Menu'
          });
        }
      }
    );
  });

  ipcMain.handle('game:kill', async (_, instanceId: string) => {
    cloudService.setPlayerActivity('online', { statusMessage: 'In Launcher Menu' });
    const settings = getSavedSettings();

    if (settings.discordRpc !== false) {
      discordRpc.setActivity({
        details: 'Exploring Cosmic Universe',
        state: 'In Launcher Menu'
      });
    } else {
      discordRpc.clearActivity();
    }
    const res = minecraftLauncher.killInstance(instanceId);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('game:stopped', {
        instanceId,
        code: 0
      });
    }
    return res;
  });

  ipcMain.handle('game:isRunning', async (_, instanceId: string) => {
    return minecraftLauncher.isInstanceRunning(instanceId);
  });

  ipcMain.handle('game:analyzeCrash', async (_, logs: any[]) => {
    return MinecraftLauncher.analyzeCrashLog(logs);
  });

  // --- Instance Health Checkup & Diagnostics ---
  ipcMain.handle('health:check', async (_, instanceId: string) => {
    return healthCheckService.analyzeInstanceHealth(instanceId);
  });
  ipcMain.handle('health:updateMod', async (_, instanceId: string, oldFileName: string, newDownloadUrl: string, newFileName: string, sha1?: string) => {
    return healthCheckService.updateMod(instanceId, oldFileName, newDownloadUrl, newFileName, sha1);
  });
  ipcMain.handle('health:updateAllMods', async (_, instanceId: string, updates: any[]) => {
    return healthCheckService.updateAllMods(instanceId, updates);
  });
  ipcMain.handle('health:disableMod', async (_, instanceId: string, fileName: string) => {
    return healthCheckService.disableMod(instanceId, fileName);
  });
  ipcMain.handle('health:deleteMod', async (_, instanceId: string, fileName: string) => {
    return healthCheckService.deleteMod(instanceId, fileName);
  });
  ipcMain.handle('health:installDependency', async (_, instanceId: string, dependencySlug: string) => {
    return healthCheckService.installMissingDependency(instanceId, dependencySlug);
  });
  ipcMain.handle('health:optimizeRam', async (_, instanceId: string, recommendedMaxMb: number) => {
    return healthCheckService.optimizeInstanceRam(instanceId, recommendedMaxMb);
  });

  // --- Marketplace ---
  ipcMain.handle('marketplace:search', async (_, params) => {
    return MarketplaceService.searchProjects(params);
  });

  ipcMain.handle('marketplace:getProject', async (_, idOrSlug: string) => {
    return MarketplaceService.getProjectDetails(idOrSlug);
  });

  ipcMain.handle('marketplace:getVersions', async (_, idOrSlug: string, loaders?: string[], gameVersions?: string[]) => {
    return MarketplaceService.getProjectVersions(idOrSlug, loaders, gameVersions);
  });

  ipcMain.handle('marketplace:getVersionById', async (_, versionId: string) => {
    return MarketplaceService.getVersionById(versionId);
  });

  ipcMain.handle('marketplace:installItem', async (_, instanceId: string, projectType: any, downloadUrl: string, filename: string, sha1?: string) => {
    const res = await MarketplaceService.installItemToInstance(
      instanceManager,
      instanceId,
      projectType,
      downloadUrl,
      filename,
      sha1,
      (bytes, total) => {
        mainWindow?.webContents.send('marketplace:download-progress', { filename, bytes, total });
      }
    );
    achievementsManager.unlock('modder');
    return res;
  });

  ipcMain.handle('marketplace:installWithDependencies', async (
    _,
    instanceId: string,
    downloadUrl: string,
    filename: string,
    sha1: string | undefined,
    dependencies: any[] | undefined,
    loader: string,
    gameVersion: string
  ) => {
    const res = await MarketplaceService.installModWithDependencies(
      instanceManager,
      instanceId,
      downloadUrl,
      filename,
      sha1,
      dependencies,
      loader,
      gameVersion,
      (currentFilename, bytes, total) => {
        mainWindow?.webContents.send('marketplace:download-progress', { filename: currentFilename, bytes, total });
      }
    );
    achievementsManager.unlock('modder');
    return res;
  });

  ipcMain.handle('marketplace:installModpack', async (_, mrpackUrl: string, modpackName: string) => {
    const res = await MarketplaceService.installModpack(instanceManager, mrpackUrl, modpackName, (completed, total, item) => {
      mainWindow?.webContents.send('marketplace:modpack-progress', { completed, total, item });
    });
    achievementsManager.unlock('modder');
    return res;
  });

  // --- Achievements & Progression ---
  let soundTestCount = 0;
  const sessionThemes = new Set<string>();

  ipcMain.handle('achievements:list', async () => achievementsManager.getAchievements());
  ipcMain.handle('achievements:getStats', async () => achievementsManager.getStats());
  ipcMain.handle('achievements:unlock', async (_, id: string) => achievementsManager.unlock(id));
  ipcMain.handle('achievements:reset', async () => achievementsManager.resetAll());
  ipcMain.handle('achievements:testSound', async () => {
    soundTestCount++;
    if (soundTestCount >= 10) {
      achievementsManager.unlock('secret_audiophile');
    }
    return soundTestCount;
  });
  let previousTheme: string | null = null;
  ipcMain.handle('achievements:themeChanged', async (_, themeName: string) => {
    if (!previousTheme) {
      previousTheme = getSavedSettings().theme || 'deep-void';
    }
    if (themeName && themeName !== previousTheme) {
      previousTheme = themeName;
      achievementsManager.unlock('theme_change');
      sessionThemes.add(themeName);
      if (sessionThemes.size >= 6) {
        achievementsManager.unlock('secret_eclipse');
      }
    }
  });

  // --- Screenshots Gallery ---
  ipcMain.handle('screenshots:getAll', async () => {
    const list = await screenshotsManager.getAllScreenshots();
    if (list.length >= 25) {
      achievementsManager.unlock('secret_archivist');
    }
    return list;
  });
  ipcMain.handle('screenshots:getByInstance', async (_, instanceId: string) => {
    return screenshotsManager.getScreenshotsByInstance(instanceId);
  });
  ipcMain.handle('screenshots:delete', async (_, filePath: string) => {
    return screenshotsManager.deleteScreenshot(filePath);
  });
  ipcMain.handle('screenshots:openFolder', async (_, filePath?: string) => {
    return screenshotsManager.openInFolder(filePath);
  });
  ipcMain.handle('screenshots:copyToClipboard', async (_, filePath: string) => {
    return screenshotsManager.copyToClipboard(filePath);
  });
  ipcMain.handle('screenshots:getBase64', async (_, filePath: string) => {
    return screenshotsManager.getBase64Image(filePath);
  });

  // --- System Tray ---
  ipcMain.handle('tray:toggle', () => trayManager.toggleWindow());
  ipcMain.handle('tray:show', () => trayManager.showWindow());
  ipcMain.handle('tray:hide', () => trayManager.hideWindow());

  // --- Galaxy Cloud & Cross-Device Sync ---
  ipcMain.handle('cloud:getState', async () => cloudService.getState());
  ipcMain.handle('cloud:toggle', async (_, enabled: boolean) => {
    const st = cloudService.toggleCloud(enabled);
    if (enabled) {
      achievementsManager.unlock('into_clouds');
    }
    return st;
  });
  ipcMain.handle('cloud:syncAll', async () => cloudService.syncAll());
  ipcMain.handle('cloud:backupInstance', async (_, instanceId: string) => cloudService.backupInstance(instanceId));
  ipcMain.handle('cloud:restoreInstance', async (_, cloudInstanceId: string) => cloudService.restoreInstance(cloudInstanceId));
  ipcMain.handle('cloud:deleteInstance', async (_, cloudInstanceId: string) => cloudService.deleteCloudInstance(cloudInstanceId));

  // --- Galaxy Friends & Social Network ---
  ipcMain.handle('friends:list', async () => cloudService.getFriends());
  ipcMain.handle('friends:add', async (_, usernameOrTag: string) => {
    const friend = cloudService.addFriend(usernameOrTag);
    if (friend) {
      achievementsManager.unlock('first_friend');
    }
    return friend;
  });
  ipcMain.handle('friends:remove', async (_, friendId: string) => cloudService.removeFriend(friendId));
  ipcMain.handle('friends:toggleFavorite', async (_, friendId: string) => cloudService.toggleFavoriteFriend(friendId));

  // --- Social Profile & Friend Requests ---
  ipcMain.handle('social:getProfile', async () => cloudService.getUserProfile());
  ipcMain.handle('social:updateProfile', async (_, data) => cloudService.updateUserProfile(data));
  ipcMain.handle('social:getRequests', async () => cloudService.getFriendRequests());
  ipcMain.handle('social:sendRequest', async (_, tag: string) => cloudService.sendFriendRequest(tag));
  ipcMain.handle('social:acceptRequest', async (_, id: string) => {
    const friend = cloudService.acceptFriendRequest(id);
    if (friend) {
      achievementsManager.unlock('first_friend');
    }
    return friend;
  });
  ipcMain.handle('social:declineRequest', async (_, id: string) => cloudService.declineFriendRequest(id));
  ipcMain.handle('social:getStats', async () => cloudService.getGlobalStats(achievementsManager));

  // --- System Hardware Specifications ---

  ipcMain.handle('system:getSpecs', async () => {
    try {
      const totalMemBytes = os.totalmem();
      const freeMemBytes = os.freemem();
      const totalMemoryMb = Math.round(totalMemBytes / (1024 * 1024));
      const freeMemoryMb = Math.round(freeMemBytes / (1024 * 1024));
      const cpus = os.cpus() || [];
      const cpuModel = cpus[0]?.model ? cpus[0].model.trim().replace(/\s+/g, ' ') : 'Multi-Core Processor';
      const cpuCores = cpus.length;
      const cpuSpeedMhz = cpus[0]?.speed || 0;

      // Smart recommended RAM calculation:
      // 32GB+ -> 6144 MB (Modpacks & extreme shaders without GC overhead)
      // 16GB - 31GB -> 4096 MB (Standard safe sweet-spot for Minecraft)
      // 8GB - 15GB -> 4096 MB
      // 4GB - 7GB -> 2048 MB
      // <4GB -> 1536 MB
      let recommendedRamMb = 4096;
      if (totalMemoryMb >= 24000) {
        recommendedRamMb = 6144;
      } else if (totalMemoryMb >= 7500) {
        recommendedRamMb = 4096;
      } else if (totalMemoryMb >= 3500) {
        recommendedRamMb = 2048;
      } else {
        recommendedRamMb = 1536;
      }

      return {
        totalMemoryMb,
        freeMemoryMb,
        cpuModel,
        cpuCores,
        cpuSpeedMhz,
        platform: os.platform(),
        arch: os.arch(),
        recommendedRamMb,
        recommendedResolution: {
          width: 1920,
          height: 1080,
          label: '1080p (Full HD) • Recommended Standard'
        }
      };
    } catch (err) {
      console.error('[Main] Failed to query system specs:', err);
      return {
        totalMemoryMb: 8192,
        freeMemoryMb: 4096,
        cpuModel: 'Standard CPU',
        cpuCores: 4,
        platform: os.platform(),
        arch: os.arch(),
        recommendedRamMb: 4096,
        recommendedResolution: {
          width: 1920,
          height: 1080,
          label: '1080p (Full HD) • Recommended Standard'
        }
      };
    }
  });

  // --- Settings ---
  ipcMain.handle('settings:get', async () => getSavedSettings());
  ipcMain.handle('settings:save', async (_, settings: LauncherSettings) => {
    saveLauncherSettings(settings);
    if (settings.discordRpc === false) {
      discordRpc.clearActivity();
    } else {
      discordRpc.setActivity({
        details: 'Exploring Cosmic Universe',
        state: 'In Launcher Menu'
      });
    }
  });

  // --- Utilities & File Pickers ---
  ipcMain.handle('fs:selectDirectory', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory']
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return res.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('fs:selectFile', async (_, filters?: { name: string; extensions: string[] }[]) => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return res.filePaths[0];
    }
    return null;
  });

  ipcMain.handle('fs:selectMultipleFiles', async (_, filters?: { name: string; extensions: string[] }[]) => {
    if (!mainWindow) return [];
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    });
    if (!res.canceled && res.filePaths.length > 0) {
      return res.filePaths;
    }
    return [];
  });

  ipcMain.handle('fs:openLauncherDir', async () => {
    shell.openPath(launcherDir);
  });

  ipcMain.handle('fs:wipeAllData', async () => {
    try {
      if (fs.existsSync(launcherDir)) {
        fs.rmSync(launcherDir, { recursive: true, force: true });
      }
      fs.mkdirSync(launcherDir, { recursive: true });
      fs.mkdirSync(instancesDir, { recursive: true });
      return true;
    } catch (err) {
      console.error('Failed to wipe data:', err);
      return false;
    }
  });

  // --- Auto-Updater ---
  ipcMain.handle('updates:check', async () => updateManager.checkForUpdates());
  ipcMain.handle('updates:download', async () => updateManager.downloadUpdate());
  ipcMain.handle('updates:install', async () => updateManager.quitAndInstall());
  ipcMain.handle('updates:getStatus', async () => updateManager.getStatus());
  ipcMain.handle('app:getVersion', async () => updateManager.getAppVersion());
}
