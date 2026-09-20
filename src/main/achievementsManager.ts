import fs from 'fs';
import path from 'path';
import { BrowserWindow } from 'electron';
import { Achievement, AchievementStats } from '../preload/types';

export class AchievementsManager {
  private baseDir: string;
  private achievementsDir: string;
  private currentAccountId: string | null = null;
  private achievements: Achievement[] = [];
  private mainWindow: BrowserWindow | null = null;
  private totalPlaytimeMinutes = 0;
  private accountChecker: (() => boolean) | null = null;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.achievementsDir = path.join(baseDir, 'achievements');
    try {
      fs.mkdirSync(this.achievementsDir, { recursive: true });
    } catch {}
    this.initDefaultAchievements();
  }

  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  public setAccountChecker(checker: () => boolean): void {
    this.accountChecker = checker;
  }

  public getCurrentAccountId(): string | null {
    return this.currentAccountId;
  }

  /**
   * Switches the active achievements profile to match the logged-in account.
   */
  public switchAccount(accountId: string | null): void {
    if (this.currentAccountId === accountId && this.currentAccountId !== null) {
      return;
    }

    // Save previous account's state before switching
    if (this.currentAccountId) {
      this.save();
    }

    this.currentAccountId = accountId;
    this.initDefaultAchievements();
    this.totalPlaytimeMinutes = 0;

    if (accountId) {
      this.load();
      // If welcome achievement is not unlocked on a new account, unlock it
      const welcome = this.achievements.find(a => a.id === 'welcome');
      if (welcome && !welcome.unlocked) {
        welcome.unlocked = true;
        welcome.unlockedAt = new Date().toISOString();
        this.save();
      }
    }

    console.log(`[Achievements] Switched to account achievements profile: "${accountId || 'NONE'}" (${this.achievements.filter(a => a.unlocked).length} unlocked)`);
    this.broadcastStatsUpdate();
  }

  private initDefaultAchievements(): void {
    this.achievements = [
      {
        id: 'welcome',
        title: 'Welcome To The Galaxy',
        description: 'Open Galaxy Launcher for the first time.',
        icon: '🌌',
        category: 'general',
        rarity: 'common',
        xp: 50,
        unlocked: false
      },
      {
        id: 'first_launch',
        title: 'First Launch',
        description: 'Create your first Minecraft instance.',
        icon: '🚀',
        category: 'general',
        rarity: 'common',
        xp: 100,
        unlocked: false
      },
      {
        id: 'playtime_1h',
        title: 'Getting Started',
        description: 'Play Minecraft for 1 hour through Galaxy Launcher.',
        icon: '🎮',
        category: 'playtime',
        rarity: 'common',
        xp: 150,
        unlocked: false,
        progress: { current: 0, max: 1, unit: 'hours' }
      },
      {
        id: 'playtime_10h',
        title: 'Time Traveler',
        description: 'Accumulate 10 hours of Minecraft playtime through Galaxy Launcher.',
        icon: '⏳',
        category: 'playtime',
        rarity: 'rare',
        xp: 300,
        unlocked: false,
        progress: { current: 0, max: 10, unit: 'hours' }
      },
      {
        id: 'playtime_50h',
        title: 'Galaxy Explorer',
        description: 'Accumulate 50 hours of Minecraft playtime through Galaxy Launcher.',
        icon: '🌠',
        category: 'playtime',
        rarity: 'epic',
        xp: 600,
        unlocked: false,
        progress: { current: 0, max: 50, unit: 'hours' }
      },
      {
        id: 'playtime_100h',
        title: 'Veteran Traveler',
        description: 'Accumulate 100 hours of Minecraft playtime through Galaxy Launcher.',
        icon: '🪐',
        category: 'playtime',
        rarity: 'epic',
        xp: 1200,
        unlocked: false,
        progress: { current: 0, max: 100, unit: 'hours' }
      },
      {
        id: 'playtime_500h',
        title: 'Galaxy Legend',
        description: 'Accumulate 500 hours of Minecraft playtime through Galaxy Launcher.',
        icon: '👑',
        category: 'playtime',
        rarity: 'legendary',
        xp: 3000,
        unlocked: false,
        progress: { current: 0, max: 500, unit: 'hours' }
      },
      {
        id: 'modder',
        title: 'Modder',
        description: 'Visit the Mods page and install your first Minecraft mod.',
        icon: '🧩',
        category: 'modding',
        rarity: 'common',
        xp: 150,
        unlocked: false
      },
      {
        id: 'theme_change',
        title: 'Into A New Galaxy',
        description: 'Change the cosmic visual theme of Galaxy Launcher for the first time.',
        icon: '🎨',
        category: 'general',
        rarity: 'common',
        xp: 50,
        unlocked: false
      },
      {
        id: 'into_clouds',
        title: 'Into The Clouds',
        description: 'Enable Galaxy Cloud for the first time.',
        icon: '☁️',
        category: 'cloud',
        rarity: 'rare',
        xp: 250,
        unlocked: false
      },
      {
        id: 'first_friend',
        title: 'Friend',
        description: 'Add your first Galaxy friend.',
        icon: '👥',
        category: 'social',
        rarity: 'common',
        xp: 200,
        unlocked: false
      },
      {
        id: 'in_it_together',
        title: 'In It Together',
        description: 'Play on a Minecraft server with a Galaxy friend.',
        icon: '🤝',
        category: 'social',
        rarity: 'epic',
        xp: 500,
        unlocked: false
      },
      // --- Secret Achievements ---
      {
        id: 'secret_speedrunner',
        title: 'Cosmic Speedrunner',
        description: 'Launch Minecraft within 5 seconds of opening Galaxy Launcher.',
        icon: '⚡',
        category: 'secret',
        rarity: 'rare',
        xp: 200,
        unlocked: false,
        secret: true
      },
      {
        id: 'secret_audiophile',
        title: 'Interstellar Audiophile',
        description: 'Click the Audio Test Sound button 10 times in Settings.',
        icon: '🎵',
        category: 'secret',
        rarity: 'common',
        xp: 100,
        unlocked: false,
        secret: true
      },
      {
        id: 'secret_ram_titan',
        title: 'RAM Overdrive',
        description: 'Allocate 12 GB or more memory to an instance.',
        icon: '🧠',
        category: 'secret',
        rarity: 'epic',
        xp: 250,
        unlocked: false,
        secret: true
      },
      {
        id: 'secret_eclipse',
        title: 'Cosmic Eclipse',
        description: 'Cycle through all 6 Cosmic Visual Themes in a single session.',
        icon: '🌑',
        category: 'secret',
        rarity: 'epic',
        xp: 300,
        unlocked: false,
        secret: true
      },
      {
        id: 'secret_archivist',
        title: 'Deep Space Archivist',
        description: 'View and manage screenshots in the Screenshots Gallery.',
        icon: '📸',
        category: 'secret',
        rarity: 'rare',
        xp: 150,
        unlocked: false,
        secret: true
      },
      {
        id: 'secret_night_owl',
        title: 'Night Voyager',
        description: 'Launch a Minecraft instance between 1:00 AM and 4:00 AM.',
        icon: '🦉',
        category: 'secret',
        rarity: 'rare',
        xp: 200,
        unlocked: false,
        secret: true
      },
      {
        id: 'all_achievements',
        title: 'Galaxies Conquered',
        description: 'Unlock 100% of all available Galaxy Achievements.',
        icon: '🏆',
        category: 'mastery',
        rarity: 'legendary',
        xp: 5000,
        unlocked: false
      }
    ];
  }

  private getAccountFilePath(accountId: string): string {
    const safeId = accountId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.achievementsDir, `${safeId}.json`);
  }

  private load(): void {
    if (!this.currentAccountId) return;
    try {
      const targetFile = this.getAccountFilePath(this.currentAccountId);
      if (fs.existsSync(targetFile)) {
        const data = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
        this.totalPlaytimeMinutes = data.totalPlaytimeMinutes || 0;
        const savedMap = new Map<string, any>(
          (data.achievements || []).map((a: any) => [a.id, a])
        );

        this.achievements = this.achievements.map((item) => {
          const saved = savedMap.get(item.id);
          if (saved) {
            return {
              ...item,
              unlocked: saved.unlocked ?? item.unlocked,
              unlockedAt: saved.unlockedAt ?? item.unlockedAt,
              progress: saved.progress ? { ...item.progress, ...saved.progress } : item.progress
            };
          }
          return item;
        });
      }
    } catch (err) {
      console.error('[Achievements] Failed to load achievements for account:', err);
    }
  }

  private save(): void {
    if (!this.currentAccountId) return;
    try {
      const targetFile = this.getAccountFilePath(this.currentAccountId);
      const data = {
        accountId: this.currentAccountId,
        totalPlaytimeMinutes: this.totalPlaytimeMinutes,
        achievements: this.achievements,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Achievements] Failed to save achievements for account:', err);
    }
  }

  public getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  public getStats(): AchievementStats {
    const unlocked = this.achievements.filter((a) => a.unlocked);
    const totalXp = unlocked.reduce((sum, a) => sum + a.xp, 0);
    // Level formula: level = Math.floor(sqrt(xp / 100)) + 1
    const level = Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1);
    const currentLevelBaseXp = Math.pow(level - 1, 2) * 100;
    const nextLevelBaseXp = Math.pow(level, 2) * 100;
    const levelRange = Math.max(1, nextLevelBaseXp - currentLevelBaseXp);
    const levelProgress = Math.min(100, Math.round(((totalXp - currentLevelBaseXp) / levelRange) * 100));

    return {
      totalUnlocked: unlocked.length,
      totalAchievements: this.achievements.length,
      totalXp,
      level,
      levelProgress,
      totalPlaytimeHours: Math.round((this.totalPlaytimeMinutes / 60) * 10) / 10
    };
  }

  public unlock(id: string): boolean {
    if (!this.currentAccountId) {
      return false;
    }
    if (this.accountChecker && !this.accountChecker()) {
      return false;
    }

    const ach = this.achievements.find((a) => a.id === id);
    if (!ach || ach.unlocked) return false;

    ach.unlocked = true;
    ach.unlockedAt = new Date().toISOString();
    if (ach.progress) {
      ach.progress.current = ach.progress.max;
    }

    this.save();
    this.broadcastUnlock(ach);
    this.broadcastStatsUpdate();
    console.log(`[Achievements] 🏆 UNLOCKED: ${ach.title} (${ach.xp} XP) for account ${this.currentAccountId}`);

    // Check meta-achievement "all_achievements"
    if (id !== 'all_achievements') {
      const others = this.achievements.filter((a) => a.id !== 'all_achievements');
      const allOthersUnlocked = others.every((a) => a.unlocked);
      if (allOthersUnlocked) {
        this.unlock('all_achievements');
      }
    }

    return true;
  }

  private broadcastUnlock(achievement: Achievement): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('achievement:unlocked', achievement);
    }
  }

  private broadcastStatsUpdate(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('achievement:stats-updated', {
        achievements: this.getAchievements(),
        stats: this.getStats()
      });
    }
  }

  /**
   * Tracks game playtime progress and triggers milestone unlocks
   */
  public addPlaytime(minutes: number): void {
    if (!this.currentAccountId) return;
    if (this.accountChecker && !this.accountChecker()) return;

    this.totalPlaytimeMinutes += minutes;
    const hours = this.totalPlaytimeMinutes / 60;

    const milestones = [
      { id: 'playtime_1h', hours: 1 },
      { id: 'playtime_10h', hours: 10 },
      { id: 'playtime_50h', hours: 50 },
      { id: 'playtime_100h', hours: 100 },
      { id: 'playtime_500h', hours: 500 }
    ];

    for (const m of milestones) {
      const ach = this.achievements.find((a) => a.id === m.id);
      if (ach && !ach.unlocked) {
        if (ach.progress) {
          ach.progress.current = Math.min(m.hours, Math.round(hours * 10) / 10);
        }
        if (hours >= m.hours) {
          this.unlock(m.id);
        }
      }
    }

    this.save();
    this.broadcastStatsUpdate();
  }

  public resetAll(): boolean {
    this.initDefaultAchievements();
    this.totalPlaytimeMinutes = 0;
    this.save();
    this.broadcastStatsUpdate();
    return true;
  }
}
