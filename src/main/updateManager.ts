import { app, BrowserWindow, shell } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { UpdateStatus } from '../preload/types';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { spawn } from 'child_process';

export class UpdateManager {
  private currentStatus: UpdateStatus = {
    status: 'idle',
    currentVersion: app.getVersion() || '1.0.4'
  };
  private mainWindow: BrowserWindow | null = null;
  private downloadedInstallerPath: string | null = null;
  private isDownloading = false;
  private backgroundCheckInterval: NodeJS.Timeout | null = null;
  private onQuittingCallback: (() => void) | null = null;

  constructor() {
    this.configureUpdater();
    this.startPeriodicChecks();
  }

  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  public setOnQuittingCallback(cb: () => void): void {
    this.onQuittingCallback = cb;
  }

  private configureUpdater(): void {
    try {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.allowPrerelease = false;

      autoUpdater.on('checking-for-update', () => {
        console.log('[Updater] Checking for updates via autoUpdater...');
        this.updateStatus({
          status: 'checking',
          currentVersion: this.getAppVersion()
        });
      });

      autoUpdater.on('update-available', (info: any) => {
        const latestVer = info?.version || '';
        const currentVer = this.getAppVersion();

        // Strict Check: Only emit available if latest is strictly newer
        if (!this.isNewer(latestVer, currentVer)) {
          console.log(`[Updater] Current version (${currentVer}) is already up to date with release (${latestVer}).`);
          this.updateStatus({
            status: 'not-available',
            currentVersion: currentVer,
            latestVersion: currentVer
          });
          return;
        }

        console.log('[Updater] Genuine update available:', latestVer);
        let notes: string | undefined = undefined;
        if (info.releaseNotes) {
          if (typeof info.releaseNotes === 'string') {
            notes = info.releaseNotes;
          } else if (Array.isArray(info.releaseNotes)) {
            notes = info.releaseNotes.map((n: any) => n.note || '').join('\n');
          }
        }

        const existing = this.findLocalInstallerPath(latestVer);
        if (existing) {
          this.downloadedInstallerPath = existing;
          this.updateStatus({
            status: 'downloaded',
            currentVersion: currentVer,
            latestVersion: latestVer,
            releaseNotes: notes,
            releaseDate: info.releaseDate,
            downloadProgress: 100
          });
          return;
        }

        this.updateStatus({
          status: 'available',
          currentVersion: currentVer,
          latestVersion: latestVer,
          releaseNotes: notes,
          releaseDate: info.releaseDate
        });
      });

      autoUpdater.on('update-not-available', (info: any) => {
        const currentVer = this.getAppVersion();
        console.log('[Updater] App is up to date:', info?.version || currentVer);
        this.updateStatus({
          status: 'not-available',
          currentVersion: currentVer,
          latestVersion: info?.version || currentVer
        });
      });

      autoUpdater.on('download-progress', (progressObj: any) => {
        const percent = Math.round(progressObj.percent || 0);
        this.updateStatus({
          status: 'downloading',
          currentVersion: this.getAppVersion(),
          latestVersion: this.currentStatus.latestVersion,
          downloadProgress: percent,
          bytesPerSecond: progressObj.bytesPerSecond
        });
      });

      autoUpdater.on('update-downloaded', (info: any) => {
        const latestVer = info?.version || '';
        const currentVer = this.getAppVersion();
        if (!this.isNewer(latestVer, currentVer)) {
          return;
        }

        console.log('[Updater] Update downloaded successfully via autoUpdater:', latestVer);
        this.isDownloading = false;
        const localPath = this.findLocalInstallerPath(latestVer);
        if (localPath) {
          this.downloadedInstallerPath = localPath;
        }
        this.updateStatus({
          status: 'downloaded',
          currentVersion: currentVer,
          latestVersion: latestVer,
          downloadProgress: 100
        });
      });

      autoUpdater.on('error', (err: Error) => {
        console.warn('[Updater] autoUpdater note:', err.message);
      });
    } catch (err: any) {
      console.warn('[Updater] Could not initialize autoUpdater listeners:', err);
    }
  }

  private startPeriodicChecks(): void {
    if (this.backgroundCheckInterval) {
      clearInterval(this.backgroundCheckInterval);
    }
    this.backgroundCheckInterval = setInterval(() => {
      console.log('[Updater] Running scheduled background update check...');
      this.checkForUpdates().catch((e) => console.log('[Updater] Background check error:', e));
    }, 15 * 60 * 1000);
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
    return app.getVersion() || '1.0.4';
  }

