import * as net from 'net';

export interface DiscordActivity {
  state?: string;
  details?: string;
  startTimestamp?: number;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
}

export class DiscordRpcService {
  private socket: net.Socket | null = null;
  // Registered Discord Application IDs (Global Game & Launcher IDs)
  private readonly clientIds: string[] = [
    '356875570916753438', // Minecraft (Global Verified Game ID)
    '896677937989939220', // Prism / MultiMC Client ID
    '450485984333660181', // CraftPresence Minecraft RPC
    '383226320970055681', // CurseForge RPC Fallback
    '1341074811802095656' // Galaxy Launcher Dedicated App ID
  ];
  private currentClientIdIndex = 0;
  private isConnected = false;
  private isReady = false;
  private isConnecting = false;
  private currentActivity: DiscordActivity | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;

  constructor(customClientId?: string) {
    if (customClientId) {
      this.clientIds.unshift(customClientId);
    }
    this.connect().catch(() => {});
    this.startAutoReconnect();
  }

  private startAutoReconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
    }
    // Attempt connection periodically if not ready
    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected && !this.isConnecting) {
        this.connect().catch(() => {});
      }
    }, 10000);
  }

  /**
   * Scans IPC pipes (discord-ipc-0 to discord-ipc-9) to connect to Discord
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected && this.isReady) return true;
    if (this.isConnecting) return false;
    this.isConnecting = true;

    for (let pipeIndex = 0; pipeIndex < 10; pipeIndex++) {
      const pipePath = process.platform === 'win32'
        ? `\\\\.\\pipe\\discord-ipc-${pipeIndex}`
        : `${process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || '/tmp'}/discord-ipc-${pipeIndex}`;

      const success = await this.tryConnectPipe(pipePath);
      if (success) {
        this.isConnected = true;
        this.isConnecting = false;
        console.log(`[DiscordRPC] Successfully connected to Discord named pipe: ${pipePath}`);
        this.sendHandshake();
        return true;
      }
    }

    this.isConnecting = false;
    return false;
  }

  private tryConnectPipe(pipePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      };

      try {
        const sock = net.createConnection(pipePath, () => {
          if (!resolved) {
            resolved = true;
            sock.setTimeout(0); // Clear connection probe timeout so pipe stays open
            this.socket = sock;
            this.setupSocketListeners(sock);
            resolve(true);
          }
        });

        sock.setTimeout(2000, () => {
          if (!resolved) {
            sock.destroy();
            cleanup();
          }
        });

        sock.on('error', () => {
          cleanup();
        });
      } catch {
        cleanup();
      }
    });
  }

  private setupSocketListeners(sock: net.Socket): void {
    sock.on('error', (err) => {
      console.log('[DiscordRPC] Socket notice:', err.message);
      this.resetConnection();
    });

    sock.on('close', () => {
      console.log('[DiscordRPC] Connection closed');
      this.resetConnection();
    });

    sock.on('data', (data) => {
      try {
        if (data.length >= 8) {
          const payloadStr = data.subarray(8).toString('utf-8');
          const parsed = JSON.parse(payloadStr);

          if (parsed.evt === 'READY' || parsed.cmd === 'DISPATCH') {
            this.isReady = true;
            console.log(`[DiscordRPC] 🎉 Handshake confirmed! User: ${parsed.data?.user?.username || 'Discord User'}`);
            if (this.currentActivity) {
              this.sendActivityPayload(this.currentActivity);
            }
          } else if (parsed.code === 4000) {
            console.log(`[DiscordRPC] Client ID ${this.clientIds[this.currentClientIdIndex]} rejected, rotating to next fallback ID...`);
            this.currentClientIdIndex = (this.currentClientIdIndex + 1) % this.clientIds.length;
            this.sendHandshake();
          } else if (parsed.cmd === 'SET_ACTIVITY') {
            console.log(`[DiscordRPC] Activity updated on Discord profile: "${parsed.data?.name || 'Minecraft'}" - ${parsed.data?.state || ''}`);
          }
        }
      } catch (err: any) {
        console.log('[DiscordRPC] Parse error:', err.message);
      }
    });
  }

  private resetConnection(): void {
    this.isConnected = false;
    this.isReady = false;
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch {}
      this.socket = null;
    }
  }

  private sendHandshake(): void {
    const currentId = this.clientIds[this.currentClientIdIndex];
    console.log(`[DiscordRPC] Sending handshake with Client ID: ${currentId}`);
    const payload = JSON.stringify({
      v: 1,
      client_id: currentId
    });
    this.send(0, payload);
  }

  public setActivity(activity: DiscordActivity): void {
    this.currentActivity = activity;
    if (!this.isConnected || !this.isReady) {
      this.connect().then((ok) => {
        if (ok && this.isReady) {
          this.sendActivityPayload(activity);
        }
      }).catch(() => {});
      return;
    }
    this.sendActivityPayload(activity);
  }

  private sendActivityPayload(activity: DiscordActivity): void {
    if (!this.socket || !this.isConnected || !this.isReady) return;

    const activityObj: Record<string, any> = {
      state: activity.state || 'Galaxy Launcher v1.0.4',
      details: activity.details || 'Exploring Cosmic Universe',
      timestamps: activity.startTimestamp
        ? { start: activity.startTimestamp }
        : { start: Math.floor(Date.now() / 1000) }
    };

    if (activity.largeImageKey || activity.largeImageText || activity.smallImageKey || activity.smallImageText) {
      activityObj.assets = {
        ...(activity.largeImageKey ? { large_image: activity.largeImageKey } : {}),
        large_text: activity.largeImageText || 'Galaxy Launcher v1.0.4',
        ...(activity.smallImageKey ? { small_image: activity.smallImageKey } : {}),
        ...(activity.smallImageText ? { small_text: activity.smallImageText } : {})
      };
    }

    const payload = JSON.stringify({
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: activityObj
      },
      nonce: Math.random().toString(36).substring(2, 15)
    });

    this.send(1, payload);
  }

  public clearActivity(): void {
    this.currentActivity = null;
    if (!this.isConnected || !this.socket || !this.isReady) return;
    const payload = JSON.stringify({
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: null
      },
      nonce: Math.random().toString(36).substring(2, 15)
    });
    this.send(1, payload);
  }

  private send(op: number, payload: string): void {
    if (!this.socket || this.socket.destroyed) return;
    try {
      const data = Buffer.from(payload, 'utf-8');
      const header = Buffer.alloc(8);
      header.writeInt32LE(op, 0);
      header.writeInt32LE(data.length, 4);
      this.socket.write(Buffer.concat([header, data]));
    } catch {}
  }

  public disconnect(): void {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    this.resetConnection();
  }
}
