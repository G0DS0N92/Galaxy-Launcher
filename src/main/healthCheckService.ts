import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import AdmZip from 'adm-zip';
import { Instance, InstanceHealthReport, HealthModInfo, HealthModConflict, HealthModUpdate, HealthJavaCheck, HealthMemoryCheck, HealthFileCheck, HealthCrashCheck } from '../preload/types';
import { InstanceManager } from './instanceManager';
import { JavaDetector } from './javaDetector';
import { Downloader } from './downloader';

export class HealthCheckService {
  private baseDir: string;
  private instanceManager: InstanceManager;

  // Known Incompatible Mod Combinations
  private static readonly KNOWN_CONFLICTS: { modA: string; modB: string; reason: string; fixAdvice: string }[] = [
    { modA: 'optifine', modB: 'sodium', reason: 'OptiFine and Sodium both alter rendering pipelines and crash when loaded together.', fixAdvice: 'Disable OptiFine and use Iris Shaders alongside Sodium for better performance.' },
    { modA: 'optifine', modB: 'iris', reason: 'Iris is designed as a modern replacement for OptiFine and will conflict if OptiFine is installed.', fixAdvice: 'Disable OptiFine.' },
    { modA: 'optifine', modB: 'embeddium', reason: 'OptiFine conflicts with Embeddium/Sodium render engines.', fixAdvice: 'Disable OptiFine.' },
    { modA: 'rubidium', modB: 'embeddium', reason: 'Rubidium and Embeddium are rival forks of Sodium and cannot run simultaneously.', fixAdvice: 'Keep Embeddium and disable Rubidium.' },
    { modA: 'sodium', modB: 'canvas', reason: 'Sodium and Canvas are incompatible custom renderers.', fixAdvice: 'Choose either Sodium or Canvas.' },
    { modA: 'oculus', modB: 'optifine', reason: 'Oculus shader engine conflicts with OptiFine.', fixAdvice: 'Disable OptiFine.' },
  ];

  // Core Essential Libraries per Loader
  private static readonly ESSENTIAL_LIBRARIES: { loader: 'fabric' | 'quilt' | 'forge' | 'neoforge'; slug: string; name: string; idPattern: RegExp }[] = [
    { loader: 'fabric', slug: 'fabric-api', name: 'Fabric API', idPattern: /fabric-api|fabric_api/i },
    { loader: 'quilt', slug: 'qsl', name: 'Quilted Fabric Standard Libraries (QFSL)', idPattern: /qsl|quilted_fabric_api/i },
  ];

  constructor(baseDir: string, instanceManager: InstanceManager) {
    this.baseDir = baseDir;
    this.instanceManager = instanceManager;
  }

