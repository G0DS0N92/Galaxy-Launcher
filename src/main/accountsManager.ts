import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Account } from '../preload/types';

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
}
