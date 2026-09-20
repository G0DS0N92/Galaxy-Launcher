import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { Downloader } from './downloader';
import { MarketplaceProject, MarketplaceVersion } from '../preload/types';
import { InstanceManager } from './instanceManager';

export class MarketplaceService {
  private static readonly MODRINTH_API = 'https://api.modrinth.com/v2';

  public static async searchProjects(params: {
    query?: string;
    projectType?: 'mod' | 'modpack' | 'resourcepack' | 'shader';
    gameVersion?: string;
    loader?: string;
    category?: string;
    sortBy?: 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';
    limit?: number;
    offset?: number;
  }): Promise<{ projects: MarketplaceProject[]; totalHits: number }> {
    const query = params.query || '';
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    const index = params.sortBy || 'downloads';

    const facets: string[][] = [];

    if (params.projectType) {
      facets.push([`project_type:${params.projectType}`]);
    }
    if (params.gameVersion) {
      facets.push([`versions:${params.gameVersion}`]);
    }
    if (params.loader && params.loader !== 'vanilla') {
      facets.push([`categories:${params.loader}`]);
    }
    if (params.category) {
      facets.push([`categories:${params.category}`]);
    }

    const encodedFacets = facets.length > 0 ? encodeURIComponent(JSON.stringify(facets)) : '';
    let url = `${this.MODRINTH_API}/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&index=${index}`;
    if (encodedFacets) {
      url += `&facets=${encodedFacets}`;
    }

    try {
      const data = await Downloader.fetchJson<any>(url);
      const hits = data.hits || [];
      const projects: MarketplaceProject[] = hits.map((h: any) => ({
        id: h.project_id,
        slug: h.slug,
        title: h.title,
        description: h.description,
        categories: h.categories || [],
        clientSide: h.client_side,
        serverSide: h.server_side,
        iconUrl: h.icon_url,
        downloads: h.downloads || 0,
        follows: h.follows || 0,
        dateUpdated: h.date_modified,
        author: h.author,
        projectType: h.project_type as any,
        gallery: h.gallery || []
      }));

      return { projects, totalHits: data.total_hits || 0 };
    } catch (err) {
      console.error('Failed to search Modrinth projects:', err);
      return { projects: [], totalHits: 0 };
    }
  }

  public static async getProjectDetails(projectIdOrSlug: string): Promise<MarketplaceProject | null> {
    try {
      const data = await Downloader.fetchJson<any>(`${this.MODRINTH_API}/project/${projectIdOrSlug}`);
      return {
        id: data.id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        categories: data.categories || [],
        clientSide: data.client_side,
        serverSide: data.server_side,
        iconUrl: data.icon_url,
        downloads: data.downloads || 0,
        follows: data.followers || 0,
        dateUpdated: data.updated,
        author: '',
        projectType: data.project_type as any,
        gallery: (data.gallery || []).map((g: any) => g.url)
      };
    } catch (err) {
      console.error(`Failed to get project details for ${projectIdOrSlug}:`, err);
      return null;
    }
  }