  /**
   * Reads metadata from inside a mod .jar archive (fabric.mod.json, mods.toml, mcmod.info, or filename parsing).
   */
  public parseModJar(jarPath: string, fileName: string): HealthModInfo {
    let modId = fileName.toLowerCase().replace(/\.jar(\.disabled)?$/, '');
    let name = fileName.replace(/\.jar(\.disabled)?$/, '');
    let version = 'unknown';
    let description = '';
    const dependencies: string[] = [];
    const disabled = fileName.endsWith('.disabled');

    try {
      if (fs.existsSync(jarPath) && !disabled) {
        const zip = new AdmZip(jarPath);
        
        // 1. Check Fabric (fabric.mod.json)
        const fabricEntry = zip.getEntry('fabric.mod.json');
        if (fabricEntry) {
          const raw = fabricEntry.getData().toString('utf8');
          const json = JSON.parse(raw);
          modId = json.id || modId;
          name = json.name || name;
          version = json.version || version;
          description = json.description || '';
          if (json.depends) {
            dependencies.push(...Object.keys(json.depends).filter(k => k !== 'minecraft' && k !== 'java'));
          }
        } else {
          // 2. Check Forge/NeoForge (mods.toml)
          const tomlEntry = zip.getEntry('META-INF/mods.toml');
          if (tomlEntry) {
            const raw = tomlEntry.getData().toString('utf8');
            const modIdMatch = raw.match(/modId\s*=\s*["']([^"']+)["']/i);
            const nameMatch = raw.match(/displayName\s*=\s*["']([^"']+)["']/i);
            const versionMatch = raw.match(/version\s*=\s*["']([^"']+)["']/i);
            const descMatch = raw.match(/description\s*=\s*'''([^']+)'''/i) || raw.match(/description\s*=\s*["']([^"']+)["']/i);

            if (modIdMatch) modId = modIdMatch[1];
            if (nameMatch) name = nameMatch[1];
            if (versionMatch) version = versionMatch[1];
            if (descMatch) description = descMatch[1].trim();
          } else {
            // 3. Check Legacy Forge (mcmod.info)
            const mcmodEntry = zip.getEntry('mcmod.info');
            if (mcmodEntry) {
              const raw = mcmodEntry.getData().toString('utf8');
              const json = JSON.parse(raw);
              const info = Array.isArray(json) ? json[0] : (json.modList ? json.modList[0] : null);
              if (info) {
                modId = info.modid || modId;
                name = info.name || name;
                version = info.version || version;
                description = info.description || '';
              }
            }
          }
        }
      }
    } catch {
      // Fallback heuristics from filename
    }

    // Heuristically clean up version if still unknown
    if (version === 'unknown' || version === '${file.jarVersion}') {
      const vMatch = fileName.match(/[-_]([0-9]+(?:\.[0-9]+)+(?:[+-.][a-zA-Z0-9.]+)?)/);
      if (vMatch) {
        version = vMatch[1];
      }
    }

    // Clean display name
    if (name === fileName.replace(/\.jar(\.disabled)?$/, '')) {
      const clean = fileName
        .replace(/\.jar(\.disabled)?$/, '')
        .replace(/[-_](mc)?([0-9]+\.[0-9]+(?:\.[0-9]+)?).*$/i, '')
        .replace(/[-_]fabric|[-_]forge|[-_]neoforge|[-_]quilt/gi, '')
        .replace(/[-_](v)?[0-9].*$/i, '');
      if (clean.length > 2) {
        name = clean.charAt(0).toUpperCase() + clean.slice(1);
      }
    }

    return {
      fileName,
      modId,
      name,
      version,
      description,
      dependencies,
      disabled,
      isCompatible: true
    };
  }

