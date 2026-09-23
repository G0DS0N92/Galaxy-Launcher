import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { Instance, Mod, ResourcePack, ShaderPack, WorldSave, ModLoader, InstanceShareData, CloneInstanceOptions } from '../preload/types';

export class InstanceManager {
  private instancesDir: string;
  private shaderIconCache: Map<string, { icon?: string; author?: string; title?: string; url?: string }> = new Map();

  constructor(baseInstancesDir: string) {
    this.instancesDir = baseInstancesDir;
    fs.mkdirSync(this.instancesDir, { recursive: true });
  }

  public getInstancesDir(): string {
    return this.instancesDir;
  }

  public setInstancesDir(newDir: string): void {
    this.instancesDir = newDir;
    fs.mkdirSync(this.instancesDir, { recursive: true });
  }

  public getInstancePath(instanceId: string): string {
    return path.join(this.instancesDir, instanceId);
  }

  public async listInstances(): Promise<Instance[]> {
    const instances: Instance[] = [];
    if (!fs.existsSync(this.instancesDir)) return instances;

    const entries = await fs.promises.readdir(this.instancesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const configPath = path.join(this.instancesDir, entry.name, 'instance.json');
        if (fs.existsSync(configPath)) {
          try {
            const raw = await fs.promises.readFile(configPath, 'utf-8');
            const inst = JSON.parse(raw) as Instance;
            // Purge legacy starter mock demo instances
            if (inst.name === 'Vanilla Odyssey' || inst.name === 'Cosmic Fabric 1.21' || inst.id.startsWith('starter-')) {
              try {
                await fs.promises.rm(path.join(this.instancesDir, entry.name), { recursive: true, force: true });
              } catch {}
              continue;
            }
            inst.resolution = inst.resolution || { width: 1280, height: 720, fullscreen: false };
            inst.icon = inst.icon || 'grass_block';
            inst.iconBackground = inst.iconBackground || 'obsidian';
            inst.memoryMax = inst.memoryMax || 4096;
            inst.memoryMin = inst.memoryMin || 2048;
            inst.loader = inst.loader || 'vanilla';
            instances.push(inst);
          } catch (err) {
            console.error(`Failed to parse instance config in ${entry.name}:`, err);
          }
        }
      }
    }