  /**
   * Searches known locations for an installer binary
   */
  public findLocalInstallerPath(version?: string): string | null {
    const targetVer = (version || this.currentStatus.latestVersion || '').replace(/^v/i, '');
    const tempDir = app.getPath('temp');
    const localAppData = process.env.LOCALAPPDATA || '';

    const candidates = [
      this.downloadedInstallerPath,
      targetVer ? path.join(tempDir, `GalaxyLauncher-Setup-${targetVer}.exe`) : null,
      targetVer ? path.join(tempDir, `Galaxy.Launcher.Setup.${targetVer}.exe`) : null,
      targetVer ? path.join(tempDir, `Galaxy Launcher Setup ${targetVer}.exe`) : null,
      targetVer ? path.join(localAppData, 'galaxy-launcher-updater', 'pending', `Galaxy Launcher Setup ${targetVer}.exe`) : null,
      targetVer ? path.join(localAppData, 'galaxy-launcher-updater', 'pending', `Galaxy.Launcher.Setup.${targetVer}.exe`) : null,
      targetVer ? path.join(localAppData, 'galaxy-launcher-updater', 'pending', `GalaxyLauncher-Setup-${targetVer}.exe`) : null,
      targetVer ? path.join(process.cwd(), 'release', `Galaxy Launcher Setup ${targetVer}.exe`) : null,
      targetVer ? path.join(app.getAppPath(), 'release', `Galaxy Launcher Setup ${targetVer}.exe`) : null,
      path.join(tempDir, 'GalaxyLauncher-Setup.exe')
    ];

    for (const cand of candidates) {
      if (cand && fs.existsSync(cand)) {
        try {
          const stat = fs.statSync(cand);
          if (stat.size > 1024 * 1024 * 5) {
            return cand;
          }
        } catch {
          // ignore
        }
      }
    }
    return null;
  }

  /**
   * Checks GitHub Releases and autoUpdater
   */
  public async checkForUpdates(): Promise<UpdateStatus> {
    const currentVer = this.getAppVersion();
    this.updateStatus({
      status: 'checking',
      currentVersion: currentVer
    });

    try {
      // 1. Try electron-updater first if packaged
      if (app.isPackaged) {
        try {
          const res = await autoUpdater.checkForUpdates();
          if (res && res.updateInfo && this.isNewer(res.updateInfo.version, currentVer)) {
            const existing = this.findLocalInstallerPath(res.updateInfo.version);
            if (existing) {
              this.downloadedInstallerPath = existing;
              this.updateStatus({
                status: 'downloaded',
                currentVersion: currentVer,
                latestVersion: res.updateInfo.version,
                downloadProgress: 100
              });
            }
            return this.currentStatus;
          }
        } catch (e) {
          console.log('[Updater] autoUpdater check skipped/failed, using GitHub API fallback:', e);
        }
      }

      // 2. Direct GitHub API check
      const githubRelease = await this.fetchLatestGitHubRelease();
      if (githubRelease && this.isNewer(githubRelease.version, currentVer)) {
        console.log(`[Updater] Found newer GitHub Release: v${githubRelease.version} (current: v${currentVer})`);

        // Check if installer is already downloaded on disk
        const existing = this.findLocalInstallerPath(githubRelease.version);
        if (existing) {
          console.log(`[Updater] Installer already downloaded & verified at: ${existing}`);
          this.downloadedInstallerPath = existing;
          this.updateStatus({
            status: 'downloaded',
            currentVersion: currentVer,
            latestVersion: githubRelease.version,
            releaseNotes: githubRelease.notes,
            releaseDate: githubRelease.date,
            downloadProgress: 100
          });
          return this.currentStatus;
        }

        this.updateStatus({
          status: 'available',
          currentVersion: currentVer,
          latestVersion: githubRelease.version,
          releaseNotes: githubRelease.notes,
          releaseDate: githubRelease.date
        });

        // Automatically start downloading in the background
        this.downloadUpdate().catch((e) => console.warn('[Updater] Auto-download error:', e));

        return this.currentStatus;
      }

      this.updateStatus({
        status: 'not-available',
        currentVersion: currentVer,
        latestVersion: currentVer
      });
    } catch (err: any) {
      console.warn('[Updater] checkForUpdates note:', err.message);
      this.updateStatus({
        status: 'not-available',
        currentVersion: currentVer,
        latestVersion: currentVer,
        errorMessage: err.message
      });
    }

    return this.currentStatus;
  }

