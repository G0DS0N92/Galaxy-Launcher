import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { InstanceManager } from './instanceManager';
import { AccountsManager } from './accountsManager';
import { MinecraftLauncher } from './minecraftLauncher';
import { JavaDetector } from './javaDetector';
import { MarketplaceService } from './marketplaceService';
import { UpdateManager } from './updateManager';
import { LauncherSettings, ModLoader } from '../preload/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
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

function getSavedSettings(): LauncherSettings {
  const defaultSettings: LauncherSettings = {
    theme: 'nebula-purple',
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
    instancesDirectory: instancesDir
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

  mainWindow = new BrowserWindow({
    title: 'Galaxy Launcher',
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

  updateManager.setMainWindow(mainWindow);
}

app.whenReady().then(async () => {
  setupIpcHandlers();
  await createWindow();

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

  if (settings.autoCheckUpdates !== false) {
    setTimeout(() => {
      updateManager.checkForUpdates().catch((e) => console.log('[Main] Auto-update check note:', e));
    }, 4000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
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
  ipcMain.handle('instances:create', async (_, options) => instanceManager.createInstance(options));
  ipcMain.handle('instances:update', async (_, inst) => instanceManager.updateInstance(inst));
  ipcMain.handle('instances:delete', async (_, id) => instanceManager.deleteInstance(id));
  ipcMain.handle('instances:clone', async (_, id, newName) => instanceManager.cloneInstance(id, newName));
  ipcMain.handle('instances:getMods', async (_, id) => instanceManager.getMods(id));
  ipcMain.handle('instances:toggleMod', async (_, id, filename, enabled) => instanceManager.toggleMod(id, filename, enabled));
  ipcMain.handle('instances:deleteMod', async (_, id, filename) => instanceManager.deleteMod(id, filename));
  ipcMain.handle('instances:getResourcePacks', async (_, id) => instanceManager.getResourcePacks(id));
  ipcMain.handle('instances:getShaderPacks', async (_, id) => instanceManager.getShaderPacks(id));
  ipcMain.handle('instances:getWorldSaves', async (_, id) => instanceManager.getWorldSaves(id));
  ipcMain.handle('instances:openFolder', async (_, id, subDir?: string) => {
    const instPath = instanceManager.getInstancePath(id);
    const target = subDir ? path.join(instPath, subDir) : instPath;
    fs.mkdirSync(target, { recursive: true });
    shell.openPath(target);
  });

  // --- Minecraft Versions & Loaders ---
  ipcMain.handle('versions:getMojang', async () => MinecraftLauncher.getMojangVersions());
  ipcMain.handle('versions:getFabric', async (_, gameVersion: string) => MinecraftLauncher.getFabricLoaderVersions(gameVersion));
  ipcMain.handle('versions:getQuilt', async (_, gameVersion: string) => MinecraftLauncher.getQuiltLoaderVersions(gameVersion));

  // --- Accounts ---
  ipcMain.handle('accounts:list', async () => accountsManager.getAccounts());
  ipcMain.handle('accounts:getActive', async () => accountsManager.getActiveAccount());
  ipcMain.handle('accounts:setActive', async (_, id: string) => accountsManager.setActiveAccount(id));
  ipcMain.handle('accounts:createOffline', async (_, username: string, skinUrl?: string, modelType?: any) => {
    return accountsManager.createOfflineAccount(username, skinUrl, modelType);
  });
  ipcMain.handle('accounts:addMicrosoft', async (_, accountData) => accountsManager.addMicrosoftAccount(accountData));
  ipcMain.handle('accounts:remove', async (_, id: string) => accountsManager.removeAccount(id));
  ipcMain.handle('accounts:updateSkin', async (_, id: string, skinUrl: string, modelType?: any) => {
    return accountsManager.updateAccountSkin(id, skinUrl, modelType);
  });

  // --- Java Runtime ---
  ipcMain.handle('java:detectAll', async () => JavaDetector.detectAllJava());
  ipcMain.handle('java:probe', async (_, javaPath: string) => JavaDetector.probeJava(javaPath));

  // --- Launch & Game Execution ---
  ipcMain.handle('game:launch', async (_, instanceId: string) => {
    const instance = await instanceManager.getInstance(instanceId);
    if (!instance) throw new Error('Instance not found');
    const account = accountsManager.getActiveAccount();
    if (!account) throw new Error('No active account selected. Please select or add an account.');

    if (!mainWindow) throw new Error('Main window not available');

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
      }
    );
  });

  ipcMain.handle('game:kill', async (_, instanceId: string) => {
    return minecraftLauncher.killInstance(instanceId);
  });

  ipcMain.handle('game:isRunning', async (_, instanceId: string) => {
    return minecraftLauncher.isInstanceRunning(instanceId);
  });

  ipcMain.handle('game:analyzeCrash', async (_, logs: any[]) => {
    return MinecraftLauncher.analyzeCrashLog(logs);
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

  ipcMain.handle('marketplace:installItem', async (_, instanceId: string, projectType: any, downloadUrl: string, filename: string, sha1?: string) => {
    return MarketplaceService.installItemToInstance(
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
  });

  ipcMain.handle('marketplace:installModpack', async (_, mrpackUrl: string, modpackName: string) => {
    return MarketplaceService.installModpack(instanceManager, mrpackUrl, modpackName, (completed, total, item) => {
      mainWindow?.webContents.send('marketplace:modpack-progress', { completed, total, item });
    });
  });

  // --- Settings ---
  ipcMain.handle('settings:get', async () => getSavedSettings());
  ipcMain.handle('settings:save', async (_, settings: LauncherSettings) => saveLauncherSettings(settings));

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
