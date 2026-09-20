import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { Instance, Mod, ResourcePack, ShaderPack, WorldSave, ModLoader } from '../preload/types';

export class InstanceManager {
  private instancesDir: string;

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
            instances.push(inst);
          } catch (err) {
            console.error(`Failed to parse instance config in ${entry.name}:`, err);
          }
        }
      }
    }

    // Sort by lastPlayed or createdAt descending
    instances.sort((a, b) => {
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
      icon: options.icon || (options.loader === 'fabric' ? 'fabric' : options.loader === 'forge' ? 'forge' : 'grass'),
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

  public async cloneInstance(instanceId: string, newName: string): Promise<Instance | null> {
    const original = await this.getInstance(instanceId);
    if (!original) return null;

    const newId = newName.toLowerCase().replace(/[^a-z0-9_-]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const srcDir = path.join(this.instancesDir, instanceId);
    const destDir = path.join(this.instancesDir, newId);

    // Recursive copy directory
    await fs.promises.cp(srcDir, destDir, { recursive: true });

    const clonedInstance: Instance = {
      ...original,
      id: newId,
      name: newName,
      createdAt: new Date().toISOString(),
      lastPlayed: undefined,
      playTimeMinutes: 0
    };

    const configPath = path.join(destDir, 'instance.json');
    await fs.promises.writeFile(configPath, JSON.stringify(clonedInstance, null, 2), 'utf-8');
    return clonedInstance;
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

          if (displayNameMatch && displayNameMatch[1]) name = displayNameMatch[1];
          if (versionMatch && versionMatch[1]) version = versionMatch[1];
          if (descMatch && descMatch[1]) description = descMatch[1].trim();
          if (modIdMatch && modIdMatch[1]) modId = modIdMatch[1];
          if (authorMatch && authorMatch[1]) authors = [authorMatch[1]];
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
            }
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

  // --- Resource Packs & Shaders ---
  public async getResourcePacks(instanceId: string): Promise<ResourcePack[]> {
    const rpDir = path.join(this.instancesDir, instanceId, 'resourcepacks');
    if (!fs.existsSync(rpDir)) {
      await fs.promises.mkdir(rpDir, { recursive: true });
      return [];
    }
    const files = await fs.promises.readdir(rpDir);
    const packs: ResourcePack[] = [];

    for (const f of files) {
      const fullPath = path.join(rpDir, f);
      const stat = await fs.promises.stat(fullPath);
      if (f.endsWith('.zip') || stat.isDirectory()) {
        packs.push({
          filename: f,
          name: f.replace(/\.zip$/, ''),
          description: 'Resource Pack',
          enabled: true,
          path: fullPath
        });
      }
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

    for (const f of files) {
      const fullPath = path.join(spDir, f);
      const stat = await fs.promises.stat(fullPath);
      if (f.endsWith('.zip') || stat.isDirectory()) {
        shaders.push({
          filename: f,
          name: f.replace(/\.zip$/, ''),
          enabled: true,
          path: fullPath
        });
      }
    }
    return shaders;
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
}