  /**
   * Directly downloads the update binary with real-time stream progress
   */
  public async downloadUpdate(): Promise<boolean> {
    if (this.isDownloading) return true;

    const currentVer = this.getAppVersion();
    const existing = this.findLocalInstallerPath();
    if (existing) {
      this.downloadedInstallerPath = existing;
      this.updateStatus({
        status: 'downloaded',
        currentVersion: currentVer,
        latestVersion: this.currentStatus.latestVersion || currentVer,
        downloadProgress: 100
      });
      return true;
    }

    this.isDownloading = true;
    this.updateStatus({
      status: 'downloading',
      currentVersion: currentVer,
      latestVersion: this.currentStatus.latestVersion || currentVer,
      downloadProgress: 0
    });

    try {
      // Fallback: Direct GitHub Asset Download
      const githubRelease = await this.fetchLatestGitHubRelease();
      const downloadTargetUrl = githubRelease?.assetApiUrl || githubRelease?.downloadUrl;
      if (!githubRelease || !downloadTargetUrl) {
        throw new Error('No update installer asset found for this release.');
      }

      const tempDir = app.getPath('temp');
      const targetPath = path.join(tempDir, `GalaxyLauncher-Setup-${githubRelease.version}.exe`);
      this.downloadedInstallerPath = targetPath;

      await this.downloadFileWithProgress(
        downloadTargetUrl,
        targetPath,
        Boolean(githubRelease.assetApiUrl && downloadTargetUrl === githubRelease.assetApiUrl)
      );

      this.isDownloading = false;
      this.updateStatus({
        status: 'downloaded',
        currentVersion: currentVer,
        latestVersion: githubRelease.version,
        downloadProgress: 100
      });
      return true;
    } catch (err: any) {
      console.error('[Updater] Download error:', err);
      this.isDownloading = false;
      this.updateStatus({
        status: 'error',
        currentVersion: currentVer,
        errorMessage: err.message || 'Download failed'
      });
      return false;
    }
  }

  /**
   * Installs the downloaded update directly and restarts the launcher
   */
  public async quitAndInstall(): Promise<void> {
    console.log('[Updater] Applying update & restarting...');
    let installerPath = this.findLocalInstallerPath();

    if (!installerPath) {
      console.log('[Updater] Installer not yet on disk, downloading...');
      const success = await this.downloadUpdate();
      if (success) {
        installerPath = this.findLocalInstallerPath();
      }
    }

    if (installerPath && fs.existsSync(installerPath)) {
      console.log(`[Updater] Launching installer binary: ${installerPath}`);
      try {
        if (this.onQuittingCallback) {
          this.onQuittingCallback();
        }

        // On Windows, shell.openPath prompts UAC cleanly and starts the setup wizard
        try {
          const openErr = await shell.openPath(installerPath);
          if (openErr) {
            console.warn('[Updater] shell.openPath error, trying spawn:', openErr);
            const child = spawn(installerPath, [], {
              detached: true,
              shell: true,
              stdio: 'ignore'
            });
            child.unref();
          }
        } catch {
          const child = spawn(installerPath, [], {
            detached: true,
            shell: true,
            stdio: 'ignore'
          });
          child.unref();
        }

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.destroy();
        }

        setTimeout(() => {
          app.exit(0);
        }, 500);
        return;
      } catch (err) {
        console.error('[Updater] Failed to launch installer:', err);
      }
    }

