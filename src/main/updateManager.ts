import { app, BrowserWindow } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { UpdateStatus } from '../preload/types';

export class UpdateManager {
  private currentStatus: UpdateStatus = {
    status: 'idle',
    currentVersion: app.getVersion() || '1.0.0'
  };
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.configureUpdater();
  }

  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  private configureUpdater(): void {
    try {
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.allowPrerelease = false;

      autoUpdater.on('checking-for-update', () => {
        console.log('[Updater] Checking for updates...');
        this.updateStatus({
          status: 'checking',
          currentVersion: app.getVersion() || '1.0.0'
        });
      });

      autoUpdater.on('update-available', (info: any) => {
        console.log('[Updater] Update available:', info.version);
        let notes: string | undefined = undefined;
        if (info.releaseNotes) {
          if (typeof info.releaseNotes === 'string') {
            notes = info.releaseNotes;
          } else if (Array.isArray(info.releaseNotes)) {
            notes = info.releaseNotes.map((n: any) => n.note || '').join('\n');
          }
        }

        this.updateStatus({
          status: 'available',
          currentVersion: app.getVersion() || '1.0.0',
          latestVersion: info.version,
          releaseNotes: notes,
          releaseDate: info.releaseDate
        });
      });

      autoUpdater.on('update-not-available', (info: any) => {
        console.log('[Updater] App is up to date:', info?.version);
        this.updateStatus({
          status: 'not-available',
          currentVersion: app.getVersion() || '1.0.0',
          latestVersion: info?.version || app.getVersion()
        });
      });

      autoUpdater.on('download-progress', (progressObj: any) => {
        const percent = Math.round(progressObj.percent || 0);
        console.log(`[Updater] Download progress: ${percent}%`);
        this.updateStatus({
          status: 'downloading',
          currentVersion: app.getVersion() || '1.0.0',
          latestVersion: this.currentStatus.latestVersion,
          downloadProgress: percent,
          bytesPerSecond: progressObj.bytesPerSecond
        });
      });

      autoUpdater.on('update-downloaded', (info: any) => {
        console.log('[Updater] Update downloaded:', info.version);
        this.updateStatus({
          status: 'downloaded',
          currentVersion: app.getVersion() || '1.0.0',
          latestVersion: info.version,
          downloadProgress: 100
        });
      });

      autoUpdater.on('error', (err: Error) => {
        console.warn('[Updater] Update check note / error:', err.message);
        // Do not crash the app on network/missing repo errors
        this.updateStatus({
          status: 'error',
          currentVersion: app.getVersion() || '1.0.0',
          errorMessage: err.message
        });
      });
    } catch (err: any) {
      console.warn('[Updater] Could not initialize autoUpdater listeners:', err);
    }
  }

  private updateStatus(newStatus: UpdateStatus): void {
    this.currentStatus = newStatus;
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update:status', this.currentStatus);
    }
  }

  public getStatus(): UpdateStatus {
    return this.currentStatus;
  }

  public getAppVersion(): string {
    return app.getVersion() || '1.0.0';
  }

  public async checkForUpdates(): Promise<UpdateStatus> {
    try {
      this.updateStatus({
        status: 'checking',
        currentVersion: app.getVersion() || '1.0.0'
      });

      const checkResult = await autoUpdater.checkForUpdates();
      if (!checkResult) {
        this.updateStatus({
          status: 'not-available',
          currentVersion: app.getVersion() || '1.0.0'
        });
      }
    } catch (err: any) {
      console.warn('[Updater] checkForUpdates encountered error:', err.message);
      this.updateStatus({
        status: 'not-available',
        currentVersion: app.getVersion() || '1.0.0',
        errorMessage: err.message
      });
    }
    return this.currentStatus;
  }

  public async downloadUpdate(): Promise<boolean> {
    try {
      this.updateStatus({
        status: 'downloading',
        currentVersion: app.getVersion() || '1.0.0',
        latestVersion: this.currentStatus.latestVersion,
        downloadProgress: 0
      });
      await autoUpdater.downloadUpdate();
      return true;
    } catch (err: any) {
      console.error('[Updater] Download error:', err);
      this.updateStatus({
        status: 'error',
        currentVersion: app.getVersion() || '1.0.0',
        errorMessage: err.message
      });
      return false;
    }
  }

  public quitAndInstall(): void {
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (err) {
      console.error('[Updater] Quit and install error:', err);
    }
  }
}
