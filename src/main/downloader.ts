import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';

export interface DownloadTask {
  url: string;
  destination: string;
  sha1?: string;
  size?: number;
}

export class Downloader {
  public static async downloadFile(
    url: string,
    destPath: string,
    expectedSha1?: string,
    onProgress?: (bytes: number, total: number) => void
  ): Promise<void> {
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });

    // Check if file already exists with matching SHA1
    if (expectedSha1 && fs.existsSync(destPath)) {
      const match = await this.verifySha1(destPath, expectedSha1);
      if (match) {
        if (onProgress) {
          const stat = await fs.promises.stat(destPath);
          onProgress(stat.size, stat.size);
        }
        return;
      }
    }

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const getter = parsedUrl.protocol === 'https:' ? https.get : http.get;

      const req = getter(url, { headers: { 'User-Agent': 'GalaxyLauncher/1.0' } }, (res) => {
        // Follow redirects (301, 302, 307, 308)
        if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          return this.downloadFile(res.headers.location, destPath, expectedSha1, onProgress)
            .then(resolve)
            .catch(reject);
        }

        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        const fileStream = fs.createWriteStream(destPath);
        const hash = crypto.createHash('sha1');

        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          hash.update(chunk);
          if (onProgress) {
            onProgress(downloadedBytes, totalBytes);
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          const fileHash = hash.digest('hex');
          if (expectedSha1 && fileHash.toLowerCase() !== expectedSha1.toLowerCase()) {
            fs.unlink(destPath, () => {});
            return reject(new Error(`SHA-1 mismatch for ${url}. Expected ${expectedSha1}, got ${fileHash}`));
          }
          resolve();
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      });

      req.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }

  public static async downloadParallel(
    tasks: DownloadTask[],
    concurrency = 8,
    onOverallProgress?: (completed: number, total: number, currentItem?: string) => void
  ): Promise<void> {
    let completed = 0;
    const total = tasks.length;
    let index = 0;

    const worker = async () => {
      while (index < tasks.length) {
        const taskIdx = index++;
        const task = tasks[taskIdx];
        if (!task) break;

        try {
          await this.downloadFile(task.url, task.destination, task.sha1);
        } catch (err) {
          console.error(`Error downloading ${task.url}:`, err);
        } finally {
          completed++;
          if (onOverallProgress) {
            onOverallProgress(completed, total, path.basename(task.destination));
          }
        }
      }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
  }

  public static async verifySha1(filePath: string, expectedSha1: string): Promise<boolean> {
    try {
      if (!fs.existsSync(filePath)) return false;
      const fileBuffer = await fs.promises.readFile(filePath);
      const hash = crypto.createHash('sha1').update(fileBuffer).digest('hex');
      return hash.toLowerCase() === expectedSha1.toLowerCase();
    } catch {
      return false;
    }
  }

  public static async fetchJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const getter = parsedUrl.protocol === 'https:' ? https.get : http.get;

      const req = getter(url, { headers: { 'User-Agent': 'GalaxyLauncher/1.0' } }, (res) => {
        if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          return this.fetchJson<T>(res.headers.location).then(resolve).catch(reject);
        }

        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`Failed to fetch JSON from ${url}: HTTP ${res.statusCode}`));
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
    });
  }
}