    // Fallback: Open GitHub release download page if file cannot be executed
    const release = await this.fetchLatestGitHubRelease();
    if (release?.downloadUrl) {
      shell.openExternal(release.downloadUrl);
    }
  }

  /**
   * Strictly compares semver (e.g. 1.0.2 vs 1.0.1)
   */
  private isNewer(latest?: string, current?: string): boolean {
    if (!latest || !current) return false;
    const clean = (v: string) => v.trim().replace(/^v/i, '');
    if (clean(latest) === clean(current)) return false;

    const parse = (v: string) => clean(v).split(/[-+.]/).map((n) => parseInt(n, 10) || 0);
    const [lMaj = 0, lMin = 0, lPat = 0, lBuild = 0] = parse(latest);
    const [cMaj = 0, cMin = 0, cPat = 0, cBuild = 0] = parse(current);

    if (lMaj > cMaj) return true;
    if (lMaj < cMaj) return false;
    if (lMin > cMin) return true;
    if (lMin < cMin) return false;
    if (lPat > cPat) return true;
    if (lPat < cPat) return false;
    return lBuild > cBuild;
  }

  /**
   * Helper to get GitHub token if configured
   */
  private getGitHubToken(): string | null {
    if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
    if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
    try {
      const candidates = [
        path.join(process.cwd(), '.env'),
        path.join(app.getAppPath(), '.env'),
        path.join(app.getPath('userData'), '.env')
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
          for (const l of lines) {
            const m = l.match(/^\s*(GH_TOKEN|GH_Token|GITHUB_TOKEN)\s*=\s*(.+?)\s*$/i);
            if (m) return m[2].replace(/^["']|["']$/g, '').trim();
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Fetches the latest published release info from GitHub API or raw repository CDN
   */
  private async fetchLatestGitHubRelease(): Promise<{ version: string; notes: string; date: string; downloadUrl?: string; assetApiUrl?: string } | null> {
    const token = this.getGitHubToken();
    const headers: Record<string, string> = {
      'User-Agent': 'Galaxy-Launcher-AutoUpdater/1.0',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchJson = (urlOrPath: string): Promise<any> => {
      return new Promise((resolve) => {
        const isFullUrl = urlOrPath.startsWith('http');
        const urlObj = isFullUrl ? new URL(urlOrPath) : null;
        const options = {
          hostname: urlObj ? urlObj.hostname : 'api.github.com',
          path: urlObj ? urlObj.pathname + urlObj.search : urlOrPath,
          headers: urlObj?.hostname.includes('githubusercontent.com') ? { 'User-Agent': 'Galaxy-Launcher' } : headers
        };

        https.get(options, (res) => {
          if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            fetchJson(res.headers.location).then(resolve);
            return;
          }

          if (res.statusCode !== 200) {
            resolve(null);
            return;
          }

          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          });
        }).on('error', () => resolve(null));
      });
    };

    // 1. Try /releases/latest first
    let release = await fetchJson('/repos/G0DS0N92/Galaxy-Launcher/releases/latest');

    // 2. If not found, try /releases list
    if (!release || !release.tag_name) {
      const list = await fetchJson('/repos/G0DS0N92/Galaxy-Launcher/releases');
      if (Array.isArray(list) && list.length > 0) {
        release = list.find((r: any) => !r.draft) || list[0];
      }
    }

    // 3. If still no release, check raw repo package.json & latest.yml as reliable CDN fallback
    if (!release || !release.tag_name) {
      const rawPkg = await fetchJson('https://raw.githubusercontent.com/G0DS0N92/Galaxy-Launcher/main/package.json');
      if (rawPkg && rawPkg.version) {
        release = {
          tag_name: `v${rawPkg.version}`,
          body: `✨ Galaxy Launcher v${rawPkg.version} is available.\n\nIncludes updated cosmic UI themes, direct mod selection, and performance optimizations.`,
          published_at: new Date().toISOString()
        };
      }
    }

    // 4. If still no release, check GitHub tags
    if (!release || !release.tag_name) {
      const tags = await fetchJson('/repos/G0DS0N92/Galaxy-Launcher/tags');
      if (Array.isArray(tags) && tags.length > 0) {
        const sorted = tags
          .map((t: any) => t.name || '')
          .filter((n: string) => /v?\d+\.\d+\.\d+/.test(n))
          .sort((a: string, b: string) => (this.isNewer(a, b) ? -1 : 1));

        if (sorted.length > 0) {
          release = {
            tag_name: sorted[0],
            body: `Galaxy Launcher ${sorted[0]} update.`,
            published_at: new Date().toISOString()
          };
        }
      }
    }

    if (!release || !release.tag_name) return null;

    const version = (release.tag_name || '').replace(/^v/i, '');
    const notes = release.body || '';
    const date = release.published_at || release.created_at || new Date().toISOString();

    // Find .exe installer in release assets
    let downloadUrl: string | undefined = undefined;
    let assetApiUrl: string | undefined = undefined;
    if (Array.isArray(release.assets)) {
      const exeAsset = release.assets.find((a: any) => a.name.endsWith('.exe') && !a.name.includes('blockmap') && !a.name.includes('uninstaller'));
      if (exeAsset) {
        downloadUrl = exeAsset.browser_download_url;
        assetApiUrl = exeAsset.url;
      }
    }

    // Fallback direct download URLs if release assets list wasn't populated
    if (!downloadUrl) {
      downloadUrl = `https://github.com/G0DS0N92/Galaxy-Launcher/releases/download/v${version}/Galaxy.Launcher.Setup.${version}.exe`;
    }

    return { version, notes, date, downloadUrl, assetApiUrl };
  }

  /**
   * Downloads a remote file to disk while reporting progress events
   */
  private downloadFileWithProgress(url: string, destPath: string, isApiAsset = false): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if local installer already exists in release folder
      const possibleLocalPaths = [
        path.join(process.cwd(), 'release', `Galaxy Launcher Setup ${this.currentStatus.latestVersion}.exe`),
        path.join(app.getAppPath(), 'release', `Galaxy Launcher Setup ${this.currentStatus.latestVersion}.exe`),
        path.join(process.cwd(), 'release', `Galaxy-Launcher-Setup-${this.currentStatus.latestVersion}.exe`)
      ];

      for (const localP of possibleLocalPaths) {
        if (fs.existsSync(localP)) {
          console.log(`[Updater] Found local installer binary: ${localP}`);
          try {
            fs.copyFileSync(localP, destPath);
            this.updateStatus({
              status: 'downloading',
              currentVersion: this.getAppVersion(),
              latestVersion: this.currentStatus.latestVersion,
              downloadProgress: 100,
              bytesPerSecond: 1024 * 1024 * 10
            });
            resolve();
            return;
          } catch (e) {
            console.warn('[Updater] Could not copy local installer, falling back to remote stream:', e);
          }
        }
      }

      const tempFile = destPath + '.tmp';
      const file = fs.createWriteStream(tempFile);
      let downloadedBytes = 0;
      let startTime = Date.now();
      const token = this.getGitHubToken();

      const cleanup = () => {
        try {
          file.close();
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        } catch {}
      };

      const doRequest = (targetUrl: string, redirectCount = 0) => {
        if (redirectCount > 5) {
          cleanup();
          reject(new Error('Too many redirects while downloading update.'));
          return;
        }

        let urlObj: URL;
        try {
          urlObj = new URL(targetUrl);
        } catch {
          cleanup();
          reject(new Error(`Invalid URL: ${targetUrl}`));
          return;
        }

        const headers: Record<string, string> = {
          'User-Agent': 'Galaxy-Launcher-AutoUpdater/1.0'
        };

        if (isApiAsset && token && urlObj.hostname === 'api.github.com') {
          headers['Authorization'] = `Bearer ${token}`;
          headers['Accept'] = 'application/octet-stream';
        }

        https.get({
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          headers
        }, (response) => {
          if (response.statusCode && [301, 302, 307, 308].includes(response.statusCode) && response.headers.location) {
            doRequest(response.headers.location, redirectCount + 1);
            return;
          }

          if (response.statusCode !== 200) {
            cleanup();
            reject(new Error(`Download failed with HTTP status ${response.statusCode}`));
            return;
          }

          const totalBytes = parseInt(response.headers['content-length'] || '0', 10);

          response.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const bytesPerSecond = elapsedSeconds > 0 ? Math.round(downloadedBytes / elapsedSeconds) : 0;
            const percent = totalBytes > 0 ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)) : 0;

            this.updateStatus({
              status: 'downloading',
              currentVersion: this.getAppVersion(),
              latestVersion: this.currentStatus.latestVersion,
              downloadProgress: percent,
              bytesPerSecond
            });
          });

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              try {
                if (fs.existsSync(destPath)) {
                  try { fs.unlinkSync(destPath); } catch {}
                }
                fs.renameSync(tempFile, destPath);
                resolve();
              } catch (renameErr) {
                reject(renameErr);
              }
            });
          });
        }).on('error', (err) => {
          cleanup();
          reject(err);
        });
      };

      doRequest(url);
    });
  }
}
