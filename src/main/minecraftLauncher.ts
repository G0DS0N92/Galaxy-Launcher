import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { Downloader, DownloadTask } from './downloader';
import { JavaDetector } from './javaDetector';
import { Instance, Account, LogEntry, LaunchProgress, CrashReportAnalysis, MinecraftVersion } from '../preload/types';
import { InstanceManager } from './instanceManager';

export class MinecraftLauncher {
  private static readonly MOJANG_MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
  private static readonly FABRIC_META = 'https://meta.fabricmc.net/v2';
  private static readonly QUILT_META = 'https://meta.quiltmc.org/v3';

  private baseDir: string;
  private runningProcesses: Map<string, ChildProcess> = new Map();

  constructor(baseLauncherDir: string) {
    this.baseDir = baseLauncherDir;
  }

  public static async getMojangVersions(): Promise<MinecraftVersion[]> {
    try {
      const data = await Downloader.fetchJson<any>(this.MOJANG_MANIFEST);
      return (data.versions || []).map((v: any) => ({
        id: v.id,
        type: v.type,
        url: v.url,
        time: v.time,
        releaseTime: v.releaseTime
      }));
    } catch (err) {
      console.error('Failed to fetch Mojang versions:', err);
      return [];
    }
  }

  public static async getFabricLoaderVersions(gameVersion: string): Promise<string[]> {
    try {
      const data = await Downloader.fetchJson<any[]>(`${this.FABRIC_META}/versions/loader/${gameVersion}`);
      return data.map((d: any) => d.loader.version);
    } catch {
      return ['0.16.10', '0.16.9', '0.16.5', '0.15.11'];
    }
  }

  public static async getQuiltLoaderVersions(gameVersion: string): Promise<string[]> {
    try {
      const data = await Downloader.fetchJson<any[]>(`${this.QUILT_META}/versions/loader/${gameVersion}`);
      return data.map((d: any) => d.loader.version);
    } catch {
      return ['0.27.1-beta.1', '0.26.4', '0.25.0'];
    }
  }

  public isInstanceRunning(instanceId: string): boolean {
    return this.runningProcesses.has(instanceId);
  }

  public killInstance(instanceId: string): boolean {
    const proc = this.runningProcesses.get(instanceId);
    if (proc) {
      proc.kill('SIGTERM');
      this.runningProcesses.delete(instanceId);
      return true;
    }
    return false;
  }

