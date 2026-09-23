import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { BrowserWindow } from 'electron';
import { Downloader, DownloadTask } from './downloader';
import { JavaDetector } from './javaDetector';
import { Instance, Account, LogEntry, LaunchProgress, CrashReportAnalysis, MinecraftVersion } from '../preload/types';
import { InstanceManager } from './instanceManager';
import { CosmeticsManager } from './cosmeticsManager';

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
      return ['0.19.5', '0.16.10', '0.16.9', '0.16.5', '0.15.11'];
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
      if (process.platform === 'win32' && proc.pid) {
        try {
          spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F']);
        } catch {
          proc.kill('SIGTERM');
        }
      } else {
        proc.kill('SIGTERM');
      }
      this.runningProcesses.delete(instanceId);
      return true;
    }
    return false;
  }

  private async sanitizeInstanceEnvironment(instancePath: string): Promise<void> {
    try {
      // 1. Clean up stale session.lock in singleplayer saves from previous crashes
      const savesDir = path.join(instancePath, 'saves');
      if (fs.existsSync(savesDir)) {
        const worldDirs = await fs.promises.readdir(savesDir);
        for (const world of worldDirs) {
          const lockFile = path.join(savesDir, world, 'session.lock');
          if (fs.existsSync(lockFile)) {
            try {
              await fs.promises.unlink(lockFile);
            } catch {
              // Ignore if currently locked
            }
          }
        }
      }

      // 2. Clean up corrupted temporary shader/gl cache dumps if any
      const tempCrashDumps = await fs.promises.readdir(instancePath);
      for (const f of tempCrashDumps) {
        if (f.startsWith('hs_err_pid') && f.endsWith('.log')) {
          try {
            await fs.promises.unlink(path.join(instancePath, f));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Instance sanitization notice:', err);
    }
  }

  public async launch(
    instance: Instance,
    account: Account,
    instanceManager: InstanceManager,
    window: BrowserWindow,
    onProgress: (progress: LaunchProgress) => void,
    onLog: (log: LogEntry) => void,
    onExit?: () => void
  ): Promise<void> {
    const instancePath = instanceManager.getInstancePath(instance.id);

    // Sanitize any previous crash locks before starting
    if (this.isInstanceRunning(instance.id)) {
      this.killInstance(instance.id);
    }
    await this.sanitizeInstanceEnvironment(instancePath);

    const sharedVersionsDir = path.join(this.baseDir, 'versions');
    const sharedLibrariesDir = path.join(this.baseDir, 'libraries');
    const sharedAssetsDir = path.join(this.baseDir, 'assets');
    const nativesDir = path.join(instancePath, 'natives');

    await fs.promises.mkdir(sharedVersionsDir, { recursive: true });
    await fs.promises.mkdir(sharedLibrariesDir, { recursive: true });
    await fs.promises.mkdir(sharedAssetsDir, { recursive: true });
    await fs.promises.mkdir(nativesDir, { recursive: true });


    const sessionLogs: LogEntry[] = [];
    const recordLog = (entry: LogEntry) => {
      sessionLogs.push(entry);
      onLog(entry);
    };

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

    // Inject player skin and Galaxy cosmic capes/wings into instance and client jar
    try {
      await CosmeticsManager.injectCosmetics(instancePath, instance.version, account, clientJarPath);
    } catch (cosmeticErr) {
      console.warn('[MinecraftLauncher] Cosmetic injection notice:', cosmeticErr);
    }

    // 3. Download Libraries & Natives
    onProgress({
      instanceId: instance.id,
      step: 'Downloading libraries...',
      progress: 45,
      total: 100
    });

    const classpathJars: string[] = [clientJarPath];
    const libraryTasks: DownloadTask[] = [];
    const nativeJarsToExtract: string[] = [];

    const currentOs = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';

    if (versionData.libraries && Array.isArray(versionData.libraries)) {
      for (const lib of versionData.libraries) {
        if (lib.rules && !this.checkRules(lib.rules, lib.name)) {
          continue;
        }

        const isArm = process.arch === 'arm64';
        if (lib.name) {
          const isLibArm = lib.name.includes('arm64') || lib.name.includes('arm32') || lib.name.includes('aarch64');
          const isLibX86 = lib.name.includes('x86') || lib.name.includes('-32');
          if (!isArm && (isLibArm || isLibX86)) continue;
          if (isArm && !isLibArm && lib.name.includes('natives')) continue;
        }

        const isNative = Boolean(
          (lib.natives && lib.natives[currentOs]) ||
          (lib.name && lib.name.includes(`:natives-${currentOs}`)) ||
          (lib.downloads?.artifact?.path && lib.downloads.artifact.path.includes(`natives-${currentOs}`))
        );

        // Standard artifact
        const artifact = lib.downloads?.artifact;
        if (artifact && artifact.url) {
          const libDest = path.join(sharedLibrariesDir, artifact.path || this.mavenPathToPath(lib.name));
          classpathJars.push(libDest);
          if (isNative) {
            nativeJarsToExtract.push(libDest);
          }
          if (!fs.existsSync(libDest)) {
            libraryTasks.push({
              url: artifact.url,
              destination: libDest,
              sha1: artifact.sha1,
              size: artifact.size
            });
          }
        } else if (!lib.downloads && lib.name) {
          // Maven coordinate fallback (e.g. for Forge or custom loaders)
          const libPath = this.mavenPathToPath(lib.name);
          const libDest = path.join(sharedLibrariesDir, libPath);
          classpathJars.push(libDest);
          if (isNative) {
            nativeJarsToExtract.push(libDest);
          }
          if (!fs.existsSync(libDest)) {
            const baseUrl = lib.url || 'https://libraries.minecraft.net/';
            libraryTasks.push({
              url: baseUrl + libPath.replace(/\\/g, '/'),
              destination: libDest
            });
          }
        }

        // Classifier natives (e.g. natives-windows for LWJGL)
        let nativeClassifier: string | undefined;
        if (lib.natives && lib.natives[currentOs]) {
          nativeClassifier = lib.natives[currentOs].replace('${arch}', process.arch === 'x64' ? '64' : '32');
        } else if (lib.name && lib.name.includes(`:natives-${currentOs}`)) {
          nativeClassifier = `natives-${currentOs}`;
        }

        if (nativeClassifier && lib.downloads?.classifiers && lib.downloads.classifiers[nativeClassifier]) {
          const nativeArtifact = lib.downloads.classifiers[nativeClassifier];
          const nativeDest = path.join(sharedLibrariesDir, nativeArtifact.path || this.mavenPathToPath(lib.name, nativeClassifier));
          classpathJars.push(nativeDest);
          nativeJarsToExtract.push(nativeDest);
          if (!fs.existsSync(nativeDest)) {
            libraryTasks.push({
              url: nativeArtifact.url,
              destination: nativeDest,
              sha1: nativeArtifact.sha1,
              size: nativeArtifact.size
            });
          }
        }
      }
    }

    // 4. Loader profiles: Fabric / Quilt / Forge / NeoForge
    let mainClass = versionData.mainClass || 'net.minecraft.client.main.Main';

    if (instance.loader === 'fabric') {
      onProgress({
        instanceId: instance.id,
        step: 'Resolving Fabric loader...',
        progress: 60,
        total: 100
      });

      const fabricLoaderVersion = instance.loaderVersion || '0.19.5';
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
      onProgress({
        instanceId: instance.id,
        step: 'Resolving Quilt loader...',
        progress: 60,
        total: 100
      });

      const quiltLoaderVersion = instance.loaderVersion || '0.27.1-beta.1';
      const quiltProfileUrl = `${MinecraftLauncher.QUILT_META}/versions/loader/${instance.version}/${quiltLoaderVersion}/profile/json`;
      try {
        const quiltProfile = await Downloader.fetchJson<any>(quiltProfileUrl);
        if (quiltProfile.mainClass) mainClass = quiltProfile.mainClass;
        if (quiltProfile.libraries && Array.isArray(quiltProfile.libraries)) {
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

    // Download libraries in parallel
    if (libraryTasks.length > 0) {
      await Downloader.downloadParallel(libraryTasks, 12, (completed, total, name) => {
        onProgress({
          instanceId: instance.id,
          step: `Downloading libraries (${completed}/${total})...`,
          progress: 45 + Math.floor((completed / total) * 30),
          total: 100,
          details: name
        });
      });
    }

    // Extract native libraries to instance/natives
    for (const nativeJar of nativeJarsToExtract) {
      try {
        if (fs.existsSync(nativeJar)) {
          const zip = new AdmZip(nativeJar);
          for (const entry of zip.getEntries()) {
            if (entry.isDirectory) continue;
            const ext = path.extname(entry.entryName).toLowerCase();
            if (ext === '.dll' || ext === '.so' || ext === '.dylib') {
              const target = path.join(nativesDir, path.basename(entry.entryName));
              if (!fs.existsSync(target) || fs.statSync(target).size === 0) {
                fs.writeFileSync(target, entry.getData());
              }
            }
          }
        }
      } catch (err) {
        console.warn('Native library extract notice:', err);
      }
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

    if (fs.existsSync(indexFilePath)) {
      try {
        const rawIndex = await fs.promises.readFile(indexFilePath, 'utf-8');
        const assetIndexJson = JSON.parse(rawIndex);
        if (assetIndexJson && assetIndexJson.objects) {
          const assetTasks: DownloadTask[] = [];
          const entries = Object.entries(assetIndexJson.objects) as [string, { hash: string; size?: number }][];

          for (const [, obj] of entries) {
            if (!obj || !obj.hash) continue;
            const hash = obj.hash;
            const prefix = hash.substring(0, 2);
            const objDest = path.join(objectsDir, prefix, hash);
            if (!fs.existsSync(objDest)) {
              assetTasks.push({
                url: `https://resources.download.minecraft.net/${prefix}/${hash}`,
                destination: objDest,
                sha1: hash,
                size: obj.size
              });
            }
          }

          if (assetTasks.length > 0) {
            await Downloader.downloadParallel(assetTasks, 64, (completed, total, name) => {
              onProgress({
                instanceId: instance.id,
                step: `Downloading assets (${completed}/${total})...`,
                progress: 80 + Math.floor((completed / total) * 10),
                total: 100,
                details: name
              });
            });
          }
        }
      } catch (err) {
        console.warn('Asset index processing warning:', err);
      }
    }

    // 6. Select & Validate Java runtime (with Auto-Provisioning)
    onProgress({
      instanceId: instance.id,
      step: 'Detecting Java runtime...',
      progress: 90,
      total: 100
    });

    const requiredJavaMajor = versionData.javaVersion?.majorVersion || JavaDetector.getRecommendedJavaMajor(instance.version);
    const allJava = await JavaDetector.detectAllJava();

    let javaExecutable = instance.javaPath;
    let selectedJava = javaExecutable && fs.existsSync(javaExecutable) ? await JavaDetector.probeJava(javaExecutable) : null;

    if (!selectedJava || !selectedJava.isValid || selectedJava.majorVersion < requiredJavaMajor) {
      // Find matching Java version (exact match first, then closest >= required)
      const exactMatch = allJava.find(j => j.majorVersion === requiredJavaMajor && j.isValid);
      const compatibleMatch = allJava.find(j => j.majorVersion >= requiredJavaMajor && j.isValid);
      const match = exactMatch || compatibleMatch;

      if (match) {
        javaExecutable = match.path;
        selectedJava = match;
      } else {
        // Automatically download & provision Eclipse Adoptium Temurin OpenJDK LTS
        onProgress({
          instanceId: instance.id,
          step: `Installing Java ${requiredJavaMajor} LTS runtime...`,
          progress: 92,
          total: 100,
          details: `Downloading Adoptium Temurin Java ${requiredJavaMajor}`
        });
        recordLog({
          id: Math.random().toString(),
          instanceId: instance.id,
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: `Required Java ${requiredJavaMajor} not found. Automatically downloading Eclipse Adoptium Temurin Java ${requiredJavaMajor} LTS...`,
          source: 'GALAXY'
        });

        const runtimesDir = path.join(this.baseDir, 'runtimes');
        try {
          selectedJava = await JavaDetector.downloadAdoptiumJava(runtimesDir, requiredJavaMajor, (p) => {
            onProgress({
              instanceId: instance.id,
              step: p.step,
              progress: 90 + Math.floor(p.percent * 0.08),
              total: 100,
              details: `Java ${requiredJavaMajor} LTS (${p.percent}%)`
            });
          });
          javaExecutable = selectedJava.path;
        } catch (err: any) {
          const fallbackJava = allJava[0];
          if (fallbackJava && fallbackJava.isValid) {
            javaExecutable = fallbackJava.path;
            selectedJava = fallbackJava;
          } else {
            javaExecutable = process.platform === 'win32' ? 'java.exe' : 'java';
          }
        }
      }
    }

    const javaMajor = selectedJava?.majorVersion || requiredJavaMajor || 21;

    // 7. Assemble JVM & Game Args with rigorous version compatibility
    const cpSeparator = process.platform === 'win32' ? ';' : ':';
    const uniqueClasspath = Array.from(new Set(classpathJars.filter(p => fs.existsSync(p))));
    const classpath = uniqueClasspath.join(cpSeparator);

    const jvmArgs: string[] = [
      `-Xms${instance.memoryMin || 2048}M`,
      `-Xmx${instance.memoryMax || 4096}M`,
      `-Djava.library.path=${nativesDir}`,
      `-Dorg.lwjgl.librarypath=${nativesDir}`,
      `-Dorg.lwjgl.system.allocator=system`,
      `-Dminecraft.launcher.brand=GalaxyLauncher`,
      `-Dminecraft.launcher.version=1.0.4`,
      `-Dfile.encoding=UTF-8`
    ];

    if (process.platform === 'darwin') {
      jvmArgs.push('-Dorg.lwjgl.opengl.Display.enableOSXFullscreenModeToggle=true', '-XstartOnFirstThread');
    }

    // Modular JVM Open/Export Flags (Only for Java 16+)
    if (javaMajor >= 16) {
      jvmArgs.push(
        '--add-opens=java.base/java.lang=ALL-UNNAMED',
        '--add-opens=java.base/java.lang.reflect=ALL-UNNAMED',
        '--add-opens=java.base/java.io=ALL-UNNAMED',
        '--add-opens=java.base/java.nio=ALL-UNNAMED',
        '--add-opens=java.base/sun.nio.ch=ALL-UNNAMED',
        '--add-opens=java.base/java.util=ALL-UNNAMED',
        '--add-opens=java.base/java.util.concurrent=ALL-UNNAMED',
        '--add-opens=jdk.unsupported/sun.misc=ALL-UNNAMED'
      );
    }

    if (javaMajor >= 21) {
      jvmArgs.push('--enable-native-access=ALL-UNNAMED');
    }

    // Apply High-Performance Garbage Collection Profiles
    const profile = instance.jvmProfile || 'aikar';
    if (profile === 'aikar') {
      jvmArgs.push(
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+UseG1GC',
        '-XX:+ParallelRefProcEnabled',
        '-XX:MaxGCPauseMillis=200',
        '-XX:+DisableExplicitGC',
        '-XX:+AlwaysPreTouch',
        '-XX:G1NewSizePercent=20',
        '-XX:G1MaxNewSizePercent=40',
        '-XX:G1ReservePercent=15',
        '-XX:SurvivorRatio=32'
      );
    } else if (profile === 'zgc') {
      jvmArgs.push(
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+UseZGC',
        '-XX:+AlwaysPreTouch',
        '-XX:+DisableExplicitGC'
      );
    } else if (profile === 'shenandoah') {
      jvmArgs.push(
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+UseShenandoahGC',
        '-XX:+AlwaysPreTouch',
        '-XX:+DisableExplicitGC'
      );
    }

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
      '--accessToken', account.accessToken && account.accessToken.length > 10 ? account.accessToken : '0',
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

    recordLog({
      id: Math.random().toString(),
      instanceId: instance.id,
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: `Starting Minecraft instance "${instance.name}" with Java ${javaMajor} (${selectedJava?.vendor || 'OpenJDK'}) at: ${javaExecutable}`,
      source: 'GALAXY'
    });

    recordLog({
      id: Math.random().toString(),
      instanceId: instance.id,
      timestamp: new Date().toLocaleTimeString(),
      level: 'INFO',
      message: `Allocated RAM: ${instance.memoryMin}MB - ${instance.memoryMax}MB | Player: ${account.username} (${account.type.toUpperCase()})`,
      source: 'GALAXY'
    });

    // 8. Spawn process with clean host environment (preserving APPDATA and system graphics drivers)
    const fullArgs = [...jvmArgs, ...gameArgs];
    const proc = spawn(javaExecutable, fullArgs, {
      cwd: instancePath,
      env: {
        ...process.env
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
        if (line.includes('/ERROR]') || line.includes(' ERROR ') || line.includes('[ERROR]') || line.includes('Exception:') || line.includes('Error:')) level = 'ERROR';
        if (line.includes('/DEBUG]')) level = 'DEBUG';

        recordLog({
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
        recordLog({
          id: Math.random().toString(),
          instanceId: instance.id,
          timestamp: new Date().toLocaleTimeString(),
          level: 'ERROR',
          message: line,
          source: 'STDERR'
        });
      }
    });

    let hasTerminated = false;
    const handleTermination = (code: number | null, signal: string | null) => {
      if (hasTerminated) return;
      hasTerminated = true;
      this.runningProcesses.delete(instance.id);

      const exitCode = code !== null ? code : 0;
      recordLog({
        id: Math.random().toString(),
        instanceId: instance.id,
        timestamp: new Date().toLocaleTimeString(),
        level: exitCode === 0 ? 'INFO' : 'ERROR',
        message: `Minecraft process exited (code: ${exitCode}, signal: ${signal || 'none'})`,
        source: 'GALAXY'
      });

      if (window && !window.isDestroyed()) {
        window.webContents.send('game:stopped', {
          instanceId: instance.id,
          code: exitCode
        });

        if (exitCode !== 0) {
          const crashAnalysis = MinecraftLauncher.analyzeCrashLog(sessionLogs, instancePath);
          window.webContents.send('game:crashed', {
            instanceId: instance.id,
            instanceName: instance.name,
            analysis: crashAnalysis,
            code: exitCode
          });
        }
      }

      // Update instance lastPlayed
      instance.lastPlayed = new Date().toISOString();
      instanceManager.updateInstance(instance);
      if (onExit) onExit();
    };

    proc.on('exit', (code, signal) => {
      handleTermination(code, signal);
    });

    proc.on('close', (code) => {
      handleTermination(code, null);
    });

    proc.on('error', (err) => {
      if (hasTerminated) return;
      hasTerminated = true;
      this.runningProcesses.delete(instance.id);
      const errMsg = `Failed to spawn Minecraft: ${err.message}`;
      recordLog({
        id: Math.random().toString(),
        instanceId: instance.id,
        timestamp: new Date().toLocaleTimeString(),
        level: 'ERROR',
        message: errMsg,
        source: 'GALAXY'
      });

      if (window && !window.isDestroyed()) {
        window.webContents.send('game:stopped', {
          instanceId: instance.id,
          code: -1
        });

        window.webContents.send('game:crashed', {
          instanceId: instance.id,
          instanceName: instance.name,
          analysis: {
            isCrash: true,
            title: 'Failed to Start Java Process',
            explanation: `The Java executable could not be executed: ${err.message}`,
            suggestion: 'Verify your Java installation path in Settings -> Java Manager.'
          },
          code: -1
        });
      }

      if (onExit) onExit();
    });
  }

  public static analyzeCrashLog(logs: LogEntry[], instancePath?: string): CrashReportAnalysis {
    const errorText = logs.map(l => l.message).join('\n');

    // 1. Check if JVM argument was rejected
    if (errorText.includes('Unrecognized option') || errorText.includes('Could not create the Java Virtual Machine')) {
      const match = errorText.match(/Unrecognized option:?\s*([^\n\r]+)/i);
      return {
        isCrash: true,
        title: 'JVM Argument Error',
        explanation: match ? `The JVM argument "${match[1]}" is not supported by your Java version.` : 'An unsupported JVM argument was passed to the Java runtime.',
        suggestion: 'Open Instance Settings -> Java & Memory and reset custom JVM arguments to default.'
      };
    }

    // 2. Check for out of memory
    if (errorText.includes('java.lang.OutOfMemoryError') || errorText.includes('Java heap space')) {
      return {
        isCrash: true,
        title: 'Out of Memory (RAM Exhausted)',
        explanation: 'Minecraft ran out of allocated memory. Modded instances often require 4GB to 8GB of RAM.',
        suggestion: 'Open Instance Settings or Launcher Settings, and increase Maximum Memory (RAM) to at least 4096MB or 6144MB.'
      };
    }

    // 3. Check for Java version class incompatibility
    if (
      errorText.includes('UnsupportedClassVersionError') ||
      errorText.includes('has been compiled by a more recent version of the Java Runtime') ||
      errorText.includes('requires version 25 or later of') ||
      errorText.includes('requires version 21 or later of') ||
      errorText.includes('requires version 17 or later of')
    ) {
      const match = errorText.match(/requires version (\d+) or later/i) || errorText.match(/class file version (\d+)/i);
      const reqVer = match ? (match[1] === '69' ? '25' : match[1] === '65' ? '21' : match[1] === '61' ? '17' : match[1]) : 'newer';
      return {
        isCrash: true,
        title: 'Java Version Incompatibility',
        explanation: `Your Minecraft version or installed mods require Java ${reqVer}, but an incompatible Java runtime was used.`,
        suggestion: `Go to Settings -> Java Manager and select or install Java ${reqVer}.`
      };
    }

    // 4. Check for duplicate mods
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

    // 5. Check for Fabric / Quilt mod incompatibility
    if (errorText.includes('net.fabricmc.loader.impl.FormattedException') || errorText.includes('Incompatible mods found!')) {
      const modMatch = errorText.match(/Mod '([^']+)'/i) || errorText.match(/Replace mod '([^']+)'/i);
      return {
        isCrash: true,
        title: 'Mod Incompatibility Detected',
        explanation: 'One or more mods are incompatible with your Minecraft version or require missing dependencies.',
        suggestion: 'Check the Mods tab and disable incompatible mods or install required dependencies like Fabric API.',
        relevantMod: modMatch ? modMatch[1] : undefined
      };
    }

    // 6. Check for graphics / LWJGL driver error
    if (errorText.includes('UnsatisfiedLinkError') || errorText.includes('GLFW') || errorText.includes('no lwjgl in java.library.path') || errorText.includes('Pixel format not accelerated')) {
      return {
        isCrash: true,
        title: 'Graphics / Native Driver Error',
        explanation: 'Minecraft failed to initialize the display or graphics driver (GLFW/OpenGL/LWJGL).',
        suggestion: 'Update your GPU graphics drivers and ensure your Java runtime architecture (64-bit) matches your OS.'
      };
    }

    // 7. Check for Mixin bytecode conflicts
    if (errorText.includes('MixinApplyError') || errorText.includes('org.spongepowered.asm.mixin')) {
      return {
        isCrash: true,
        title: 'Mixin Transformation Conflict',
        explanation: 'A mod attempted to alter game bytecode but collided with another mod or game version.',
        suggestion: 'Try disabling recently added mods one-by-one in the Mods tab to pinpoint the conflicting mod.'
      };
    }

    // 8. Check for physical crash report files in <instancePath>/crash-reports
    if (instancePath) {
      try {
        const crashReportsDir = path.join(instancePath, 'crash-reports');
        if (fs.existsSync(crashReportsDir)) {
          const files = fs.readdirSync(crashReportsDir)
            .filter(f => f.endsWith('.txt'))
            .map(f => ({ name: f, time: fs.statSync(path.join(crashReportsDir, f)).mtimeMs }))
            .sort((a, b) => b.time - a.time);

          if (files.length > 0 && Date.now() - files[0].time < 120000) {
            const reportContent = fs.readFileSync(path.join(crashReportsDir, files[0].name), 'utf-8');
            const descMatch = reportContent.match(/Description:\s*([^\n\r]+)/i);
            const stackMatch = reportContent.match(/(?:java\.[a-zA-Z0-9_.]+|net\.[a-zA-Z0-9_.]+)(?:Exception|Error):[^\n\r]+/);

            const summary = descMatch ? descMatch[1].trim() : stackMatch ? stackMatch[0].trim() : 'Minecraft Runtime Crash';
            return {
              isCrash: true,
              title: 'Minecraft Crash Detected',
              explanation: `Game crashed during runtime: ${summary}`,
              suggestion: `Check "${files[0].name}" in the Logs tab or disable recently installed mods/shaders.`
            };
          }
        }
      } catch {}
    }

    return {
      isCrash: false,
      title: 'Game Process Terminated',
      explanation: 'Minecraft closed or exited.',
      suggestion: 'Check the console output for specific warning or error messages.'
    };
  }

  private checkRules(rules: any[], libName?: string): boolean {
    let allow = false;
    const currentOs = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    const isArm = process.arch === 'arm64';

    if (libName) {
      if (!isArm && (libName.includes('arm64') || libName.includes('arm32') || libName.includes('aarch64'))) {
        return false;
      }
      if (process.arch === 'x64' && (libName.includes(':natives-windows-x86') || libName.includes('-x86.jar'))) {
        return false;
      }
    }

    for (const rule of rules) {
      if (rule.action === 'allow') {
        if (!rule.os || rule.os.name === currentOs) {
          if (rule.os?.arch) {
            if (rule.os.arch === 'arm64' && !isArm) continue;
            if (rule.os.arch === 'x64' && isArm) continue;
          }
          allow = true;
        }
      } else if (rule.action === 'disallow') {
        if (!rule.os || rule.os.name === currentOs) {
          if (rule.os?.arch) {
            if (rule.os.arch === 'arm64' && !isArm) continue;
            if (rule.os.arch === 'x64' && isArm) continue;
          }
          allow = false;
        }
      }
    }
    return allow;
  }

  private mavenPathToPath(mavenName: string, classifier?: string): string {
    const parts = mavenName.split(':');
    const group = parts[0].replace(/\./g, '/');
    const name = parts[1];
    const version = parts[2];
    const classStr = classifier ? `-${classifier}` : (parts[3] ? `-${parts[3]}` : '');
    return path.join(group, name, version, `${name}-${version}${classStr}.jar`);
  }
}