    // Sort by favorites first, then lastPlayed or createdAt descending
    instances.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      const timeA = a.lastPlayed ? new Date(a.lastPlayed).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.lastPlayed ? new Date(b.lastPlayed).getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    return instances;
  }


  public async getInstance(instanceId: string): Promise<Instance | null> {
    const configPath = path.join(this.instancesDir, instanceId, 'instance.json');
    if (!fs.existsSync(configPath)) return null;
    try {
      const raw = await fs.promises.readFile(configPath, 'utf-8');
      return JSON.parse(raw) as Instance;
    } catch {
      return null;
    }
  }

  public async createInstance(options: {
    name: string;
    version: string;
    loader: ModLoader;
    loaderVersion?: string;
    icon?: string;
    iconBackground?: string;
    banner?: string;
    memoryMin?: number;
    memoryMax?: number;
    jvmArgs?: string;
    javaPath?: string;
    resolution?: {
      width: number;
      height: number;
      fullscreen: boolean;
    };
  }): Promise<Instance> {
    const id = options.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const instanceDir = path.join(this.instancesDir, id);

    // Create subdirectories
    await fs.promises.mkdir(path.join(instanceDir, 'mods'), { recursive: true });
    await fs.promises.mkdir(path.join(instanceDir, 'resourcepacks'), { recursive: true });
    await fs.promises.mkdir(path.join(instanceDir, 'shaderpacks'), { recursive: true });
    await fs.promises.mkdir(path.join(instanceDir, 'saves'), { recursive: true });
    await fs.promises.mkdir(path.join(instanceDir, 'config'), { recursive: true });
    await fs.promises.mkdir(path.join(instanceDir, 'logs'), { recursive: true });

    const newInstance: Instance = {
      id,
      name: options.name,
      version: options.version,
      loader: options.loader,
      loaderVersion: options.loaderVersion,
      icon: options.icon || (options.loader === 'fabric' ? 'fabric' : options.loader === 'forge' ? 'forge' : 'grass_block'),
      iconBackground: options.iconBackground || 'obsidian',
      banner: options.banner,
      memoryMin: options.memoryMin || 2048,
      memoryMax: options.memoryMax || 4096,
      jvmArgs: options.jvmArgs || '-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions',
      javaPath: options.javaPath,
      playTimeMinutes: 0,
      resolution: options.resolution || {
        width: 1920,
        height: 1080,
        fullscreen: false
      },
      createdAt: new Date().toISOString()
    };

    const configPath = path.join(instanceDir, 'instance.json');
    await fs.promises.writeFile(configPath, JSON.stringify(newInstance, null, 2), 'utf-8');
    return newInstance;
  }

  public async updateInstance(instance: Instance): Promise<Instance> {
    const configPath = path.join(this.instancesDir, instance.id, 'instance.json');
    await fs.promises.writeFile(configPath, JSON.stringify(instance, null, 2), 'utf-8');
    return instance;
  }

  public async deleteInstance(instanceId: string): Promise<boolean> {
    const instanceDir = path.join(this.instancesDir, instanceId);
    if (fs.existsSync(instanceDir)) {
      await fs.promises.rm(instanceDir, { recursive: true, force: true });
      return true;
    }
    return false;
  }

  public async cloneInstance(
    instanceId: string,
    optionsOrName: string | CloneInstanceOptions
  ): Promise<Instance | null> {
    const original = await this.getInstance(instanceId);
    if (!original) return null;

    const options: CloneInstanceOptions =
      typeof optionsOrName === 'string'
        ? { name: optionsOrName }
        : optionsOrName;

    const newName = (options.name && options.name.trim()) ? options.name.trim() : `${original.name} - Copy`;
    const newId = newName.toLowerCase().replace(/[^a-z0-9_-]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const srcDir = path.join(this.instancesDir, instanceId);
    const destDir = path.join(this.instancesDir, newId);

    // Create base instance directory structure
    await fs.promises.mkdir(destDir, { recursive: true });
    await fs.promises.mkdir(path.join(destDir, 'logs'), { recursive: true });

    // 1. Copy Mods
    if (options.copyMods !== false) {
      const srcMods = path.join(srcDir, 'mods');
      const destMods = path.join(destDir, 'mods');
      if (fs.existsSync(srcMods)) {
        await fs.promises.cp(srcMods, destMods, { recursive: true });
      } else {
        await fs.promises.mkdir(destMods, { recursive: true });
      }
    } else {
      await fs.promises.mkdir(path.join(destDir, 'mods'), { recursive: true });
    }

    // 2. Copy Configurations (Keybindings, mod config directory, options.txt, servers.dat)
    if (options.copyConfigurations !== false) {
      const srcConfig = path.join(srcDir, 'config');
      const destConfig = path.join(destDir, 'config');
      if (fs.existsSync(srcConfig)) {
        await fs.promises.cp(srcConfig, destConfig, { recursive: true });
      } else {
        await fs.promises.mkdir(destConfig, { recursive: true });
      }

      // Copy keybinds and settings files
      const configFiles = ['options.txt', 'optionsshaders.txt', 'optionsof.txt', 'servers.dat', 'usercache.json'];
      for (const cf of configFiles) {
        const srcFile = path.join(srcDir, cf);
        if (fs.existsSync(srcFile)) {
          try {
            await fs.promises.copyFile(srcFile, path.join(destDir, cf));
          } catch {}
        }
      }
    } else {
      await fs.promises.mkdir(path.join(destDir, 'config'), { recursive: true });
    }

    // 3. Copy Resource Packs
    if (options.copyResourcePacks !== false) {
      const srcRP = path.join(srcDir, 'resourcepacks');
      const destRP = path.join(destDir, 'resourcepacks');
      if (fs.existsSync(srcRP)) {
        await fs.promises.cp(srcRP, destRP, { recursive: true });
      } else {
        await fs.promises.mkdir(destRP, { recursive: true });
      }
    } else {
      await fs.promises.mkdir(path.join(destDir, 'resourcepacks'), { recursive: true });
    }

    // 4. Copy Shader Packs
    if (options.copyShaderPacks !== false) {
      const srcSP = path.join(srcDir, 'shaderpacks');
      const destSP = path.join(destDir, 'shaderpacks');
      if (fs.existsSync(srcSP)) {
        await fs.promises.cp(srcSP, destSP, { recursive: true });
      } else {
        await fs.promises.mkdir(destSP, { recursive: true });
      }
    } else {
      await fs.promises.mkdir(path.join(destDir, 'shaderpacks'), { recursive: true });
    }

    // 5. Copy Worlds (Saves)
    if (options.copyWorlds !== false) {
      const srcSaves = path.join(srcDir, 'saves');
      const destSaves = path.join(destDir, 'saves');
      if (fs.existsSync(srcSaves)) {
        await fs.promises.cp(srcSaves, destSaves, { recursive: true });
      } else {
        await fs.promises.mkdir(destSaves, { recursive: true });
      }
    } else {
      await fs.promises.mkdir(path.join(destDir, 'saves'), { recursive: true });
    }

    // 6. Copy Screenshots
    if (options.copyScreenshots !== false) {
      const srcScreenshots = path.join(srcDir, 'screenshots');
      const destScreenshots = path.join(destDir, 'screenshots');
      if (fs.existsSync(srcScreenshots)) {
        await fs.promises.cp(srcScreenshots, destScreenshots, { recursive: true });
      } else {
        await fs.promises.mkdir(destScreenshots, { recursive: true });
      }
    } else {
      await fs.promises.mkdir(path.join(destDir, 'screenshots'), { recursive: true });
    }

    // 7. Copy Statistics
    if (options.copyStatistics) {
      const srcStats = path.join(srcDir, 'stats');
      const destStats = path.join(destDir, 'stats');
      if (fs.existsSync(srcStats)) {
        await fs.promises.cp(srcStats, destStats, { recursive: true });
      }
    }

    const clonedInstance: Instance = {
      ...original,
      id: newId,
      name: newName,
      createdAt: new Date().toISOString(),
      lastPlayed: undefined,
      playTimeMinutes: options.copyStatistics ? (original.playTimeMinutes || 0) : 0,
      launchCount: 0
    };

    const configPath = path.join(destDir, 'instance.json');
    await fs.promises.writeFile(configPath, JSON.stringify(clonedInstance, null, 2), 'utf-8');
    return clonedInstance;
  }

  public async toggleFavorite(instanceId: string): Promise<boolean> {
    const inst = await this.getInstance(instanceId);
    if (!inst) return false;
    inst.isFavorite = !inst.isFavorite;
    await this.updateInstance(inst);
    return inst.isFavorite;
  }

  public async recordLaunch(instanceId: string): Promise<void> {
    const inst = await this.getInstance(instanceId);
    if (!inst) return;
    inst.launchCount = (inst.launchCount || 0) + 1;
    inst.lastPlayed = new Date().toISOString();
    await this.updateInstance(inst);
  }

  public async recordPlaytime(instanceId: string, additionalMinutes: number): Promise<void> {
    const inst = await this.getInstance(instanceId);
    if (!inst) return;
    inst.playTimeMinutes = (inst.playTimeMinutes || 0) + additionalMinutes;
    inst.lastPlayed = new Date().toISOString();
    await this.updateInstance(inst);
  }

  // --- Mods Management ---

  public async getMods(instanceId: string): Promise<Mod[]> {
    const modsDir = path.join(this.instancesDir, instanceId, 'mods');
    if (!fs.existsSync(modsDir)) {
      await fs.promises.mkdir(modsDir, { recursive: true });
      return [];
    }

    const files = await fs.promises.readdir(modsDir);
    const mods: Mod[] = [];

    for (const file of files) {
      if (file.endsWith('.jar') || file.endsWith('.jar.disabled')) {
        const fullPath = path.join(modsDir, file);
        const stat = await fs.promises.stat(fullPath);
        const enabled = !file.endsWith('.disabled');
        const parsed = this.parseModMetadata(fullPath, file, enabled, stat.size);
        mods.push(parsed);
      }
    }

    return mods;
  }

  private parseModMetadata(filePath: string, filename: string, enabled: boolean, sizeBytes: number): Mod {
    let name = filename.replace(/\.jar(\.disabled)?$/, '');
    let version = '1.0';
    let description = 'Minecraft Modification';
    let authors: string[] = [];
    let modId = name.toLowerCase();

    let icon: string | undefined = undefined;

    try {
      const zip = new AdmZip(filePath);

      // Try Fabric: fabric.mod.json
      const fabricEntry = zip.getEntry('fabric.mod.json');
      if (fabricEntry) {
        const fabricMeta = JSON.parse(fabricEntry.getData().toString('utf-8'));
        if (fabricMeta.name) name = fabricMeta.name;
        if (fabricMeta.version) version = fabricMeta.version;
        if (fabricMeta.description) description = fabricMeta.description;
        if (fabricMeta.id) modId = fabricMeta.id;
        if (fabricMeta.authors) {
          authors = Array.isArray(fabricMeta.authors)
            ? fabricMeta.authors.map((a: any) => (typeof a === 'string' ? a : a.name || ''))
            : [String(fabricMeta.authors)];
        }
        if (fabricMeta.icon) {
          const iconPath = typeof fabricMeta.icon === 'string'
            ? fabricMeta.icon
            : (fabricMeta.icon['128'] || fabricMeta.icon['64'] || fabricMeta.icon['32'] || Object.values(fabricMeta.icon)[0]);
          if (iconPath && typeof iconPath === 'string') {
            const iconEntry = zip.getEntry(iconPath.replace(/^\//, ''));
            if (iconEntry) {
              icon = `data:image/png;base64,${iconEntry.getData().toString('base64')}`;
            }
          }
        }
      } else {
        // Try Forge / NeoForge: META-INF/mods.toml
        const tomlEntry = zip.getEntry('META-INF/mods.toml');
        if (tomlEntry) {
          const content = tomlEntry.getData().toString('utf-8');
          const modIdMatch = content.match(/modId\s*=\s*"([^"]+)"/);
          const displayNameMatch = content.match(/displayName\s*=\s*"([^"]+)"/);
          const versionMatch = content.match(/version\s*=\s*"([^"]+)"/);
          const descMatch = content.match(/description\s*=\s*'''([^']+)'''/) || content.match(/description\s*=\s*"([^"]+)"/);
          const authorMatch = content.match(/authors\s*=\s*"([^"]+)"/);
          const logoMatch = content.match(/logoFile\s*=\s*"([^"]+)"/);

          if (displayNameMatch && displayNameMatch[1]) name = displayNameMatch[1];
          if (versionMatch && versionMatch[1]) version = versionMatch[1];
          if (descMatch && descMatch[1]) description = descMatch[1].trim();
          if (modIdMatch && modIdMatch[1]) modId = modIdMatch[1];
          if (authorMatch && authorMatch[1]) authors = [authorMatch[1]];
          if (logoMatch && logoMatch[1]) {
            const logoEntry = zip.getEntry(logoMatch[1].replace(/^\//, '')) || zip.getEntry(`assets/${modId}/${logoMatch[1].replace(/^\//, '')}`);
            if (logoEntry) {
              icon = `data:image/png;base64,${logoEntry.getData().toString('base64')}`;
            }
          }
        } else {
          // Try legacy mcmod.info
          const mcmodEntry = zip.getEntry('mcmod.info');
          if (mcmodEntry) {
            const mcmod = JSON.parse(mcmodEntry.getData().toString('utf-8'));
            const first = Array.isArray(mcmod) ? mcmod[0] : (mcmod.modList ? mcmod.modList[0] : null);
            if (first) {
              if (first.name) name = first.name;
              if (first.version) version = first.version;
              if (first.description) description = first.description;
              if (first.authorList) authors = first.authorList;
              if (first.logoFile) {
                const logoEntry = zip.getEntry(first.logoFile.replace(/^\//, ''));
                if (logoEntry) {
                  icon = `data:image/png;base64,${logoEntry.getData().toString('base64')}`;
                }
              }
            }
          }
        }
      }

      // Check standard icon paths if not yet found
      if (!icon) {
        const possibleIconPaths = [
          `assets/${modId}/icon.png`,
          `assets/${modId}/textures/gui/icon.png`,
          'icon.png',
          'logo.png',
          'pack.png'
        ];
        for (const p of possibleIconPaths) {
          const entry = zip.getEntry(p);
          if (entry) {
            icon = `data:image/png;base64,${entry.getData().toString('base64')}`;
            break;
          }
        }
      }
    } catch {
      // Fallback to filename parsing
    }

    return {
      filename,
      name,
      version,
      description,
      icon,
      enabled,
      authors,
      id: modId,
      path: filePath,
      sizeBytes
    };
  }

  public async toggleMod(instanceId: string, filename: string, enabled: boolean): Promise<boolean> {
    const modsDir = path.join(this.instancesDir, instanceId, 'mods');
    const isCurrentlyDisabled = filename.endsWith('.disabled');

    if (enabled && isCurrentlyDisabled) {
      const src = path.join(modsDir, filename);
      const dest = path.join(modsDir, filename.replace(/\.disabled$/, ''));
      await fs.promises.rename(src, dest);
      return true;
    } else if (!enabled && !isCurrentlyDisabled) {
      const src = path.join(modsDir, filename);
      const dest = path.join(modsDir, `${filename}.disabled`);
      await fs.promises.rename(src, dest);
      return true;
    }
    return false;
  }

  public async deleteMod(instanceId: string, filename: string): Promise<boolean> {
    const modPath = path.join(this.instancesDir, instanceId, 'mods', filename);
    if (fs.existsSync(modPath)) {
      await fs.promises.unlink(modPath);
      return true;
    }
    return false;
  }

  public async importFiles(instanceId: string, subDir: string, filePaths: string[]): Promise<number> {
    const targetDir = path.join(this.instancesDir, instanceId, subDir);
    if (!fs.existsSync(targetDir)) {
      await fs.promises.mkdir(targetDir, { recursive: true });
    }

    let count = 0;
    for (const src of filePaths) {
      if (fs.existsSync(src)) {
        const dest = path.join(targetDir, path.basename(src));
        await fs.promises.copyFile(src, dest);
        count++;
      }
    }
    return count;
  }

  // --- Resource Packs & Shaders ---
  public async getResourcePacks(instanceId: string): Promise<ResourcePack[]> {
    const rpDir = path.join(this.instancesDir, instanceId, 'resourcepacks');
    if (!fs.existsSync(rpDir)) {
      await fs.promises.mkdir(rpDir, { recursive: true });
      return [];
    }
    const files = await fs.promises.readdir(rpDir);
    const packs: ResourcePack[] = [];

    const cleanFormatting = (str: string): string => {
      if (!str) return '';
      return str.replace(/§[0-9a-fk-or]/gi, '').replace(/\s+/g, ' ').trim();
    };

    const extractMcmetaText = (desc: any): string => {
      if (!desc) return '';
      if (typeof desc === 'string') return cleanFormatting(desc);
      if (Array.isArray(desc)) return desc.map(extractMcmetaText).join(' ').trim();
      if (typeof desc === 'object') {
        let text = desc.text ? cleanFormatting(desc.text) : '';
        if (desc.extra && Array.isArray(desc.extra)) {
          text += ' ' + desc.extra.map(extractMcmetaText).join(' ');
        }
        return text.trim();
      }
      return cleanFormatting(String(desc));
    };

    for (const f of files) {
      const fullPath = path.join(rpDir, f);
      const stat = await fs.promises.stat(fullPath);
      const isZip = f.endsWith('.zip') || f.endsWith('.zip.disabled');
      const isDir = stat.isDirectory();

      if (!isZip && !isDir) continue;

      const enabled = !f.endsWith('.disabled');
      const rawBaseName = f.replace(/\.disabled$/, '').replace(/\.zip$/, '');
      let cleanName = cleanFormatting(rawBaseName);
      let description = 'Minecraft Resource Pack';
      let version = '';
      let icon: string | undefined;
      let authors: string[] | undefined;
      const sizeBytes = stat.size || 0;

      // Try version extraction from filename (e.g., "1.5.3.36.6", "v4.1", "1.21.1", "r5.9")
      const verMatch = rawBaseName.match(/(?:v|r|_|-|\s)([0-9]+(?:\.[0-9a-zA-Z_-]+)+)/i) ||
                       rawBaseName.match(/([0-9]+\.[0-9]+(?:\.[0-9]+)?)/);
      if (verMatch && verMatch[1]) {
        version = verMatch[1].replace(/^[_-]/, '');
      }

      // Try reading zip contents if it's a file
      if (isZip) {
        try {
          const zip = new AdmZip(fullPath);
          const packMcmetaEntry = zip.getEntry('pack.mcmeta');
          if (packMcmetaEntry) {
            try {
              const mcmetaRaw = JSON.parse(packMcmetaEntry.getData().toString('utf-8'));
              if (mcmetaRaw?.pack?.description) {
                const parsedDesc = extractMcmetaText(mcmetaRaw.pack.description);
                if (parsedDesc) {
                  description = parsedDesc;
                  // Look for author patterns like "by AuthorName"
                  const authorMatch = parsedDesc.match(/by\s+([a-zA-Z0-9_-]+)/i);
                  if (authorMatch && authorMatch[1]) {
                    authors = [authorMatch[1]];
                  }
                }
              }
            } catch {}
          }

          const packPngEntry = zip.getEntry('pack.png');
          if (packPngEntry) {
            icon = `data:image/png;base64,${packPngEntry.getData().toString('base64')}`;
          }
        } catch {
          // Ignore corrupted zip
        }
      } else if (isDir) {
        // Read directory pack.mcmeta and pack.png
        const mcmetaPath = path.join(fullPath, 'pack.mcmeta');
        const iconPath = path.join(fullPath, 'pack.png');
        if (fs.existsSync(mcmetaPath)) {
          try {
            const mcmetaRaw = JSON.parse(await fs.promises.readFile(mcmetaPath, 'utf-8'));
            if (mcmetaRaw?.pack?.description) {
              const parsedDesc = extractMcmetaText(mcmetaRaw.pack.description);
              if (parsedDesc) description = parsedDesc;
            }
          } catch {}
        }
        if (fs.existsSync(iconPath)) {
          try {
            const buf = await fs.promises.readFile(iconPath);
            icon = `data:image/png;base64,${buf.toString('base64')}`;
          } catch {}
        }
      }

      // Clean up common author suffixes from cleanName
      cleanName = cleanName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

      packs.push({
        filename: f,
        name: cleanName,
        version: version || 'Latest',
        description,
        icon,
        enabled,
        authors: authors || [],
        path: fullPath,
        sizeBytes,
        url: `https://modrinth.com/resourcepacks?q=${encodeURIComponent(cleanName)}`
      });
    }
    return packs;
  }

  public async getShaderPacks(instanceId: string): Promise<ShaderPack[]> {
    const spDir = path.join(this.instancesDir, instanceId, 'shaderpacks');
    if (!fs.existsSync(spDir)) {
      await fs.promises.mkdir(spDir, { recursive: true });
      return [];
    }
    const files = await fs.promises.readdir(spDir);
    const shaders: ShaderPack[] = [];

    const POPULAR_SHADERS: {
      match: RegExp;
      title: string;
      author: string;
      slug?: string;
      icon?: string;
      url?: string;
    }[] = [
      { match: /bsl/i, title: 'BSL Shaders', author: 'CaptTatsu', slug: 'bsl-shaders', icon: 'https://cdn.modrinth.com/data/Q1vvjJYV/2a611a3cb434fb52fb81fa5dace13c5d8b67e55d_96.webp', url: 'https://modrinth.com/shader/bsl-shaders' },
      { match: /complementary.*reimagined/i, title: 'Complementary Shaders - Reimagined', author: 'EminGT', slug: 'complementary-reimagined', icon: 'https://cdn.modrinth.com/data/HVnmMxH1/79cb7c8123bbc54945305b2ebad6b8881efdf5f8_96.webp', url: 'https://modrinth.com/shader/complementary-reimagined' },
      { match: /complementary.*unbound/i, title: 'Complementary Shaders - Unbound', author: 'EminGT', slug: 'complementary-unbound', icon: 'https://cdn.modrinth.com/data/R6NEzAwj/c85ce4049aac76360d2cd24fd9a7003de01ef312_96.webp', url: 'https://modrinth.com/shader/complementary-unbound' },
      { match: /complementary/i, title: 'Complementary Shaders', author: 'EminGT', slug: 'complementary-reimagined', icon: 'https://cdn.modrinth.com/data/HVnmMxH1/79cb7c8123bbc54945305b2ebad6b8881efdf5f8_96.webp', url: 'https://modrinth.com/shader/complementary-reimagined' },
      { match: /photon/i, title: 'Photon Shaders', author: 'sixthsurge', slug: 'photon-shader', icon: 'https://cdn.modrinth.com/data/lLqFfGNs/39cb5f12e7dcc68d6cb666f225fcb2b801dd70fb_96.webp', url: 'https://modrinth.com/shader/photon-shader' },
      { match: /solas/i, title: 'Solas Shader', author: 'Septonious', slug: 'solas-shader', icon: 'https://cdn.modrinth.com/data/EpQFjzrQ/e3efc6ba7a63f9e1cf473a794d0224a6daf243c7_96.webp', url: 'https://modrinth.com/shader/solas-shader' },
      { match: /bliss/i, title: 'Bliss Shaders', author: 'Xonk', slug: 'bliss-shader', icon: 'https://cdn.modrinth.com/data/ZvMtQlho/90145c971ea24387775108fc86c89bed9bd2c8f1_96.webp', url: 'https://modrinth.com/shader/bliss-shader' },
      { match: /makeup.*ultra.*fast|makeup/i, title: 'MakeUp - Ultra Fast', author: 'KDcvXavier', slug: 'makeup-ultra-fast-shader', icon: 'https://cdn.modrinth.com/data/izsIPI7a/a08432baa86b8ffd58c08f4b3a001ef976ff764d_96.webp', url: 'https://modrinth.com/shader/makeup-ultra-fast-shader' },
      { match: /rethinking.*voxel/i, title: 'Rethinking Voxels', author: 'gri5/3', slug: 'rethinking-voxels', icon: 'https://cdn.modrinth.com/data/kmwfVOoi/fc89eadad417dd376b14c3b31e1a2b87acaca034_96.webp', url: 'https://modrinth.com/shader/rethinking-voxels' },
      { match: /super.*duper.*vanilla/i, title: 'Super Duper Vanilla', author: 'Eldeston', slug: 'super-duper-vanilla', icon: 'https://cdn.modrinth.com/data/LMIZZNxZ/5d09a380b6da014dcbca683879cdfb4a94603cf8_96.webp', url: 'https://modrinth.com/shader/super-duper-vanilla' },
      { match: /insanity/i, title: 'Insanity Shader', author: 'ElocinDev', slug: 'insanity-shader', icon: 'https://cdn.modrinth.com/data/EQWX2WiO/cc7a7e0bb758af1ed4208d297ab14c92e695c999_96.webp', url: 'https://modrinth.com/shader/insanity-shader' },
      { match: /astralex/i, title: 'AstraLex Shaders', author: 'Luxferre', slug: 'astralex-shaders', icon: 'https://cdn.modrinth.com/data/RphJSnEs/3e25ea407447bf2ff8ffa8926cd2db295307cf68_96.webp', url: 'https://modrinth.com/shader/astralex-shaders' },
      { match: /mellow/i, title: 'Mellow Shaders', author: 'TheCMK', slug: 'mellow-shaders', icon: 'https://cdn.modrinth.com/data/BUxf36AP/b2cc2e9b97e5e0c4c7fcd89b7e295f29a29b9c6d_96.webp', url: 'https://modrinth.com/shader/mellow-shaders' },
      { match: /sildur/i, title: "Sildur's Enhanced Default", author: 'Sildur', slug: 'sildurs-enhanced-default', icon: 'https://cdn.modrinth.com/data/z8EjLYqN/ced1ec11046d063d8ff681769061db8f5a29134f_96.webp', url: 'https://modrinth.com/shader/sildurs-enhanced-default' },
      { match: /seus/i, title: 'SEUS Renewed', author: 'sonicether', icon: 'https://cdn.modrinth.com/data/X5X6B1nF/0b1c036ca6d5cbeacb0c5ba9d16a698a964f43c8_96.webp', url: 'https://www.sonicether.com/seus/' },
      { match: /nostalgia/i, title: 'Nostalgia Shader', author: 'RRe36', slug: 'nostalgia-shader', icon: 'https://cdn.modrinth.com/data/xEItlMn3/49ba53348dd4902ad2a3ae49cc643550ead201bc.png', url: 'https://modrinth.com/shader/nostalgia-shader' },
      { match: /kappa/i, title: 'Kappa Shader', author: 'RRe36', slug: 'kappa-shader', icon: 'https://cdn.modrinth.com/data/rL2o0wFp/34e0cb97089405d4b533dbbb1946059e72658864_96.webp', url: 'https://modrinth.com/shader/kappa-shader' },
      { match: /pastel/i, title: 'Pastel Shaders', author: 'Geckolib', slug: 'pastel-shaders', icon: 'https://cdn.modrinth.com/data/nZ8H4yMh/9779ee66ca3ffb2d861dcf30f81d1e4c3aa1fcb3_96.webp', url: 'https://modrinth.com/shader/pastel-shaders' },
      { match: /spook/i, title: 'Spook Shaders', author: 'Community', slug: 'spook-shaders', icon: 'https://cdn.modrinth.com/data/N0q7Fvhf/2e2a8624138e653063fdfd412ba7a177263bda49_96.webp', url: 'https://modrinth.com/shader/spook-shaders' },
      { match: /noble/i, title: 'Noble Shaders', author: 'Belmu', slug: 'noble-shaders', icon: 'https://cdn.modrinth.com/data/3gYFpB7z/d8c116c93f0b2f54a8b792e39ff754e666014e74_96.webp', url: 'https://modrinth.com/shader/noble-shaders' },
      { match: /chocapic/i, title: "Chocapic13' Shaders", author: 'Chocapic13', slug: 'chocapic13-shaders', icon: 'https://cdn.modrinth.com/data/Wb5O1M3W/c5e53bc7709ef6fc3538466f2c317ce4221ea5c1_96.webp', url: 'https://modrinth.com/shader/chocapic13-shaders' },
      { match: /tea.*shader/i, title: 'Tea Shaders', author: 'BeyondBelief', slug: 'tea-shaders', icon: 'https://cdn.modrinth.com/data/3M1X9w2G/1eb59adfbdd259837c768beaa740c49ee68df8eb_96.webp', url: 'https://modrinth.com/shader/tea-shaders' },
      { match: /shrimple/i, title: 'Shrimple Shader', author: 'Antonio', slug: 'shrimple', icon: 'https://cdn.modrinth.com/data/2Xw9o9H1/9a41ee981f9a2db12be6759fc16f1d5e5e40880d_96.webp', url: 'https://modrinth.com/shader/shrimple' },
      { match: /vanilla.*plus/i, title: 'Vanilla Plus Shaders', author: 'RRe36', slug: 'vanilla-plus-shader', icon: 'https://cdn.modrinth.com/data/1KFsBEH7/b0a68e8156fb157e10dfca89e24aa5a9cf29bb85_96.webp', url: 'https://modrinth.com/shader/vanilla-plus-shader' },
      { match: /miniature/i, title: 'Miniature Shader', author: 'Xonk', slug: 'miniature-shader', icon: 'https://cdn.modrinth.com/data/JqY7ZfZo/b97d287bb175d688402ee3847a964593bc857181_96.webp', url: 'https://modrinth.com/shader/miniature-shader' },
      { match: /eclipse/i, title: 'Eclipse Shaders', author: 'Community', slug: 'eclipse-shaders', icon: 'https://cdn.modrinth.com/data/s8ZCVd1a/eabeacef221a8a550d446ede0c8d383aa8061b94_96.webp', url: 'https://modrinth.com/shader/eclipse-shaders' }
    ];

    for (const f of files) {
      const fullPath = path.join(spDir, f);
      const stat = await fs.promises.stat(fullPath);
      const isZip = f.endsWith('.zip') || f.endsWith('.zip.disabled');
      const isDir = stat.isDirectory();

      if (!isZip && !isDir) continue;

      const enabled = !f.endsWith('.disabled');
      const rawBaseName = f.replace(/\.disabled$/, '').replace(/\.zip$/, '');
      let cleanName = rawBaseName.replace(/[-_]/g, ' ').trim();
      let version = '';
      let author = '';
      let icon: string | undefined;
      let url: string | undefined;
      let description = 'Minecraft Shader Pack';
      const sizeBytes = stat.size || 0;

      // Version extraction
      const verMatch = rawBaseName.match(/(?:v|r|_|-|\s)([0-9]+(?:\.[0-9a-zA-Z_-]+)+)/i) ||
                       rawBaseName.match(/([0-9]+\.[0-9]+(?:\.[0-9]+)?)/);
      if (verMatch && verMatch[1]) {
        version = verMatch[1].replace(/^[_-]/, '');
      }

      // Check against popular shaders dictionary
      const matchedPopular = POPULAR_SHADERS.find((p) => p.match.test(rawBaseName) || p.match.test(cleanName));
      if (matchedPopular) {
        cleanName = matchedPopular.title;
        author = matchedPopular.author;
        url = matchedPopular.url || (matchedPopular.slug ? `https://modrinth.com/shader/${matchedPopular.slug}` : undefined);
        icon = matchedPopular.icon;
      }

      // Try reading pack.png or shader pack icons if available locally inside the zip
      if (isZip) {
        try {
          const zip = new AdmZip(fullPath);
          const iconEntry = zip.getEntry('pack.png') || zip.getEntry('shaders/pack.png') || zip.getEntry('icon.png');
          if (iconEntry) {
            icon = `data:image/png;base64,${iconEntry.getData().toString('base64')}`;
          }
        } catch {}
      }

      // Dynamic online search & caching for unknown shaders
      if (!icon) {
        const cached = this.shaderIconCache.get(rawBaseName) || this.shaderIconCache.get(cleanName);
        if (cached) {
          if (cached.icon) icon = cached.icon;
          if (cached.author && !author) author = cached.author;
          if (cached.title && cleanName === rawBaseName.replace(/[-_]/g, ' ').trim()) cleanName = cached.title;
          if (cached.url && !url) url = cached.url;
        } else {
          try {
            const queryName = cleanName.replace(/[0-9.]+/g, '').trim() || cleanName;
            const res = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(queryName)}&limit=1&facets=[["project_type:shader"]]`, {
              headers: { 'User-Agent': 'GalaxyLauncher/1.0.4' }
            });
            if (res.ok) {
              const data = await res.json() as any;
              if (data.hits && data.hits.length > 0) {
                const hit = data.hits[0];
                if (hit.icon_url) icon = hit.icon_url;
                if (hit.author && !author) author = hit.author;
                if (hit.title && cleanName === rawBaseName.replace(/[-_]/g, ' ').trim()) cleanName = hit.title;
                if (hit.slug && !url) url = `https://modrinth.com/shader/${hit.slug}`;
                this.shaderIconCache.set(rawBaseName, { icon, author, title: cleanName, url });
              }
            }
          } catch {}
        }
      }

      if (!url) {
        url = `https://modrinth.com/shaders?q=${encodeURIComponent(cleanName)}`;
      }

      shaders.push({
        filename: f,
        name: cleanName,
        version: version || 'Release',
        description,
        icon,
        enabled,
        authors: author ? [author] : [],
        path: fullPath,
        sizeBytes,
        url
      });
    }
    return shaders;
  }

  public async toggleResourcePack(instanceId: string, filename: string, enabled: boolean): Promise<boolean> {
    const rpDir = path.join(this.instancesDir, instanceId, 'resourcepacks');
    const isCurrentlyDisabled = filename.endsWith('.disabled');

    if (enabled && isCurrentlyDisabled) {
      const src = path.join(rpDir, filename);
      const dest = path.join(rpDir, filename.replace(/\.disabled$/, ''));
      if (fs.existsSync(src)) {
        await fs.promises.rename(src, dest);
        return true;
      }
    } else if (!enabled && !isCurrentlyDisabled) {
      const src = path.join(rpDir, filename);
      const dest = path.join(rpDir, `${filename}.disabled`);
      if (fs.existsSync(src)) {
        await fs.promises.rename(src, dest);
        return true;
      }
    }
    return false;
  }

  public async toggleShaderPack(instanceId: string, filename: string, enabled: boolean): Promise<boolean> {
    const spDir = path.join(this.instancesDir, instanceId, 'shaderpacks');
    const isCurrentlyDisabled = filename.endsWith('.disabled');

    if (enabled && isCurrentlyDisabled) {
      const src = path.join(spDir, filename);
      const dest = path.join(spDir, filename.replace(/\.disabled$/, ''));
      if (fs.existsSync(src)) {
        await fs.promises.rename(src, dest);
        return true;
      }
    } else if (!enabled && !isCurrentlyDisabled) {
      const src = path.join(spDir, filename);
      const dest = path.join(spDir, `${filename}.disabled`);
      if (fs.existsSync(src)) {
        await fs.promises.rename(src, dest);
        return true;
      }
    }
    return false;
  }

  public async deleteResourcePack(instanceId: string, filename: string): Promise<boolean> {
    const rpPath = path.join(this.instancesDir, instanceId, 'resourcepacks', filename);
    if (fs.existsSync(rpPath)) {
      const stat = await fs.promises.stat(rpPath);
      if (stat.isDirectory()) {
        await fs.promises.rm(rpPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(rpPath);
      }
      return true;
    }
    return false;
  }

  public async deleteShaderPack(instanceId: string, filename: string): Promise<boolean> {
    const spPath = path.join(this.instancesDir, instanceId, 'shaderpacks', filename);
    if (fs.existsSync(spPath)) {
      const stat = await fs.promises.stat(spPath);
      if (stat.isDirectory()) {
        await fs.promises.rm(spPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(spPath);
      }
      return true;
    }
    return false;
  }

  public async getWorldSaves(instanceId: string): Promise<WorldSave[]> {
    const savesDir = path.join(this.instancesDir, instanceId, 'saves');
    if (!fs.existsSync(savesDir)) {
      await fs.promises.mkdir(savesDir, { recursive: true });
      return [];
    }
    const entries = await fs.promises.readdir(savesDir, { withFileTypes: true });
    const worlds: WorldSave[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const worldPath = path.join(savesDir, entry.name);
        const stat = await fs.promises.stat(worldPath);
        let iconUrl: string | undefined;
        const iconPath = path.join(worldPath, 'icon.png');
        if (fs.existsSync(iconPath)) {
          const buf = await fs.promises.readFile(iconPath);
          iconUrl = `data:image/png;base64,${buf.toString('base64')}`;
        }
        worlds.push({
          folderName: entry.name,
          name: entry.name,
          lastPlayed: stat.mtimeMs,
          sizeBytes: 1024 * 1024 * 15, // Approximate
          icon: iconUrl,
          gameMode: 'Survival'
        });
      }
    }
    return worlds;
  }

  // --- World Backups & Restoration ---
  public async createWorldBackup(instanceId: string, worldFolderName: string): Promise<{
    id: string;
    filename: string;
    worldName: string;
    timestamp: string;
    sizeBytes: number;
  }> {
    const worldDir = path.join(this.instancesDir, instanceId, 'saves', worldFolderName);
    if (!fs.existsSync(worldDir)) {
      throw new Error(`World save "${worldFolderName}" not found`);
    }

    const backupsDir = path.join(this.instancesDir, instanceId, 'backups');
    await fs.promises.mkdir(backupsDir, { recursive: true });

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFilename = `${worldFolderName}-backup-${dateStr}.zip`;
    const backupPath = path.join(backupsDir, backupFilename);

    const zip = new AdmZip();
    zip.addLocalFolder(worldDir, worldFolderName);
    await zip.writeZipPromise(backupPath);

    const stat = await fs.promises.stat(backupPath);
    return {
      id: backupFilename,
      filename: backupFilename,
      worldName: worldFolderName,
      timestamp: new Date().toISOString(),
      sizeBytes: stat.size
    };
  }

  public async listWorldBackups(instanceId: string): Promise<{
    id: string;
    filename: string;
    worldName: string;
    timestamp: string;
    sizeBytes: number;
  }[]> {
    const backupsDir = path.join(this.instancesDir, instanceId, 'backups');
    if (!fs.existsSync(backupsDir)) {
      return [];
    }

    const files = await fs.promises.readdir(backupsDir);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.zip')) {
        const fullPath = path.join(backupsDir, file);
        const stat = await fs.promises.stat(fullPath);
        const worldName = file.split('-backup-')[0] || file.replace('.zip', '');
        backups.push({
          id: file,
          filename: file,
          worldName,
          timestamp: stat.mtime.toISOString(),
          sizeBytes: stat.size
        });
      }
    }

    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return backups;
  }

  public async restoreWorldBackup(instanceId: string, backupFilename: string): Promise<boolean> {
    const backupPath = path.join(this.instancesDir, instanceId, 'backups', backupFilename);
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }

    const savesDir = path.join(this.instancesDir, instanceId, 'saves');
    await fs.promises.mkdir(savesDir, { recursive: true });

    const zip = new AdmZip(backupPath);
    zip.extractAllTo(savesDir, true);
    return true;
  }

  public async deleteWorldBackup(instanceId: string, backupFilename: string): Promise<boolean> {
    const backupPath = path.join(this.instancesDir, instanceId, 'backups', backupFilename);
    if (fs.existsSync(backupPath)) {
      await fs.promises.unlink(backupPath);
      return true;
    }
    return false;
  }

  // --- Local Modpack Importer (.mrpack & .zip) ---
  public async importLocalModpack(filePath: string, customName?: string): Promise<Instance> {
    if (!fs.existsSync(filePath)) {
      throw new Error('Selected modpack file does not exist');
    }

    const zip = new AdmZip(filePath);
    const baseName = customName || path.basename(filePath, path.extname(filePath));

    // Check for Modrinth format (modrinth.index.json)
    const mrIndex = zip.getEntry('modrinth.index.json');
    if (mrIndex) {
      const meta = JSON.parse(mrIndex.getData().toString('utf-8'));
      const mcVersion = meta.dependencies?.minecraft || '1.20.4';
      let loader: ModLoader = 'fabric';
      let loaderVersion: string | undefined = undefined;

      if (meta.dependencies?.forge) {
        loader = 'forge';
        loaderVersion = meta.dependencies.forge;
      } else if (meta.dependencies?.neoforge) {
        loader = 'neoforge';
        loaderVersion = meta.dependencies.neoforge;
      } else if (meta.dependencies?.quilt) {
        loader = 'quilt';
        loaderVersion = meta.dependencies.quilt;
      } else if (meta.dependencies?.['fabric-loader']) {
        loader = 'fabric';
        loaderVersion = meta.dependencies['fabric-loader'];
      }

      const instance = await this.createInstance({
        name: meta.name || baseName,
        version: mcVersion,
        loader,
        loaderVersion
      });

      const instanceDir = this.getInstancePath(instance.id);

      // Extract overrides
      const entries = zip.getEntries();
      for (const entry of entries) {
        if (entry.entryName.startsWith('overrides/') && !entry.isDirectory) {
          const relativePath = entry.entryName.replace(/^overrides\//, '');
          const targetPath = path.join(instanceDir, relativePath);
          await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.promises.writeFile(targetPath, entry.getData());
        }
      }

      return instance;
    }

    // Check for CurseForge format (manifest.json)
    const cfManifest = zip.getEntry('manifest.json');
    if (cfManifest) {
      const meta = JSON.parse(cfManifest.getData().toString('utf-8'));
      const mcVersion = meta.minecraft?.version || '1.20.1';
      let loader: ModLoader = 'forge';
      let loaderVersion: string | undefined = undefined;

      const loaderId = meta.minecraft?.modLoaders?.[0]?.id || '';
      if (loaderId.startsWith('fabric-')) {
        loader = 'fabric';
        loaderVersion = loaderId.replace('fabric-', '');
      } else if (loaderId.startsWith('forge-')) {
        loader = 'forge';
        loaderVersion = loaderId.replace('forge-', '');
      } else if (loaderId.startsWith('neoforge-')) {
        loader = 'neoforge';
        loaderVersion = loaderId.replace('neoforge-', '');
      }

      const instance = await this.createInstance({
        name: meta.name || baseName,
        version: mcVersion,
        loader,
        loaderVersion
      });

      const instanceDir = this.getInstancePath(instance.id);

      // Extract overrides
      const entries = zip.getEntries();
      const overridePrefix = (meta.overrides || 'overrides') + '/';
      for (const entry of entries) {
        if (entry.entryName.startsWith(overridePrefix) && !entry.isDirectory) {
          const relativePath = entry.entryName.slice(overridePrefix.length);
          const targetPath = path.join(instanceDir, relativePath);
          await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.promises.writeFile(targetPath, entry.getData());
        }
      }

      return instance;
    }

    // Standard zip folder extraction fallback
    const instance = await this.createInstance({
      name: baseName,
      version: '1.20.4',
      loader: 'fabric'
    });
    const instanceDir = this.getInstancePath(instance.id);
    zip.extractAllTo(instanceDir, true);
    return instance;
  }

  public async generateShareCode(instanceId: string): Promise<InstanceShareData> {
    const inst = await this.getInstance(instanceId);
    if (!inst) throw new Error('Instance not found');

    const mods = await this.getMods(instanceId);
    const shaders = await this.getShaderPacks(instanceId);
    const resourcePacks = await this.getResourcePacks(instanceId);

    // Generate a unique 4-character alphanumeric suffix: e.g. GLX-8942
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
    const code = `GLX-${rand}`;

    const payload = {
      glx: '1.0',
      code,
      name: inst.name,
      version: inst.version,
      loader: inst.loader,
      loaderVersion: inst.loaderVersion,
      icon: inst.icon,
      iconBackground: inst.iconBackground,
      memoryMin: inst.memoryMin,
      memoryMax: inst.memoryMax,
      jvmArgs: inst.jvmArgs,
      mods: mods.map(m => ({ filename: m.filename, name: m.name, version: m.version, id: m.id, url: m.url })),
      shaders: shaders.map(s => ({ filename: s.filename, name: s.name })),
      resourcePacks: resourcePacks.map(r => ({ filename: r.filename, name: r.name }))
    };

    // Save to share-codes registry in instancesDir
    const registryPath = path.join(this.instancesDir, 'share-codes.json');
    let registry: Record<string, any> = {};
    try {
      if (fs.existsSync(registryPath)) {
        registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      }
    } catch {}
    registry[code] = payload;
    try {
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf8');
    } catch {}

    const jsonStr = JSON.stringify(payload);
    const base64Str = Buffer.from(jsonStr, 'utf8').toString('base64');
    const shareString = `${code}:${base64Str}`;

    return {
      code,
      shareString,
      instanceName: inst.name,
      version: inst.version,
      loader: inst.loader,
      modsCount: mods.length,
      payload
    };
  }

  public async importFromShareCode(codeOrPayload: string, customName?: string): Promise<Instance> {
    if (!codeOrPayload || typeof codeOrPayload !== 'string') {
      throw new Error('Invalid share code provided');
    }

    const trimmed = codeOrPayload.trim();
    let data: any = null;

    // Check if it's full format: GLX-XXXX:<base64>
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const b64 = parts.slice(1).join(':');
      try {
        const decoded = Buffer.from(b64, 'base64').toString('utf8');
        data = JSON.parse(decoded);
      } catch (e) {
        console.warn('Failed to decode base64 share payload, checking registry...');
      }
    }

    // If still null, check if JSON string directly
    if (!data && trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        data = JSON.parse(trimmed);
      } catch {}
    }

    // If still null, check local share-codes.json registry
    if (!data) {
      const cleanCode = trimmed.toUpperCase().startsWith('GLX-') ? trimmed.toUpperCase() : `GLX-${trimmed.toUpperCase()}`;
      const registryPath = path.join(this.instancesDir, 'share-codes.json');
      if (fs.existsSync(registryPath)) {
        try {
          const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
          if (registry[cleanCode]) {
            data = registry[cleanCode];
          }
        } catch {}
      }
    }

    if (!data) {
      throw new Error(`Could not resolve share code "${trimmed}". Please paste the full share code string.`);
    }

    // Create the instance
    const finalName = customName?.trim() || data.name || 'Shared Instance';
    const instance = await this.createInstance({
      name: finalName,
      version: data.version || '1.20.4',
      loader: data.loader || 'fabric',
      loaderVersion: data.loaderVersion,
      icon: data.icon || 'grass_block',
      iconBackground: data.iconBackground || 'obsidian',
      memoryMin: data.memoryMin || 2048,
      memoryMax: data.memoryMax || 4096,
      jvmArgs: data.jvmArgs
    });

    const instanceDir = this.getInstancePath(instance.id);
    const modsDir = path.join(instanceDir, 'mods');
    const shadersDir = path.join(instanceDir, 'shaderpacks');
    const resourcePacksDir = path.join(instanceDir, 'resourcepacks');

    fs.mkdirSync(modsDir, { recursive: true });
    fs.mkdirSync(shadersDir, { recursive: true });
    fs.mkdirSync(resourcePacksDir, { recursive: true });

    // Store share-manifest.json for reference
    const shareMetaPath = path.join(instanceDir, 'share-manifest.json');
    fs.writeFileSync(shareMetaPath, JSON.stringify(data, null, 2), 'utf8');

    return instance;
  }
}