  public async launch(
    instance: Instance,
    account: Account,
    instanceManager: InstanceManager,
    window: BrowserWindow,
    onProgress: (progress: LaunchProgress) => void,
    onLog: (log: LogEntry) => void
  ): Promise<void> {
    const instancePath = instanceManager.getInstancePath(instance.id);
    const sharedVersionsDir = path.join(this.baseDir, 'versions');
    const sharedLibrariesDir = path.join(this.baseDir, 'libraries');
    const sharedAssetsDir = path.join(this.baseDir, 'assets');

    await fs.promises.mkdir(sharedVersionsDir, { recursive: true });
    await fs.promises.mkdir(sharedLibrariesDir, { recursive: true });
    await fs.promises.mkdir(sharedAssetsDir, { recursive: true });

    onProgress({
      instanceId: instance.id,
      step: 'Resolving version metadata...',
      progress: 10,
      total: 100,
      details: `Minecraft ${instance.version} (${instance.loader.toUpperCase()})`
    });

    // 1. Fetch Mojang version json
    const mojangVersions = await MinecraftLauncher.getMojangVersions();
    const targetVersionMeta = mojangVersions.find(v => v.id === instance.version);
    if (!targetVersionMeta) {
      throw new Error(`Minecraft version ${instance.version} not found in Mojang manifest.`);
    }

    const versionJsonPath = path.join(sharedVersionsDir, `${instance.version}.json`);
    let versionData: any;
    if (!fs.existsSync(versionJsonPath)) {
      versionData = await Downloader.fetchJson<any>(targetVersionMeta.url);
      await fs.promises.writeFile(versionJsonPath, JSON.stringify(versionData, null, 2), 'utf-8');
    } else {
      versionData = JSON.parse(await fs.promises.readFile(versionJsonPath, 'utf-8'));
    }

    // 2. Download client.jar
    onProgress({
      instanceId: instance.id,
      step: 'Downloading game client...',
      progress: 25,
      total: 100
    });

    const clientJarPath = path.join(sharedVersionsDir, `${instance.version}.jar`);
    const clientDownload = versionData.downloads?.client;
    if (clientDownload && clientDownload.url) {
      await Downloader.downloadFile(clientDownload.url, clientJarPath, clientDownload.sha1);
    }

    // 3. Download Libraries
    onProgress({
      instanceId: instance.id,
      step: 'Downloading libraries...',
      progress: 45,
      total: 100
    });

    const classpathJars: string[] = [clientJarPath];
    const libraryTasks: DownloadTask[] = [];

    if (versionData.libraries && Array.isArray(versionData.libraries)) {
      for (const lib of versionData.libraries) {
        // Check rules
        if (lib.rules && !this.checkRules(lib.rules)) {
          continue;
        }

        const artifact = lib.downloads?.artifact;
        if (artifact && artifact.url) {
          const libDest = path.join(sharedLibrariesDir, artifact.path || this.mavenPathToPath(lib.name));
          classpathJars.push(libDest);
          if (!fs.existsSync(libDest)) {
            libraryTasks.push({
              url: artifact.url,
              destination: libDest,
              sha1: artifact.sha1,
              size: artifact.size
            });
          }
        }
      }
    }

    // 4. Fabric / Quilt integration
    let mainClass = versionData.mainClass || 'net.minecraft.client.main.Main';

    if (instance.loader === 'fabric') {
      onProgress({
        instanceId: instance.id,
        step: 'Resolving Fabric loader...',
        progress: 60,
        total: 100
      });

      const fabricLoaderVersion = instance.loaderVersion || '0.16.10';
      const fabricProfileUrl = `${MinecraftLauncher.FABRIC_META}/versions/loader/${instance.version}/${fabricLoaderVersion}/profile/json`;
      try {
        const fabricProfile = await Downloader.fetchJson<any>(fabricProfileUrl);
        if (fabricProfile.mainClass) {
          mainClass = fabricProfile.mainClass;
        }
        if (fabricProfile.libraries && Array.isArray(fabricProfile.libraries)) {
          for (const flib of fabricProfile.libraries) {
            const libPath = this.mavenPathToPath(flib.name);
            const libDest = path.join(sharedLibrariesDir, libPath);
            classpathJars.unshift(libDest);
            if (!fs.existsSync(libDest)) {
              const url = (flib.url || 'https://maven.fabricmc.net/') + libPath.replace(/\\/g, '/');
              libraryTasks.push({
                url,
                destination: libDest
              });
            }
          }
        }
      } catch (err) {
        console.warn('Fabric profile fetch warning:', err);
      }
    } else if (instance.loader === 'quilt') {
      const quiltLoaderVersion = instance.loaderVersion || '0.27.1-beta.1';
      const quiltProfileUrl = `${MinecraftLauncher.QUILT_META}/versions/loader/${instance.version}/${quiltLoaderVersion}/profile/json`;
      try {
        const quiltProfile = await Downloader.fetchJson<any>(quiltProfileUrl);
        if (quiltProfile.mainClass) mainClass = quiltProfile.mainClass;
        if (quiltProfile.libraries) {
          for (const qlib of quiltProfile.libraries) {
            const libPath = this.mavenPathToPath(qlib.name);
            const libDest = path.join(sharedLibrariesDir, libPath);
            classpathJars.unshift(libDest);
            if (!fs.existsSync(libDest)) {
              const url = (qlib.url || 'https://maven.quiltmc.org/repository/release/') + libPath.replace(/\\/g, '/');
              libraryTasks.push({ url, destination: libDest });
            }
          }
        }
      } catch (err) {
        console.warn('Quilt profile fetch warning:', err);
      }
    }

    if (libraryTasks.length > 0) {
      await Downloader.downloadParallel(libraryTasks, 8, (completed, total, name) => {
        onProgress({
          instanceId: instance.id,
          step: `Downloading libraries (${completed}/${total})...`,
          progress: 45 + Math.floor((completed / total) * 30),
          total: 100,
          details: name
        });
      });
    }

    // 5. Assets Index & Assets download
    onProgress({
      instanceId: instance.id,
      step: 'Verifying game assets...',
      progress: 80,
      total: 100
    });

    const assetIndexInfo = versionData.assetIndex;
    const assetIndexId = assetIndexInfo?.id || instance.version;
    const indexesDir = path.join(sharedAssetsDir, 'indexes');
    const objectsDir = path.join(sharedAssetsDir, 'objects');
    await fs.promises.mkdir(indexesDir, { recursive: true });
    await fs.promises.mkdir(objectsDir, { recursive: true });

    const indexFilePath = path.join(indexesDir, `${assetIndexId}.json`);
    if (assetIndexInfo && assetIndexInfo.url && !fs.existsSync(indexFilePath)) {
      await Downloader.downloadFile(assetIndexInfo.url, indexFilePath, assetIndexInfo.sha1);
    }

    // 6. Select Java runtime
    onProgress({
      instanceId: instance.id,
      step: 'Detecting Java runtime...',
      progress: 90,
      total: 100
    });

    let javaExecutable = instance.javaPath;
    if (!javaExecutable || !fs.existsSync(javaExecutable)) {
      const allJava = await JavaDetector.detectAllJava();
      const recMajor = JavaDetector.getRecommendedJavaMajor(instance.version);
      const match = allJava.find(j => j.majorVersion === recMajor) || allJava[0];
      javaExecutable = match ? match.path : (process.platform === 'win32' ? 'java.exe' : 'java');
    }

    // 7. Assemble JVM & Game Args
    const cpSeparator = process.platform === 'win32' ? ';' : ':';
    const classpath = classpathJars.filter(p => fs.existsSync(p)).join(cpSeparator);

    const jvmArgs: string[] = [
      `-Xms${instance.memoryMin || 2048}M`,
      `-Xmx${instance.memoryMax || 4096}M`,
      `-Djava.library.path=${path.join(instancePath, 'natives')}`,
      `-Dminecraft.launcher.brand=GalaxyLauncher`,
      `-Dminecraft.launcher.version=1.0.0`,
    ];

    if (instance.jvmArgs) {
      const customArgs = instance.jvmArgs.trim().split(/\s+/).filter(Boolean);
      jvmArgs.push(...customArgs);
    }

    jvmArgs.push('-cp', classpath);
    jvmArgs.push(mainClass);

    // Game arguments
    const gameArgs: string[] = [
      '--username', account.username,
      '--version', instance.version,
      '--gameDir', instancePath,
      '--assetsDir', sharedAssetsDir,
      '--assetIndex', assetIndexId,
      '--uuid', account.uuid.replace(/-/g, ''),
      '--accessToken', account.accessToken || '00000000-0000-0000-0000-000000000000',
      '--userType', account.type === 'microsoft' ? 'msa' : 'legacy',
      '--versionType', 'Galaxy Launcher'
    ];

    if (instance.resolution) {
      gameArgs.push('--width', String(instance.resolution.width || 1280));
      gameArgs.push('--height', String(instance.resolution.height || 720));
      if (instance.resolution.fullscreen) {
        gameArgs.push('--fullscreen');
      }
    }

    onProgress({
      instanceId: instance.id,
      step: 'Launching Minecraft...',
      progress: 100,
      total: 100
    });

    onLog({
      id: Math.random().toString(),
      instanceId: instance.id,
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: `Starting Minecraft instance "${instance.name}" with Java at: ${javaExecutable}`,
      source: 'GALAXY'
    });

    onLog({
      id: Math.random().toString(),
      instanceId: instance.id,
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: `Allocated RAM: ${instance.memoryMin}MB - ${instance.memoryMax}MB | Player: ${account.username} (${account.type.toUpperCase()})`,
      source: 'GALAXY'
    });

    // 8. Spawn process
    const fullArgs = [...jvmArgs, ...gameArgs];
    const proc = spawn(javaExecutable, fullArgs, {
      cwd: instancePath,
      env: {
        ...process.env,
        APPDATA: instancePath
      }
    });

    this.runningProcesses.set(instance.id, proc);

    proc.stdout.on('data', (data) => {
      const str = data.toString('utf-8');
      const lines = str.split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) continue;
        let level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' = 'INFO';
        if (line.includes('/WARN]') || line.includes(' WARN ') || line.includes('[WARN]')) level = 'WARN';
        if (line.includes('/ERROR]') || line.includes(' ERROR ') || line.includes('[ERROR]') || line.includes('Exception:')) level = 'ERROR';
        if (line.includes('/DEBUG]')) level = 'DEBUG';

        onLog({
          id: Math.random().toString(),
          instanceId: instance.id,
          timestamp: new Date().toLocaleTimeString(),
          level,
          message: line,
          source: 'MINECRAFT'
        });
      }
    });

    proc.stderr.on('data', (data) => {
      const str = data.toString('utf-8');
      const lines = str.split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) continue;
        onLog({
          id: Math.random().toString(),
          instanceId: instance.id,
          timestamp: new Date().toLocaleTimeString(),
          level: 'ERROR',
          message: line,
          source: 'STDERR'
        });
      }
    });

    proc.on('close', (code) => {
      this.runningProcesses.delete(instance.id);
      onLog({
        id: Math.random().toString(),
        instanceId: instance.id,
        timestamp: new Date().toLocaleTimeString(),
        level: code === 0 ? 'INFO' : 'ERROR',
        message: `Minecraft process exited with code ${code}`,
        source: 'GALAXY'
      });

      // Update instance lastPlayed
      instance.lastPlayed = new Date().toISOString();
      instanceManager.updateInstance(instance);
    });

    proc.on('error', (err) => {
      this.runningProcesses.delete(instance.id);
      onLog({
        id: Math.random().toString(),
        instanceId: instance.id,
        timestamp: new Date().toLocaleTimeString(),
        level: 'ERROR',
        message: `Failed to spawn Minecraft: ${err.message}`,
        source: 'GALAXY'
      });
    });
  }

  public static analyzeCrashLog(logs: LogEntry[]): CrashReportAnalysis {
    const errorText = logs.map(l => l.message).join('\n');

    if (errorText.includes('java.lang.OutOfMemoryError') || errorText.includes('Java heap space')) {
      return {
        isCrash: true,
        title: 'Out of Memory (RAM Exhausted)',
        explanation: 'Minecraft ran out of allocated memory. Modded instances often require 4GB to 8GB of RAM.',
        suggestion: 'Open Instance Settings or Launcher Settings, and increase Maximum Memory (RAM) to at least 4096MB or 6144MB.'
      };
    }

    if (errorText.includes('UnsupportedClassVersionError') || errorText.includes('has been compiled by a more recent version of the Java Runtime')) {
      return {
        isCrash: true,
        title: 'Java Version Incompatibility',
        explanation: 'Your Minecraft or mod loader version requires a newer Java runtime (e.g. Java 17 for MC 1.18-1.20.4 or Java 21 for MC 1.20.5+).',
        suggestion: 'Go to Settings -> Java Manager and select a compatible Java 17 or Java 21 runtime.'
      };
    }

    if (errorText.includes('DuplicateModsFoundException') || errorText.includes('duplicate mod')) {
      const match = errorText.match(/Duplicate mod.*'([^']+)'/i) || errorText.match(/Found duplicate mods:?\s*([^\n\r]+)/i);
      return {
        isCrash: true,
        title: 'Duplicate Mod Detected',
        explanation: 'Two versions of the same mod were found in the mods folder.',
        suggestion: 'Go to Instance -> Mods tab and delete or disable the older version of the duplicate mod.',
        relevantMod: match ? match[1] : undefined
      };
    }

    if (errorText.includes('net.fabricmc.loader.impl.FormattedException: Some of your mods are incompatible with the game or each other')) {
      return {
        isCrash: true,
        title: 'Mod Incompatibility or Missing Dependency',
        explanation: 'One or more mods in this Fabric instance are missing required dependencies (e.g. Fabric API) or conflict with your Minecraft version.',
        suggestion: 'Install Fabric API from the Marketplace tab and check that all mods match your Minecraft version.'
      };
    }

    if (errorText.includes('MixinApplyError') || errorText.includes('org.spongepowered.asm.mixin')) {
      return {
        isCrash: true,
        title: 'Mixin Transformation Conflict',
        explanation: 'A mod attempted to alter game bytecode but collided with another mod or game version.',
        suggestion: 'Try disabling recently added mods one-by-one in the Mods tab to pinpoint the conflicting mod.'
      };
    }

    return {
      isCrash: false,
      title: 'No Fatal Crash Detected',
      explanation: 'No known fatal patterns detected in the current log session.',
      suggestion: 'If the game failed to start, check stdout and stderr messages for details.'
    };
  }

  private checkRules(rules: any[]): boolean {
    let allow = false;
    for (const rule of rules) {
      if (rule.action === 'allow') {
        if (!rule.os || rule.os.name === 'windows') {
          allow = true;
        }
      } else if (rule.action === 'disallow') {
        if (rule.os && rule.os.name === 'windows') {
          allow = false;
        }
      }
    }
    return allow;
  }

  private mavenPathToPath(mavenName: string): string {
    const parts = mavenName.split(':');
    const group = parts[0].replace(/\./g, '/');
    const name = parts[1];
    const version = parts[2];
    const ext = parts[3] ? `-${parts[3]}.jar` : '.jar';
    return path.join(group, name, version, `${name}-${version}${ext}`);
  }
}
