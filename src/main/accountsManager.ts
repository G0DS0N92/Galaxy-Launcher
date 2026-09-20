import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Account, GalaxyCosmetics } from '../preload/types';

export class AccountsManager {
  private accountsFile: string;
  private accounts: Account[] = [];

  constructor(userDataPath: string) {
    this.accountsFile = path.join(userDataPath, 'accounts.json');
    this.loadAccounts();
  }

  private loadAccounts(): void {
    try {
      if (fs.existsSync(this.accountsFile)) {
        const raw = fs.readFileSync(this.accountsFile, 'utf-8');
        const parsed = JSON.parse(raw);
        // Filter out legacy dummy "GalaxyPlayer" test account
        this.accounts = Array.isArray(parsed)
          ? parsed.filter((a: Account) => a && a.id !== 'offline-galaxy-player' && a.username !== 'GalaxyPlayer')
          : [];
      } else {
        this.accounts = [];
      }
    } catch {
      this.accounts = [];
    }
  }

  public clearAllAccounts(): void {
    this.accounts = [];
    this.saveAccounts();
  }

  private saveAccounts(): void {
    try {
      fs.writeFileSync(this.accountsFile, JSON.stringify(this.accounts, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save accounts:', err);
    }
  }

  public getAccounts(): Account[] {
    return this.accounts;
  }

  public getActiveAccount(): Account | null {
    return this.accounts.find(a => a.isActive) || this.accounts[0] || null;
  }

  public setActiveAccount(id: string): Account | null {
    for (const acc of this.accounts) {
      acc.isActive = acc.id === id;
    }
    this.saveAccounts();
    return this.getActiveAccount();
  }

  public static generateOfflineUuid(username: string): string {
    const hash = crypto.createHash('md5').update(`OfflinePlayer:${username}`).digest('hex');
    // Format as UUID: 8-4-4-4-12, set version 3 (0x30) and variant (0x80)
    const p1 = hash.substring(0, 8);
    const p2 = hash.substring(8, 12);
    const p3 = '3' + hash.substring(13, 16);
    const byte8 = parseInt(hash.substring(16, 18), 16);
    const varByte = ((byte8 & 0x3f) | 0x80).toString(16).padStart(2, '0');
    const p4 = varByte + hash.substring(18, 20);
    const p5 = hash.substring(20, 32);
    return `${p1}-${p2}-${p3}-${p4}-${p5}`;
  }

  public createOfflineAccount(username: string, skinUrl?: string, modelType: 'classic' | 'slim' = 'classic'): Account {
    const acc = this.createOfflineAccountSync(username, skinUrl, modelType);
    this.accounts.push(acc);
    // If it's the only account, make active
    if (this.accounts.length === 1) {
      acc.isActive = true;
    }
    this.saveAccounts();
    return acc;
  }

  private createOfflineAccountSync(username: string, skinUrl?: string, modelType: 'classic' | 'slim' = 'classic'): Account {
    const trimmed = username.trim() || 'Player';
    const uuid = AccountsManager.generateOfflineUuid(trimmed);
    return {
      id: 'cracked-' + crypto.randomUUID().substring(0, 8),
      username: trimmed,
      uuid,
      type: 'cracked',
      skinUrl: skinUrl || `https://minotar.net/skin/${trimmed}`,
      isActive: false,
      modelType
    };
  }

  public addMicrosoftAccount(accountData: Omit<Account, 'id' | 'isActive'>): Account {
    const id = 'ms-' + crypto.randomUUID().substring(0, 8);
    const newAcc: Account = {
      ...accountData,
      id,
      type: 'microsoft',
      isActive: true
    };
    // Make others inactive
    for (const acc of this.accounts) {
      acc.isActive = false;
    }
    this.accounts.push(newAcc);
    this.saveAccounts();
    return newAcc;
  }

  public removeAccount(id: string): boolean {
    const prevCount = this.accounts.length;
    this.accounts = this.accounts.filter(a => a.id !== id);
    if (this.accounts.length > 0 && !this.accounts.some(a => a.isActive)) {
      this.accounts[0].isActive = true;
    }
    this.saveAccounts();
    return this.accounts.length < prevCount;
  }

  public updateAccountSkin(id: string, skinUrl: string, modelType?: 'classic' | 'slim'): Account | null {
    const acc = this.accounts.find(a => a.id === id);
    if (acc) {
      acc.skinUrl = skinUrl;
      if (modelType) acc.modelType = modelType;
      this.saveAccounts();
      return acc;
    }
    return null;
  }

  public updateSkin(id: string, skinUrl: string, modelType?: 'classic' | 'slim'): Account | null {
    return this.updateAccountSkin(id, skinUrl, modelType);
  }

  public updateCosmetics(id: string, cosmetics: GalaxyCosmetics): Account | null {
    const acc = this.accounts.find(a => a.id === id);
    if (!acc) return null;
    acc.cosmetics = { ...(acc.cosmetics || {}), ...cosmetics };
    this.saveAccounts();
    return acc;
  }

  public static async verifyOfficialMinecraftAccount(usernameOrGamertag: string): Promise<{
    verified: boolean;
    username: string;
    uuid: string;
    skinUrl?: string;
    modelType?: 'classic' | 'slim';
    error?: string;
  }> {
    const trimmed = usernameOrGamertag.trim();
    if (!trimmed) {
      return { verified: false, username: '', uuid: '', error: 'Gamertag / Username cannot be empty.' };
    }

    try {
      const https = await import('https');

      const fetchJson = (url: string): Promise<any> => {
        return new Promise((resolve) => {
          https.get(
            url,
            { headers: { 'User-Agent': 'Galaxy-Launcher/1.0', 'Accept': 'application/json' } },
            (res) => {
              if (res.statusCode === 204 || res.statusCode === 404 || res.statusCode !== 200) {
                return resolve(null);
              }
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => {
                try {
                  resolve(JSON.parse(data));
                } catch {
                  resolve(null);
                }
              });
            }
          ).on('error', () => resolve(null));
        });
      };

      // 1. Check PlayerDB (queries official Mojang session servers)
      const playerDbData = await fetchJson(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(trimmed)}`);
      if (playerDbData && playerDbData.code === 'player.found' && playerDbData.data?.player) {
        const player = playerDbData.data.player;
        const isSlim = player.meta?.model === 'slim' || player.model === 'slim';
        const formattedUuid = player.id.length === 32
          ? `${player.id.substr(0, 8)}-${player.id.substr(8, 4)}-${player.id.substr(12, 4)}-${player.id.substr(16, 4)}-${player.id.substr(20)}`
          : player.id;

        return {
          verified: true,
          username: player.username,
          uuid: formattedUuid,
          skinUrl: player.skin_texture || `https://crafatar.com/skins/${player.id}`,
          modelType: isSlim ? 'slim' : 'classic'
        };
      }

      // 2. Direct Mojang API check
      const mojangData = await fetchJson(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(trimmed)}`);
      if (mojangData && mojangData.id && mojangData.name) {
        const rawId = mojangData.id;
        const formattedUuid = rawId.length === 32
          ? `${rawId.substr(0, 8)}-${rawId.substr(8, 4)}-${rawId.substr(12, 4)}-${rawId.substr(16, 4)}-${rawId.substr(20)}`
          : rawId;

        return {
          verified: true,
          username: mojangData.name,
          uuid: formattedUuid,
          skinUrl: `https://crafatar.com/skins/${rawId}`,
          modelType: 'classic'
        };
      }

      return {
        verified: false,
        username: trimmed,
        uuid: '',
        error: `Official Verification Failed: No official paid Minecraft account named "${trimmed}" exists on Mojang / Microsoft servers. Random or unverified credentials cannot be used for Premium login. If you wish to play without an official account, please choose "Create Offline Profile".`
      };
    } catch (err: any) {
      return {
        verified: false,
        username: trimmed,
        uuid: '',
        error: `Verification error: ${err?.message || 'Unable to connect to Mojang servers'}`
      };
    }
  }
}

