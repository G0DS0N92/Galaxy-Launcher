import { exec, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { JavaInstallation } from '../preload/types';

const execAsync = promisify(exec);

export class JavaDetector {
  private static cachedJavaList: JavaInstallation[] = [];

  public static async detectAllJava(): Promise<JavaInstallation[]> {
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

    // 3. Check common Windows Program Files directories
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

      // Example outputs:
      // openjdk version "21.0.11" 2026-04-21 LTS
      // java version "1.8.0_381"
      let version = 'Unknown';
      let majorVersion = 0;
      let vendor = 'Oracle / OpenJDK';
      let arch = '64-Bit';

      const versionMatch = output.match(/version "([^"]+)"/);
      if (versionMatch && versionMatch[1]) {
        version = versionMatch[1];
        if (version.startsWith('1.')) {
          // 1.8.0 -> 8
          const parts = version.split('.');
          majorVersion = parseInt(parts[1] || '8', 10);
        } else {
          // 17.0.2 -> 17, 21.0.11 -> 21
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

  public static getRecommendedJavaMajor(minecraftVersion: string): number {
    try {
      const parts = minecraftVersion.split('.').map(p => parseInt(p, 10));
      const major = parts[0] || 1;
      const minor = parts[1] || 0;
      const patch = parts[2] || 0;

      if (major === 1) {
        if (minor >= 21 || (minor === 20 && patch >= 5)) {
          return 21; // 1.20.5+ requires Java 21
        }
        if (minor >= 18) {
          return 17; // 1.18 - 1.20.4 requires Java 17
        }
        if (minor >= 17) {
          return 16; // 1.17 requires Java 16
        }
        return 8; // 1.16.5 and older uses Java 8
      }
      return 21;
    } catch {
      return 21;
    }
  }
}
