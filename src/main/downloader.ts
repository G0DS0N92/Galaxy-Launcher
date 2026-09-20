import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';
import * as zlib from 'zlib';

const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 64, maxFreeSockets: 32 });
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 64, maxFreeSockets: 32 });

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
    onProgress?: (bytes: number, total: number) => void,
    retries = 3
  ): Promise<void> {
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });

    // Check if file already exists with matching SHA1
    if (expectedSha1 && fs.existsSync(destPath)) {
      const match = await this.verifySha1(destPath, expectedSha1);
      if (match) {
        if (onProgress) {
          try {
            const stat = await fs.promises.stat(destPath);
            onProgress(stat.size, stat.size);
          } catch {}
        }
        return;
      }
    }

    let lastError: any = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.doDownload(url, destPath, expectedSha1, onProgress);
        return;
      } catch (err: any) {
        lastError = err;
        try {
          if (fs.existsSync(destPath)) await fs.promises.unlink(destPath);
        } catch {}
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, attempt * 350));
        }
      }
    }

    throw lastError || new Error(`Failed to download ${url} after ${retries} attempts`);
  }

  private static doDownload(
    url: string,
    destPath: string,
    expectedSha1?: string,
    onProgress?: (bytes: number, total: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const getter = parsedUrl.protocol === 'https:' ? https.get : http.get;
      const agent = parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent;

      const req = getter(
        url,
        {
          agent,
          headers: {
            'User-Agent': 'GalaxyLauncher/1.0 (Minecraft Desktop Client)',
            'Accept': '*/*'
          },
          timeout: 25000
        },
        (res) => {
          // Follow redirects (301, 302, 307, 308)
          if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            return this.doDownload(res.headers.location, destPath, expectedSha1, onProgress)
              .then(resolve)
              .catch(reject);
          }

          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let downloadedBytes = 0;

          const encoding = (res.headers['content-encoding'] || '').toLowerCase();
          let sourceStream: NodeJS.ReadableStream = res;
          if (encoding === 'gzip') {
            sourceStream = res.pipe(zlib.createGunzip());
          } else if (encoding === 'deflate') {
            sourceStream = res.pipe(zlib.createInflate());
          } else if (encoding === 'br') {
            sourceStream = res.pipe(zlib.createBrotliDecompress());
          }

          const fileStream = fs.createWriteStream(destPath);
          const hash = crypto.createHash('sha1');

          sourceStream.on('data', (chunk) => {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            downloadedBytes += buf.length;
            hash.update(buf);
            if (onProgress) {
              onProgress(downloadedBytes, totalBytes);
            }
          });

          sourceStream.pipe(fileStream);

          let finished = false;
          const cleanup = () => {
            if (!finished) {
              finished = true;
              try { fileStream.destroy(); } catch {}
              try { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); } catch {}
            }
          };

          fileStream.on('finish', () => {
            fileStream.close();
            finished = true;
            const fileHash = hash.digest('hex');
            if (expectedSha1 && fileHash.toLowerCase() !== expectedSha1.toLowerCase()) {
              cleanup();
              return reject(new Error(`SHA-1 mismatch for ${url}. Expected ${expectedSha1}, got ${fileHash}`));
            }
            resolve();
          });

          fileStream.on('error', (err) => {
            cleanup();
            reject(err);
          });

          sourceStream.on('error', (err) => {
            cleanup();
            reject(err);
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        try { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); } catch {}
        reject(new Error(`Download timed out for ${url}`));
      });

      req.on('error', (err) => {
        try { if (fs.existsSync(destPath)) fs.unlinkSync(destPath); } catch {}
        reject(err);
      });
    });
  }

  public static async downloadParallel(
    tasks: DownloadTask[],
    concurrency = 16,
    onOverallProgress?: (completed: number, total: number, currentItem?: string) => void
  ): Promise<void> {
    let completed = 0;
    const total = tasks.length;
    if (total === 0) return;

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

    const workerCount = Math.min(concurrency, tasks.length);
    const workers = [];
    for (let i = 0; i < workerCount; i++) {
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
      const agent = parsedUrl.protocol === 'https:' ? httpsAgent : httpAgent;

      const req = getter(
        url,
        {
          agent,
          headers: {
            'User-Agent': 'GalaxyLauncher/1.0 (Minecraft Desktop Client)',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br'
          },
          timeout: 20000
        },
        (res) => {
          if (res.statusCode && [301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            return this.fetchJson<T>(res.headers.location).then(resolve).catch(reject);
          }

          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`Failed to fetch JSON from ${url}: HTTP ${res.statusCode}`));
          }

          const encoding = (res.headers['content-encoding'] || '').toLowerCase();
          let stream: NodeJS.ReadableStream = res;
          if (encoding === 'gzip') {
            stream = res.pipe(zlib.createGunzip());
          } else if (encoding === 'deflate') {
            stream = res.pipe(zlib.createInflate());
          } else if (encoding === 'br') {
            stream = res.pipe(zlib.createBrotliDecompress());
          }

          const chunks: Buffer[] = [];
          stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          stream.on('end', () => {
            try {
              const raw = Buffer.concat(chunks).toString('utf-8');
              resolve(JSON.parse(raw));
            } catch (e) {
              reject(e);
            }
          });
          stream.on('error', reject);
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Fetch timed out for ${url}`));
      });

      req.on('error', reject);
    });
  }
}
