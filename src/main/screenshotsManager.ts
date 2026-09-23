import fs from 'fs';
import path from 'path';
import { shell, clipboard, nativeImage } from 'electron';
import { InstanceManager } from './instanceManager';
import { ScreenshotItem } from '../preload/types';

export class ScreenshotsManager {
  private instanceManager: InstanceManager;
  private launcherDir: string;

  constructor(launcherDir: string, instanceManager: InstanceManager) {
    this.launcherDir = launcherDir;
    this.instanceManager = instanceManager;
  }

  /**
   * Scans all instances and global folder for Minecraft screenshots
   */
  public async getAllScreenshots(): Promise<ScreenshotItem[]> {
    const results: ScreenshotItem[] = [];
    const instances = await this.instanceManager.listInstances();

    // 1. Scan instance folders
    for (const inst of instances) {
      const instPath = this.instanceManager.getInstancePath(inst.id);
      const possibleDirs = [
        path.join(instPath, '.minecraft', 'screenshots'),
        path.join(instPath, 'screenshots')
      ];

      for (const dir of possibleDirs) {
        if (fs.existsSync(dir)) {
          try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              if (/\.(png|jpg|jpeg|webp)$/i.test(file)) {
                const fullPath = path.join(dir, file);
                try {
                  const stat = fs.statSync(fullPath);
                  results.push({
                    id: `${inst.id}_${file}`,
                    filename: file,
                    filePath: fullPath,
                    instanceId: inst.id,
                    instanceName: inst.name,
                    createdAt: stat.birthtime.toISOString() || stat.mtime.toISOString(),
                    sizeBytes: stat.size,
                    previewUrl: `galaxy-file://${encodeURIComponent(fullPath.replace(/\\/g, '/'))}`
                  });
                } catch {
                  // ignore unreadable file
                }
              }
            }
          } catch (err) {
            console.warn(`[ScreenshotsManager] Error reading dir ${dir}:`, err);
          }
        }
      }
    }

    // 2. Scan global launcher screenshots folder
    const globalScreenshotsDir = path.join(this.launcherDir, 'screenshots');
    if (fs.existsSync(globalScreenshotsDir)) {
      try {
        const files = fs.readdirSync(globalScreenshotsDir);
        for (const file of files) {
          if (/\.(png|jpg|jpeg|webp)$/i.test(file)) {
            const fullPath = path.join(globalScreenshotsDir, file);
            try {
              const stat = fs.statSync(fullPath);
              results.push({
                id: `global_${file}`,
                filename: file,
                filePath: fullPath,
                instanceId: 'global',
                instanceName: 'Global Gallery',
                createdAt: stat.birthtime.toISOString() || stat.mtime.toISOString(),
                sizeBytes: stat.size,
                previewUrl: `galaxy-file://${encodeURIComponent(fullPath.replace(/\\/g, '/'))}`
              });
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.warn('[ScreenshotsManager] Error reading global screenshots dir:', err);
      }
    }

    // Sort newest first
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Scans screenshots for a specific instance
   */
  public async getScreenshotsByInstance(instanceId: string): Promise<ScreenshotItem[]> {
    const all = await this.getAllScreenshots();
    return all.filter((s) => s.instanceId === instanceId);
  }

  /**
   * Deletes a screenshot file
   */
  public async deleteScreenshot(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (err) {
      console.error('[ScreenshotsManager] Failed to delete screenshot:', err);
    }
    return false;
  }

  /**
   * Opens the file in the OS file explorer
   */
  public async openInFolder(filePath?: string): Promise<void> {
    try {
      if (filePath && fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath);
      } else {
        const defaultDir = path.join(this.launcherDir, 'screenshots');
        fs.mkdirSync(defaultDir, { recursive: true });
        shell.openPath(defaultDir);
      }
    } catch (err) {
      console.error('[ScreenshotsManager] Failed to open folder:', err);
    }
  }

  /**
   * Copies the image to system clipboard
   */
  public async copyToClipboard(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        const image = nativeImage.createFromPath(filePath);
        if (!image.isEmpty()) {
          clipboard.writeImage(image);
          return true;
        }
      }
    } catch (err) {
      console.error('[ScreenshotsManager] Failed to copy to clipboard:', err);
    }
    return false;
  }

  /**
   * Reads raw base64 data for an image file
   */
  public getBase64Image(filePath: string): string | null {
    try {
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
    } catch (err) {
      console.error('[ScreenshotsManager] Failed to read base64 image:', err);
    }
    return null;
  }
}
