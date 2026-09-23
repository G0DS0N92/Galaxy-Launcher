import { Tray, Menu, BrowserWindow, app, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback base64 16x16 cosmic purple/cyan icon
const EMBEDDED_TRAY_ICON_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJySURBVHgB7VdLaxRRFD73ztuZZCYzSSaTGSd5jMbYhCgoiKi4EFFw40oR/wAX/gR3rty6EPyD7gQXrkUURAXdgqAgqGB8xDiJ00zmMTPzepyd6SZmXpmXhKSL5rqq655zv3u+c0+9q6mqqk6qfE8e2btr+/LwR3+n3e3VlZ1tXlKkM3M6V1Z0fG+m8W8n38p3s3Pj292tY1VbT1ZqjQ/20eW3f4X818n9h57a55U5Z/R4Xv70kL+yP4sQG2K9F419409VwO+fP5w9bWd/L6R7DxfbO0Z1rnhhB43x9pL44t33v6dD4v294/s2L1l3KkL/507+2X08Z9+9yv7uVpWv4cZ7W2n37T5fJvI13L7PZzrfmJ1y3G3n7rSjf7fXqPjH43/L8Xw6nffgX7j6o1mS2X3m6Z3T6q471X8k7r5rG3Nnzb3n5+b6N8585489/4b5v+G+b+m8T3c7rT/u7e5O98v9+x0X1Z1eU3/vL2/f8xL+Q2d9eK5v9v4a3501vjtrfHfW+O6s8d1Z47uzxndnje/OGt+dNb47a3x31vjurPHdWeO7s8Z3Z43vzhrfnTW+O2t8d9b47qzx3Vnju7PGd2eN784a3501vjtrfHfW+O6s8d1Z47uzxndnje/OGt+dNb47a3x31vjurPHdWeO7s8Z3Z43vzhrfnTW+O2t8d9b47qzx3Vnju7PGd2eN784a3501vjtrfHfW+O6s8d1Z47uzxndnje/OGt+dNb47a3x31vjurPHdWeO7s8Z3Z43vzhrfnTW+O2t8d9b47qzx3Vnju7PGd2eN784a3501vjtrfHfW+O6s8d1Z47uzxndnje/OGt+dNb47a3x31vjurPHdWeO7s8Z3Z/0DXf8AgZ3p4WqXQ6sAAAAASUVORK5CYII=';

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;
  private onQuickLaunchCallback: (() => void) | null = null;
  private onCheckUpdatesCallback: (() => void) | null = null;

  constructor() {
    // Flag for app quit
    app.on('before-quit', () => {
      this.isQuitting = true;
    });
  }

  public init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
    this.createTray();
    this.setupWindowEvents();
  }

  public setQuickLaunchHandler(cb: () => void): void {
    this.onQuickLaunchCallback = cb;
  }

  public setCheckUpdatesHandler(cb: () => void): void {
    this.onCheckUpdatesCallback = cb;
  }

  private createTray(): void {
    if (this.tray) return;

    // Resolve icon path across possible production/dev runtime locations
    const candidatePaths = [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.ico'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'public', 'favicon.ico'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.png'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'public', 'icon.png'),
      path.join(app.getAppPath(), '..', 'app.asar.unpacked', 'build', 'icon.ico'),
      path.join(app.getAppPath(), 'build', 'icon.ico'),
      path.join(app.getAppPath(), 'public', 'favicon.ico'),
      path.join(app.getAppPath(), 'build', 'icon.png'),
      path.join(app.getAppPath(), 'public', 'icon.png'),
      path.join(process.resourcesPath, 'build', 'icon.ico'),
      path.join(process.resourcesPath, 'public', 'favicon.ico'),
      path.join(process.cwd(), 'build', 'icon.ico'),
      path.join(process.cwd(), 'public', 'favicon.ico'),
      path.join(process.cwd(), 'build', 'icon.png'),
      path.join(process.cwd(), 'public', 'icon.png'),
      path.join(__dirname, '../../build/icon.ico'),
      path.join(__dirname, '../../public/favicon.ico'),
      path.join(__dirname, '../../build/icon.png'),
      path.join(__dirname, '../../public/icon.png')
    ];

    let iconPath: string | null = null;
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        iconPath = p;
        break;
      }
    }

    try {
      let finalTrayPath: string | null = null;
      let finalNativeImage: nativeImage | null = null;

      if (iconPath) {
        try {
          const ext = path.extname(iconPath) || '.ico';
          const physicalExtractPath = path.join(app.getPath('userData'), `galaxy_tray${ext}`);
          const iconBuffer = fs.readFileSync(iconPath);
          fs.writeFileSync(physicalExtractPath, iconBuffer);
          finalTrayPath = physicalExtractPath;
        } catch {
          finalTrayPath = iconPath;
        }
      }

      if (finalTrayPath && fs.existsSync(finalTrayPath)) {
        try {
          if (finalTrayPath.endsWith('.ico')) {
            this.tray = new Tray(finalTrayPath);
          } else {
            const img = nativeImage.createFromPath(finalTrayPath);
            this.tray = new Tray(img.resize({ width: 16, height: 16 }));
          }
        } catch {
          const img = nativeImage.createFromPath(finalTrayPath);
          this.tray = new Tray(img.resize({ width: 16, height: 16 }));
        }
      } else {
        const trayIcon = nativeImage.createFromDataURL(EMBEDDED_TRAY_ICON_PNG);
        this.tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
      }

      if (this.tray) {
        this.tray.setToolTip('Galaxy Launcher');
        this.updateContextMenu();

        // Single click toggles launcher window
        this.tray.on('click', () => {
          this.toggleWindow();
        });

        // Double click always focuses window
        this.tray.on('double-click', () => {
          this.showWindow();
        });
      }
    } catch (err) {
      console.warn('[TrayManager] System tray initialization notice:', err);
    }
  }

  public updateContextMenu(): void {
    if (!this.tray) return;

    const isVisible = this.mainWindow && this.mainWindow.isVisible() && !this.mainWindow.isMinimized();

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `🌌 Galaxy Launcher v${app.getVersion() || '1.0.4'}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: isVisible ? '🪟 Minimize to Tray' : '🚀 Open Galaxy Launcher',
        click: () => {
          if (isVisible) {
            this.hideWindow();
          } else {
            this.showWindow();
          }
        }
      },
      {
        label: '🎮 Quick Launch Minecraft',
        click: () => {
          this.showWindow();
          if (this.onQuickLaunchCallback) {
            this.onQuickLaunchCallback();
          }
        }
      },
      {
        label: '🔄 Check for Updates...',
        click: () => {
          this.showWindow();
          if (this.onCheckUpdatesCallback) {
            this.onCheckUpdatesCallback();
          }
        }
      },
      { type: 'separator' },
      {
        label: '❌ Quit Galaxy Launcher',
        click: () => {
          this.isQuitting = true;
          this.destroy();
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.destroy();
          }
          app.quit();
          // Ensure zero background residual processes
          setTimeout(() => {
            app.exit(0);
          }, 100);
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private setupWindowEvents(): void {
    if (!this.mainWindow) return;

    // Update tray menu when window state changes
    this.mainWindow.on('show', () => this.updateContextMenu());
    this.mainWindow.on('hide', () => this.updateContextMenu());
    this.mainWindow.on('minimize', () => this.updateContextMenu());
    this.mainWindow.on('restore', () => this.updateContextMenu());
  }

  public showWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  public hideWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.hide();
    }
  }

  public toggleWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;
    if (this.mainWindow.isVisible() && !this.mainWindow.isMinimized()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  public isAppQuitting(): boolean {
    return this.isQuitting;
  }

  public setAppQuitting(quitting: boolean): void {
    this.isQuitting = quitting;
  }

  public destroy(): void {
    if (this.tray) {
      try {
        this.tray.destroy();
      } catch {}
      this.tray = null;
    }
  }
}