  /**
   * Analyzes an instance's comprehensive health, returning a structured diagnostic report.
   */
  public async analyzeInstanceHealth(instanceId: string): Promise<InstanceHealthReport> {
    const instance = await this.instanceManager.getInstance(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found.`);
    }

    const instancePath = this.instanceManager.getInstancePath(instanceId);
    const modsDir = path.join(instancePath, 'mods');
    const logsDir = path.join(instancePath, 'logs');
    const crashReportsDir = path.join(instancePath, 'crash-reports');

    // 1. Scan Installed Mods
    const installedMods: HealthModInfo[] = [];
    if (fs.existsSync(modsDir)) {
      const files = await fs.promises.readdir(modsDir);
      for (const file of files) {
        if (file.endsWith('.jar') || file.endsWith('.jar.disabled')) {
          const jarPath = path.join(modsDir, file);
          const modInfo = this.parseModJar(jarPath, file);
          installedMods.push(modInfo);
        }
      }
    }

    // 2. Check Mod Conflicts & Duplicates
    const conflicts: HealthModConflict[] = [];
    const modIdMap = new Map<string, HealthModInfo[]>();

    for (const mod of installedMods) {
      if (mod.disabled) continue;
      const normalizedId = mod.modId.toLowerCase().replace(/[^a-z0-9]/g, '');
      const list = modIdMap.get(normalizedId) || [];
      list.push(mod);
      modIdMap.set(normalizedId, list);
    }

    // Duplicate mod files detection
    for (const [id, list] of modIdMap.entries()) {
      if (list.length > 1) {
        conflicts.push({
          type: 'duplicate',
          severity: 'error',
          modA: list[0].name,
          modB: list[1].name,
          modAFile: list[0].fileName,
          modBFile: list[1].fileName,
          description: `Multiple versions of ${list[0].name} are active simultaneously (${list.map(m => m.fileName).join(', ')}). This will crash Minecraft on startup.`,
          fixAction: 'disable_duplicate',
          fixTargetFile: list[1].fileName
        });
      }
    }

    // Known incompatible combinations
    for (const rule of HealthCheckService.KNOWN_CONFLICTS) {
      const foundA = installedMods.find(m => !m.disabled && m.modId.toLowerCase().includes(rule.modA));
      const foundB = installedMods.find(m => !m.disabled && m.modId.toLowerCase().includes(rule.modB));

      if (foundA && foundB && foundA.fileName !== foundB.fileName) {
        conflicts.push({
          type: 'incompatible',
          severity: 'error',
          modA: foundA.name,
          modB: foundB.name,
          modAFile: foundA.fileName,
          modBFile: foundB.fileName,
          description: rule.reason,
          fixAction: 'disable_mod',
          fixTargetFile: foundA.fileName,
          suggestion: rule.fixAdvice
        });
      }
    }

    // Missing Essential Dependencies (e.g. Fabric API)
    const missingDependencies: { modName: string; requiredDependency: string; dependencySlug: string }[] = [];
    if (instance.loader === 'fabric') {
      const hasFabricApi = installedMods.some(m => !m.disabled && (m.modId.includes('fabric-api') || m.fileName.toLowerCase().includes('fabric-api')));
      if (!hasFabricApi && installedMods.length > 0) {
        missingDependencies.push({
          modName: 'Fabric Loader',
          requiredDependency: 'Fabric API',
          dependencySlug: 'fabric-api'
        });
      }
    }

    // 3. Outdated Mods Check (Queries Modrinth API)
    const updates: HealthModUpdate[] = [];
    try {
      // Check top active mods against Modrinth in batch
      const activeMods = installedMods.filter(m => !m.disabled);
      for (const mod of activeMods.slice(0, 25)) {
        try {
          const searchSlug = mod.modId.replace(/_/g, '-').toLowerCase();
          const cleanVer = instance.version;
          const loader = instance.loader;

          // Quick Modrinth query
          const res = await Downloader.fetchJson<any[]>(
            `https://api.modrinth.com/v2/project/${encodeURIComponent(searchSlug)}/version?game_versions=["${cleanVer}"]&loaders=["${loader}"]`
          );

          if (Array.isArray(res) && res.length > 0) {
            const latest = res[0];
            const latestVerNum = latest.version_number;
            const primaryFile = latest.files.find((f: any) => f.primary) || latest.files[0];

            if (primaryFile && latestVerNum && mod.version !== 'unknown' && mod.version !== latestVerNum) {
              updates.push({
                modName: mod.name,
                currentVersion: mod.version,
                latestVersion: latestVerNum,
                oldFileName: mod.fileName,
                newFileName: primaryFile.filename,
                downloadUrl: primaryFile.url,
                sha1: primaryFile.hashes?.sha1
              });
            }
          }
        } catch {
          // Skip if mod not on Modrinth under this exact slug
        }
      }
    } catch (e) {
      console.warn('[HealthCheckService] Mod update check notice:', e);
    }

    // 4. Java Runtime Check
    const requiredJavaMajor = JavaDetector.getRecommendedJavaMajor(instance.version);
    const allJava = await JavaDetector.detectAllJava();
    let currentJavaPath = instance.javaPath;
    let selectedJava = currentJavaPath && fs.existsSync(currentJavaPath) ? await JavaDetector.probeJava(currentJavaPath) : null;

    if (!selectedJava || !selectedJava.isValid) {
      const match = allJava.find(j => j.majorVersion === requiredJavaMajor && j.isValid) || allJava[0];
      selectedJava = match || null;
      currentJavaPath = match ? match.path : 'Default System Java';
    }

    const javaMajor = selectedJava?.majorVersion || 0;
    const isJavaCompatible = javaMajor >= requiredJavaMajor;

    const javaCheck: HealthJavaCheck = {
      installedVersion: javaMajor ? `Java ${javaMajor}` : 'None Detected',
      requiredVersion: `Java ${requiredJavaMajor} LTS`,
      javaPath: currentJavaPath || 'Not configured',
      isCompatible: isJavaCompatible,
      message: isJavaCompatible
        ? `Java ${javaMajor} is fully compatible with Minecraft ${instance.version}.`
        : `Minecraft ${instance.version} requires Java ${requiredJavaMajor} LTS, but ${javaMajor ? `Java ${javaMajor}` : 'no valid Java runtime'} was detected.`
    };

    // 5. Memory & RAM Allocation Check
    const totalSystemRamMb = Math.round(os.totalmem() / (1024 * 1024));
    const allocatedMaxMb = instance.memoryMax || 4096;
    const allocatedMinMb = instance.memoryMin || 2048;

    let recMin = 2048;
    let recMax = 4096;
    if (installedMods.length > 50) {
      recMin = 4096;
      recMax = 6144;
    } else if (installedMods.length > 120) {
      recMin = 6144;
      recMax = 8192;
    }

    let memoryStatus: 'optimal' | 'low' | 'excessive' | 'warning' = 'optimal';
    let memoryMessage = `Allocated ${allocatedMaxMb}MB RAM is optimal for ${installedMods.length} installed mods.`;

    if (allocatedMaxMb > totalSystemRamMb * 0.85) {
      memoryStatus = 'excessive';
      memoryMessage = `Allocated ${allocatedMaxMb}MB exceeds 85% of physical system RAM (${totalSystemRamMb}MB). This may cause Windows system freezing.`;
    } else if (allocatedMaxMb < 2048) {
      memoryStatus = 'low';
      memoryMessage = `Allocated ${allocatedMaxMb}MB is critically low. Minecraft may experience OutOfMemoryError crashes.`;
    } else if (installedMods.length > 60 && allocatedMaxMb < 4096) {
      memoryStatus = 'warning';
      memoryMessage = `This instance has ${installedMods.length} mods but only ${allocatedMaxMb}MB allocated. Recommended is ${recMax}MB.`;
    }

    const memoryCheck: HealthMemoryCheck = {
      allocatedMinMb,
      allocatedMaxMb,
      totalSystemRamMb,
      recommendedMinMb: recMin,
      recommendedMaxMb: recMax,
      status: memoryStatus,
      message: memoryMessage
    };

    // 6. Instance Files Integrity Check
    const fileIssues: string[] = [];
    let hasSessionLock = false;
    const savesDir = path.join(instancePath, 'saves');

    if (fs.existsSync(savesDir)) {
      try {
        const worlds = await fs.promises.readdir(savesDir);
        for (const w of worlds) {
          const lock = path.join(savesDir, w, 'session.lock');
          if (fs.existsSync(lock)) {
            hasSessionLock = true;
            fileIssues.push(`Stale session.lock detected in world "${w}".`);
          }
        }
      } catch {}
    }

    const fileCheck: HealthFileCheck = {
      isHealthy: fileIssues.length === 0,
      hasCorruptedOptions: false,
      hasStaleSessionLock: hasSessionLock,
      issues: fileIssues
    };

    // 7. Crash History Check
    let recentCrashCount = 0;
    let latestCrashSummary: string | undefined;

    if (fs.existsSync(crashReportsDir)) {
      try {
        const reports = await fs.promises.readdir(crashReportsDir);
        recentCrashCount = reports.filter(r => r.endsWith('.txt')).length;
        if (recentCrashCount > 0) {
          const latestFile = reports[reports.length - 1];
          const raw = await fs.promises.readFile(path.join(crashReportsDir, latestFile), 'utf8');
          const firstLines = raw.split(/\r?\n/).slice(0, 10).join('\n');
          latestCrashSummary = `${latestFile}: ${firstLines.substring(0, 200)}...`;
        }
      } catch {}
    }

    const crashCheck: HealthCrashCheck = {
      recentCrashCount,
      latestCrashSummary
    };

    // 8. Compute Overall Health Score (0 - 100)
    let score = 100;
    if (!isJavaCompatible) score -= 40;
    if (conflicts.length > 0) score -= (conflicts.length * 20);
    if (missingDependencies.length > 0) score -= (missingDependencies.length * 15);
    if (memoryStatus === 'excessive' || memoryStatus === 'low') score -= 15;
    if (memoryStatus === 'warning') score -= 5;
    if (updates.length > 0) score -= Math.min(updates.length * 2, 10);
    if (hasSessionLock) score -= 5;
    if (recentCrashCount > 0) score -= Math.min(recentCrashCount * 5, 15);

    score = Math.max(0, Math.min(100, score));

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 60) status = 'critical';
    else if (score < 85) status = 'warning';

    return {
      instanceId: instance.id,
      instanceName: instance.name,
      gameVersion: instance.version,
      loader: instance.loader,
      score,
      status,
      scannedAt: new Date().toISOString(),
      mods: {
        totalInstalled: installedMods.length,
        compatibleCount: installedMods.length - conflicts.length,
        outdatedCount: updates.length,
        conflictCount: conflicts.length,
        items: installedMods,
        conflicts,
        updates,
        missingDependencies
      },
      java: javaCheck,
      memory: memoryCheck,
      files: fileCheck,
      crashes: crashCheck
    };
  }

  /**
   * 1-Click Fix: Update a single mod.
   */
  public async updateMod(
    instanceId: string,
    oldFileName: string,
    newDownloadUrl: string,
    newFileName: string,
    sha1?: string
  ): Promise<boolean> {
    const instancePath = this.instanceManager.getInstancePath(instanceId);
    const modsDir = path.join(instancePath, 'mods');
    const oldPath = path.join(modsDir, oldFileName);
    const newPath = path.join(modsDir, newFileName);

    try {
      // Download new mod
      await Downloader.downloadFile(newDownloadUrl, newPath, sha1);

      // Remove or disable old mod
      if (fs.existsSync(oldPath) && oldPath !== newPath) {
        await fs.promises.unlink(oldPath);
      }
      return true;
    } catch (err) {
      console.error('[HealthCheckService] Update mod error:', err);
      return false;
    }
  }

  /**
   * 1-Click Fix: Update all outdated mods simultaneously.
   */
  public async updateAllMods(
    instanceId: string,
    updates: { oldFileName: string; downloadUrl: string; newFileName: string; sha1?: string }[]
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const item of updates) {
      const success = await this.updateMod(instanceId, item.oldFileName, item.downloadUrl, item.newFileName, item.sha1);
      if (success) updated++;
      else failed++;
    }

    return { updated, failed };
  }

  /**
   * 1-Click Fix: Disable a conflicting mod by renaming to .disabled.
   */
  public async disableMod(instanceId: string, fileName: string): Promise<boolean> {
    const instancePath = this.instanceManager.getInstancePath(instanceId);
    const modsDir = path.join(instancePath, 'mods');
    const srcPath = path.join(modsDir, fileName);
    const targetPath = path.join(modsDir, `${fileName.replace(/\.disabled$/, '')}.disabled`);

    try {
      if (fs.existsSync(srcPath)) {
        await fs.promises.rename(srcPath, targetPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[HealthCheckService] Disable mod error:', err);
      return false;
    }
  }

  /**
   * 1-Click Fix: Delete a conflicting mod completely.
   */
  public async deleteMod(instanceId: string, fileName: string): Promise<boolean> {
    const instancePath = this.instanceManager.getInstancePath(instanceId);
    const modsDir = path.join(instancePath, 'mods');
    const targetPath = path.join(modsDir, fileName);

    try {
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[HealthCheckService] Delete mod error:', err);
      return false;
    }
  }

  /**
   * 1-Click Fix: Install a missing core dependency from Modrinth.
   */
  public async installMissingDependency(instanceId: string, dependencySlug: string): Promise<boolean> {
    const instance = await this.instanceManager.getInstance(instanceId);
    if (!instance) return false;

    const instancePath = this.instanceManager.getInstancePath(instanceId);
    const modsDir = path.join(instancePath, 'mods');

    try {
      const res = await Downloader.fetchJson<any[]>(
        `https://api.modrinth.com/v2/project/${encodeURIComponent(dependencySlug)}/version?game_versions=["${instance.version}"]&loaders=["${instance.loader}"]`
      );

      if (Array.isArray(res) && res.length > 0) {
        const latest = res[0];
        const primaryFile = latest.files.find((f: any) => f.primary) || latest.files[0];
        if (primaryFile) {
          const dest = path.join(modsDir, primaryFile.filename);
          await Downloader.downloadFile(primaryFile.url, dest, primaryFile.hashes?.sha1);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[HealthCheckService] Install dependency error:', err);
      return false;
    }
  }

  /**
   * 1-Click Fix: Optimize instance RAM.
   */
  public async optimizeInstanceRam(instanceId: string, recommendedMaxMb: number): Promise<boolean> {
    const instance = await this.instanceManager.getInstance(instanceId);
    if (!instance) return false;

    instance.memoryMax = recommendedMaxMb;
    instance.memoryMin = Math.min(2048, Math.round(recommendedMaxMb / 2));
    this.instanceManager.updateInstance(instance);
    return true;
  }
}