  public static async getProjectVersions(projectIdOrSlug: string, loaders?: string[], gameVersions?: string[]): Promise<MarketplaceVersion[]> {
    try {
      let url = `${this.MODRINTH_API}/project/${projectIdOrSlug}/version`;
      const queryParams: string[] = [];
      if (loaders && loaders.length > 0) {
        const cleanLoaders = loaders
          .map((l) => (l || '').toLowerCase().trim())
          .filter((l) => l && l !== 'vanilla');
        if (cleanLoaders.length > 0) {
          queryParams.push(`loaders=${encodeURIComponent(JSON.stringify(cleanLoaders))}`);
        }
      }
      if (gameVersions && gameVersions.length > 0) {
        const cleanGameVersions = gameVersions
          .map((v) => (v || '').trim())
          .filter(Boolean);
        if (cleanGameVersions.length > 0) {
          queryParams.push(`game_versions=${encodeURIComponent(JSON.stringify(cleanGameVersions))}`);
        }
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const list = await Downloader.fetchJson<any[]>(url);
      return list.map((v: any) => ({
        id: v.id,
        versionNumber: v.version_number,
        name: v.name,
        gameVersions: v.game_versions || [],
        loaders: v.loaders || [],
        files: (v.files || []).map((f: any) => ({
          url: f.url,
          filename: f.filename,
          primary: f.primary,
          size: f.size,
          hashes: f.hashes || {}
        })),
        dependencies: (v.dependencies || []).map((d: any) => ({
          version_id: d.version_id,
          project_id: d.project_id,
          file_name: d.file_name,
          dependency_type: d.dependency_type
        })),
        datePublished: v.date_published,
        versionType: v.version_type
      }));
    } catch (err) {
      console.error(`Failed to get versions for ${projectIdOrSlug}:`, err);
      return [];
    }
  }

  public static async getVersionById(versionId: string): Promise<MarketplaceVersion | null> {
    try {
      const v = await Downloader.fetchJson<any>(`${this.MODRINTH_API}/version/${versionId}`);
      return {
        id: v.id,
        versionNumber: v.version_number,
        name: v.name,
        gameVersions: v.game_versions || [],
        loaders: v.loaders || [],
        files: (v.files || []).map((f: any) => ({
          url: f.url,
          filename: f.filename,
          primary: f.primary,
          size: f.size,
          hashes: f.hashes || {}
        })),
        dependencies: (v.dependencies || []).map((d: any) => ({
          version_id: d.version_id,
          project_id: d.project_id,
          file_name: d.file_name,
          dependency_type: d.dependency_type
        })),
        datePublished: v.date_published,
        versionType: v.version_type
      };
    } catch (err) {
      console.error(`Failed to get version by id ${versionId}:`, err);
      return null;
    }
  }

  public static async installItemToInstance(
    instanceManager: InstanceManager,
    instanceId: string,
    projectType: 'mod' | 'resourcepack' | 'shader',
    downloadUrl: string,
    filename: string,
    sha1?: string,
    onProgress?: (bytes: number, total: number) => void
  ): Promise<string> {
    const instancePath = instanceManager.getInstancePath(instanceId);
    let targetSubDir = 'mods';
    if (projectType === 'resourcepack') targetSubDir = 'resourcepacks';
    if (projectType === 'shader') targetSubDir = 'shaderpacks';

    const targetDir = path.join(instancePath, targetSubDir);
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Clean up older duplicate version of the same mod if present
    if (projectType === 'mod') {
      try {
        const existingFiles = await fs.promises.readdir(targetDir);
        const cleanBase = filename.split(/[-_+v\d]/)[0]?.toLowerCase();
        if (cleanBase && cleanBase.length >= 3) {
          for (const ex of existingFiles) {
            if (ex !== filename && ex.toLowerCase().startsWith(cleanBase) && (ex.endsWith('.jar') || ex.endsWith('.jar.disabled'))) {
              try {
                await fs.promises.unlink(path.join(targetDir, ex));
              } catch {}
            }
          }
        }
      } catch {}
    }

    const destPath = path.join(targetDir, filename);
    await Downloader.downloadFile(downloadUrl, destPath, sha1, onProgress);
    return destPath;
  }

  public static async installModWithDependencies(
    instanceManager: InstanceManager,
    instanceId: string,
    modDownloadUrl: string,
    modFilename: string,
    modSha1: string | undefined,
    versionDependencies: any[] | undefined,
    loader: string,
    gameVersion: string,
    onProgress?: (filename: string, bytes: number, total: number) => void
  ): Promise<{ installedFiles: string[]; dependencyNames: string[] }> {
    const installedFiles: string[] = [];
    const dependencyNames: string[] = [];
    const visitedProjects = new Set<string>();
    const visitedVersions = new Set<string>();

    // 1. Download the target mod
    await this.installItemToInstance(
      instanceManager,
      instanceId,
      'mod',
      modDownloadUrl,
      modFilename,
      modSha1,
      (bytes, total) => onProgress?.(modFilename, bytes, total)
    );
    installedFiles.push(modFilename);

    // 2. Recursive dependency resolution helper
    const resolveAndInstallDeps = async (deps: any[]) => {
      const requiredDeps = deps.filter((d: any) => d && d.dependency_type === 'required');
      for (const dep of requiredDeps) {
        try {
          let depVer: MarketplaceVersion | null = null;
          let depProjId = dep.project_id;

          if (dep.version_id) {
            if (visitedVersions.has(dep.version_id)) continue;
            visitedVersions.add(dep.version_id);
            depVer = await this.getVersionById(dep.version_id);
          } else if (dep.project_id) {
            if (visitedProjects.has(dep.project_id)) continue;
            visitedProjects.add(dep.project_id);
            const vers = await this.getProjectVersions(dep.project_id, [loader], [gameVersion]);
            depVer = vers[0] || (await this.getProjectVersions(dep.project_id))[0] || null;
          }

          if (!depVer || !depVer.files || depVer.files.length === 0) continue;

          const depFile = depVer.files.find((f) => f.primary) || depVer.files[0];
          if (!depFile || !depFile.url) continue;

          // Check if file or mod is already installed in the instance
          const instanceMods = await instanceManager.getMods(instanceId);
          const alreadyHasFile = instanceMods.some((m) =>
            m.filename.toLowerCase() === depFile.filename.toLowerCase() ||
            (depProjId && m.filename.toLowerCase().includes(depProjId.toLowerCase()))
          );

          if (!alreadyHasFile) {
            await this.installItemToInstance(
              instanceManager,
              instanceId,
              'mod',
              depFile.url,
              depFile.filename,
              depFile.hashes?.sha1,
              (bytes, total) => onProgress?.(depFile.filename, bytes, total)
            );
            installedFiles.push(depFile.filename);
            const niceName = depVer.name || depFile.filename.replace(/\.jar$/i, '');
            if (!dependencyNames.includes(niceName)) {
              dependencyNames.push(niceName);
            }

            // Recurse into dependencies of this dependency
            if (depVer.dependencies && depVer.dependencies.length > 0) {
              await resolveAndInstallDeps(depVer.dependencies);
            }
          }
        } catch (depErr) {
          console.warn('[Marketplace] Could not auto-install dependency:', dep, depErr);
        }
      }
    };

    if (versionDependencies && versionDependencies.length > 0) {
      await resolveAndInstallDeps(versionDependencies);
    }

    return { installedFiles, dependencyNames };
  }

  public static async installModpack(
    instanceManager: InstanceManager,
    mrpackUrl: string,
    modpackName: string,
    onProgress?: (completed: number, total: number, currentItem?: string) => void
  ): Promise<string> {
    const tempDir = path.join(instanceManager.getInstancesDir(), '.temp-modpack-' + Date.now());
    await fs.promises.mkdir(tempDir, { recursive: true });
    const mrpackPath = path.join(tempDir, 'pack.mrpack');

    try {
      await Downloader.downloadFile(mrpackUrl, mrpackPath);
      const zip = new AdmZip(mrpackPath);
      const indexEntry = zip.getEntry('modrinth.index.json');
      if (!indexEntry) {
        throw new Error('Invalid .mrpack archive: modrinth.index.json not found');
      }

      const indexData = JSON.parse(indexEntry.getData().toString('utf-8'));
      const mcVersion = indexData.dependencies?.minecraft || '1.20.4';
      let loader: any = 'fabric';
      let loaderVersion: string | undefined;

      if (indexData.dependencies?.fabric) {
        loader = 'fabric';
        loaderVersion = indexData.dependencies.fabric;
      } else if (indexData.dependencies?.forge) {
        loader = 'forge';
        loaderVersion = indexData.dependencies.forge;
      } else if (indexData.dependencies?.neoforge) {
        loader = 'neoforge';
        loaderVersion = indexData.dependencies.neoforge;
      } else if (indexData.dependencies?.quilt) {
        loader = 'quilt';
        loaderVersion = indexData.dependencies.quilt;
      }

      // Create new instance for modpack
      const newInstance = await instanceManager.createInstance({
        name: modpackName || indexData.name || 'Modpack Instance',
        version: mcVersion,
        loader,
        loaderVersion,
        banner: 'modpack'
      });

      const instanceDir = instanceManager.getInstancePath(newInstance.id);

      // Extract overrides directory if present
      const zipEntries = zip.getEntries();
      for (const entry of zipEntries) {
        if (entry.entryName.startsWith('overrides/') && !entry.isDirectory) {
          const relativePath = entry.entryName.replace(/^overrides\//, '');
          const targetPath = path.join(instanceDir, relativePath);
          await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
          await fs.promises.writeFile(targetPath, entry.getData());
        }
      }

      // Download all files specified in modrinth.index.json
      const filesToDownload: any[] = indexData.files || [];
      const downloadTasks = filesToDownload.map((f: any) => ({
        url: f.downloads[0],
        destination: path.join(instanceDir, f.path),
        sha1: f.hashes?.sha1,
        size: f.fileSize
      }));

      await Downloader.downloadParallel(downloadTasks, 6, onProgress);
      return newInstance.id;
    } finally {
      // Clean up temp
      await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
