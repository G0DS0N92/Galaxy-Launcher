import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import AdmZip from 'adm-zip';
import { JavaInstallation } from '../preload/types';

const execAsync = promisify(exec);

export class JavaDetector {
  private static cachedJavaList: JavaInstallation[] = [];

  public static async detectAllJava(customRuntimesDir?: string): Promise<JavaInstallation[]> {
    const results: Map<string, JavaInstallation> = new Map();
    const candidates: string[] = [];

    // 1. Check JAVA_HOME
    if (process.env.JAVA_HOME) {
      const javaExe = process.platform === 'win32'
        ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe')
        : path.join(process.env.JAVA_HOME, 'bin', 'java');
      candidates.push(javaExe);
    }

    // 2. Check PATH 'java'
    try {
      const whichCmd = process.platform === 'win32' ? 'where java' : 'which java';
      const pathJava = execSync(whichCmd, { encoding: 'utf-8' }).trim().split(/\r?\n/);
      for (const line of pathJava) {
        if (line && fs.existsSync(line)) {
          candidates.push(line.trim());
        }
      }
    } catch {
      // Ignored if where/which fails
    }

    // 3. Check custom launcher runtimes directory
    const appData = process.env['APPDATA'] || (process.platform === 'darwin' ? process.env['HOME'] + '/Library/Preferences' : '/var/local');
    const defaultRuntimesDir = customRuntimesDir || path.join(appData, 'GalaxyLauncher', 'runtimes');
    if (fs.existsSync(defaultRuntimesDir)) {
      try {
        const findJavaInDir = (dir: string, depth = 0) => {
          if (depth > 4) return;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
              findJavaInDir(full, depth + 1);
            } else if (e.name.toLowerCase() === 'java.exe' || (process.platform !== 'win32' && e.name === 'java')) {
              candidates.push(full);
            }
          }
        };
        findJavaInDir(defaultRuntimesDir);
      } catch {
        // Ignored
      }
    }

    // 4. Check common Windows Program Files directories
    if (process.platform === 'win32') {
      const programFiles = [
        process.env['ProgramFiles'] || 'C:\\Program Files',
        process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
        path.join(process.env['LOCALAPPDATA'] || 'C:\\Users\\Admin\\AppData\\Local', 'Programs')
      ];

      const vendorDirs = [
        'Java',
        'Eclipse Adoptium',
        'BellSoft',
        'Amazon Corretto',
        'Zulu',
        'Microsoft',
        'Semeru'
      ];

      for (const pf of programFiles) {
        if (!fs.existsSync(pf)) continue;
        for (const vDir of vendorDirs) {
          const parentDir = path.join(pf, vDir);
          if (fs.existsSync(parentDir)) {
            try {
              const subDirs = fs.readdirSync(parentDir);
              for (const sub of subDirs) {
                const javaExe = path.join(parentDir, sub, 'bin', 'java.exe');
                if (fs.existsSync(javaExe)) {
                  candidates.push(javaExe);
                }
              }
            } catch {
              // Directory read error ignore
            }
          }
        }
      }
    }

    // Process all candidates
    for (const rawPath of candidates) {
      const normalized = path.normalize(rawPath);
      if (!results.has(normalized)) {
        const info = await this.probeJava(normalized);
        if (info && info.isValid) {
          results.set(normalized, info);
        }
      }
    }

    const list = Array.from(results.values());
    // Sort by major version descending
    list.sort((a, b) => b.majorVersion - a.majorVersion);
    if (list.length > 0) {
      list[0].isDefault = true;
    }
    this.cachedJavaList = list;
    return list;
  }

  public static async probeJava(javaPath: string): Promise<JavaInstallation | null> {
    try {
      if (!fs.existsSync(javaPath)) {
        return null;
      }
      const { stderr, stdout } = await execAsync(`"${javaPath}" -version`);
      const output = (stderr || stdout || '').toString();

      let version = 'Unknown';
      let majorVersion = 0;
      let vendor = 'Oracle / OpenJDK';
      let arch = '64-Bit';

      const versionMatch = output.match(/version "([^"]+)"/);
      if (versionMatch && versionMatch[1]) {
        version = versionMatch[1];
        if (version.startsWith('1.')) {
          const parts = version.split('.');
          majorVersion = parseInt(parts[1] || '8', 10);
        } else {
          const parts = version.split('.');
          majorVersion = parseInt(parts[0] || '0', 10);
        }
      }

      if (output.toLowerCase().includes('temurin') || output.toLowerCase().includes('adoptium')) {
        vendor = 'Eclipse Temurin';
      } else if (output.toLowerCase().includes('corretto')) {
        vendor = 'Amazon Corretto';
      } else if (output.toLowerCase().includes('zulu') || output.toLowerCase().includes('azul')) {
        vendor = 'Azul Zulu';
      } else if (output.toLowerCase().includes('bellsoft') || output.toLowerCase().includes('liberica')) {
        vendor = 'BellSoft Liberica';
      } else if (output.toLowerCase().includes('microsoft')) {
        vendor = 'Microsoft Build of OpenJDK';
      } else if (output.toLowerCase().includes('openjdk')) {
        vendor = 'OpenJDK';
      }

      if (output.includes('32-Bit') || output.includes('x86')) {
        arch = '32-Bit';
      }

      return {
        path: javaPath,
        version,
        majorVersion,
        vendor,
        arch,
        isDefault: false,
        isValid: majorVersion > 0
      };
    } catch {
      return null;
    }
  }

  public static async downloadAdoptiumJava(
    runtimesDir: string,
    majorVersion = 21,
    onProgress?: (data: { percent: number; step: string; downloadedBytes?: number; totalBytes?: number }) => void
  ): Promise<JavaInstallation> {
    const osPlatform = process.platform === 'win32' ? 'windows' : (process.platform === 'darwin' ? 'mac' : 'linux');
    const osArch = process.arch === 'x64' ? 'x64' : (process.arch === 'arm64' ? 'aarch64' : 'x64');
    const imageType = 'jdk';

    const adoptiumApiUrl = `https://api.adoptium.net/v3/binary/latest/${majorVersion}/ga/${osPlatform}/${osArch}/${imageType}/hotspot/normal/eclipse?project=jdk`;

    if (onProgress) {
      onProgress({ percent: 5, step: `Connecting to Eclipse Adoptium for Java ${majorVersion} LTS...` });
    }

    await fs.promises.mkdir(runtimesDir, { recursive: true });
    const tempZipPath = path.join(runtimesDir, `temurin-jdk-${majorVersion}-temp.zip`);

    const res = await fetch(adoptiumApiUrl, { redirect: 'follow' });
    if (!res.ok || !res.body) {
      throw new Error(`Failed to fetch Java ${majorVersion} from Adoptium: HTTP ${res.status} ${res.statusText}`);
    }

    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);
    const totalBytes = contentLength > 0 ? contentLength : 190 * 1024 * 1024; // approx fallback

    const fileStream = fs.createWriteStream(tempZipPath);
    const reader = res.body.getReader();
    let downloadedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        fileStream.write(Buffer.from(value));
        downloadedBytes += value.length;
        if (onProgress) {
          const percent = Math.min(92, Math.round((downloadedBytes / totalBytes) * 90));
          const mbDownloaded = (downloadedBytes / (1024 * 1024)).toFixed(1);
          const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);
          onProgress({
            percent,
            step: `Downloading Java ${majorVersion} LTS (${mbDownloaded} MB / ${mbTotal} MB)...`,
            downloadedBytes,
            totalBytes
          });
        }
      }
    }

    fileStream.end();
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    if (onProgress) {
      onProgress({ percent: 93, step: `Extracting Java ${majorVersion} Runtime...` });
    }

    const targetExtractDir = path.join(runtimesDir, `java-${majorVersion}`);
    await fs.promises.mkdir(targetExtractDir, { recursive: true });

    const zip = new AdmZip(tempZipPath);
    zip.extractAllTo(targetExtractDir, true);

    // Clean up temporary download file
    try {
      await fs.promises.unlink(tempZipPath);
    } catch {
      // Ignored
    }

    // Locate java executable inside extracted folder
    let foundJavaExe: string | null = null;
    const findJavaRecursive = (dir: string, depth = 0) => {
      if (depth > 4) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findJavaRecursive(full, depth + 1);
        } else if (entry.name.toLowerCase() === 'java.exe' || (process.platform !== 'win32' && entry.name === 'java')) {
          foundJavaExe = full;
          return;
        }
      }
    };

    findJavaRecursive(targetExtractDir);

    if (!foundJavaExe) {
      throw new Error(`Could not find java executable inside extracted Java ${majorVersion} archive.`);
    }

    if (onProgress) {
      onProgress({ percent: 98, step: `Verifying Java ${majorVersion} Runtime...` });
    }

    const probeInfo = await JavaDetector.probeJava(foundJavaExe);
    if (!probeInfo) {
      throw new Error(`Installed Java ${majorVersion} failed verification probe.`);
    }

    if (onProgress) {
      onProgress({ percent: 100, step: `Java ${majorVersion} LTS Ready!` });
    }

    return probeInfo;
  }

  public static getRecommendedJavaMajor(minecraftVersion: string): number {
    try {
      const clean = (minecraftVersion || '').trim();
      const parts = clean.split('.').map(p => parseInt(p, 10));
      const major = parts[0] || 1;
      const minor = parts[1] || 0;
      const patch = parts[2] || 0;

      if (major >= 25 || clean.startsWith('25') || clean.startsWith('26') || clean.startsWith('27')) {
        return 25;
      }

      if (major === 1) {
        if (minor >= 21 || (minor === 20 && patch >= 5)) {
          return 21;
        }
        if (minor >= 18) {
          return 17;
        }
        if (minor >= 17) {
          return 16;
        }
        return 8;
      }
      return 21;
    } catch {
      return 21;
    }
  }
}

