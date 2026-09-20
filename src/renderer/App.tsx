import React, { useState, useEffect } from 'react';
import { BackgroundCanvas } from './components/layout/BackgroundCanvas';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { ToastContainer, ToastMessage } from './components/layout/ToastContainer';
import { HomeView } from './components/home/HomeView';
import { InstanceDetailView } from './components/instances/InstanceDetailView';
import { InstanceCreateModal } from './components/instances/InstanceCreateModal';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { AccountManagerView } from './components/accounts/AccountManagerView';
import { LogConsoleView } from './components/console/LogConsoleView';
import { SettingsView } from './components/settings/SettingsView';
import { AchievementsView } from './components/achievements/AchievementsView';
import { SocialView } from './components/social/SocialView';
import { ProfileStatsView } from './components/profile/ProfileStatsView';
import { ScreenshotsView } from './components/screenshots/ScreenshotsView';
import { AchievementToast } from './components/achievements/AchievementToast';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { UpdateModal } from './components/common/UpdateModal';
import { JavaSetupModal } from './components/common/JavaSetupModal';
import { GalaxyStartupAnimation } from './components/common/GalaxyStartupAnimation';
import {
  Instance,
  Account,
  LauncherSettings,
  JavaInstallation,
  LaunchProgress,
  LogEntry,
  UpdateStatus,
  Achievement
} from './types';
import { sounds } from './services/soundEngine';
import { resolvePlayerSkin } from './services/skinResolver';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [inspectingInstance, setInspectingInstance] = useState<Instance | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [activeUpdate, setActiveUpdate] = useState<UpdateStatus | null>(null);
  const [latestUnlockedAchievement, setLatestUnlockedAchievement] = useState<Achievement | null>(null);
  const [settings, setSettings] = useState<LauncherSettings>({
    theme: 'deep-void',
    backgroundAnimation: true,
    soundEffects: true,
    soundVolume: 0.7,
    closeOnLaunch: false,
    discordRpc: true,
    defaultJavaPath: '',
    defaultRamMin: 2048,
    defaultRamMax: 4096,
    instancesDirectory: ''
  });
  const [detectedJava, setDetectedJava] = useState<JavaInstallation[]>([]);
  const [launchProgress, setLaunchProgress] = useState<LaunchProgress | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalInitialTab, setCreateModalInitialTab] = useState<'create' | 'share_code' | 'import'>('create');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showJavaSetupModal, setShowJavaSetupModal] = useState(false);
  const [showStartupIntro, setShowStartupIntro] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem('galaxy_intro_played');
    } catch {
      return true;
    }
  });
  const [initialMarketplaceType, setInitialMarketplaceType] = useState<'mod' | 'modpack' | 'resourcepack' | 'shader'>('mod');

  // Mutable refs to prevent stale closure in global event listeners
  const instancesRef = React.useRef(instances);
  const selectedInstanceRef = React.useRef(selectedInstance);
  const handleLaunchRef = React.useRef<((inst: Instance) => Promise<void>) | null>(null);

  useEffect(() => {
    instancesRef.current = instances;
    selectedInstanceRef.current = selectedInstance;
    handleLaunchRef.current = handleLaunch;
  });

  // Initialize Launcher Data
  useEffect(() => {
    loadInitialData();
    setupEventListeners();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadInitialData = async () => {
    try {
      if (window.galaxy) {
        const [instList, accList, actAcc, sett] = await Promise.all([
          window.galaxy.listInstances(),
          window.galaxy.getAccounts(),
          window.galaxy.getActiveAccount(),
          window.galaxy.getSettings()
        ]);

        if (instList) {
          setInstances(instList);
          if (instList.length > 0) {
            setSelectedInstance(instList[0]);
          }
        }

        if (accList) setAccounts(accList);
        if (actAcc) setActiveAccount(actAcc);

        if (sett) {
          setSettings(sett);
          if (sett.startupAnimation === false) {
            setShowStartupIntro(false);
          }
          document.documentElement.className = `theme-${sett.theme || 'deep-void'}`;
          document.documentElement.setAttribute('data-theme', sett.theme || 'deep-void');
          sounds.setEnabled(sett.soundEffects);
          sounds.setVolume(sett.soundVolume);

          if (!sett.firstTimeSetupCompleted) {
            setShowOnboarding(true);
          }
        }

        // Load Java in background without blocking UI render
        window.galaxy.detectAllJava().then((javaList) => {
          if (javaList) {
            setDetectedJava(javaList);
            if (javaList.length === 0 && sett?.firstTimeSetupCompleted) {
              setShowJavaSetupModal(true);
            }
          }
        }).catch((e) => console.warn('Java background detection note:', e));
      }
    } catch (err) {
      console.error('Failed to initialize Galaxy Launcher data:', err);
    }
  };

  const setupEventListeners = () => {
    if (!window.galaxy) return;

    // System Tray & Quick Launch Trigger
    if (window.galaxy.onQuickLaunch) {
      window.galaxy.onQuickLaunch((instanceId) => {
        const currentList = instancesRef.current;
        const target = instanceId
          ? currentList.find((i) => i.id === instanceId)
          : (selectedInstanceRef.current || currentList[0]);

        if (target && handleLaunchRef.current) {
          handleLaunchRef.current(target);
        }
      });
    }

    window.galaxy.onLaunchProgress((prog) => {
      setLaunchProgress(prog);
      if (prog.progress >= 100) {
        setTimeout(() => setLaunchProgress(null), 1200);
      }
    });

    window.galaxy.onLog((log) => {
      setLogs((prev) => [...prev.slice(-1000), log]);
    });

    if (window.galaxy.onGameCrashed) {
      window.galaxy.onGameCrashed(({ instanceId, instanceName, analysis, code }) => {
        sounds.playError();
        setInstances((prev) => prev.map((i) => (i.id === instanceId ? { ...i, isRunning: false } : i)));
        setSelectedInstance((curr) => (curr && curr.id === instanceId ? { ...curr, isRunning: false } : curr));
        setInspectingInstance((curr) => (curr && curr.id === instanceId ? { ...curr, isRunning: false } : curr));

        if (analysis && analysis.isCrash) {
          addToast({
            type: 'error',
            title: `Game Stopped: ${analysis.title}`,
            message: `${analysis.explanation} ${analysis.suggestion ? `• Fix: ${analysis.suggestion}` : ''}`
          });
        } else if (code !== 0) {
          addToast({
            type: 'error',
            title: 'Minecraft Exited',
            message: `Game process terminated with code ${code}. Check Console Logs tab for detailed traceback.`
          });
        }
      });
    }

    if (window.galaxy.onGameStopped) {
      window.galaxy.onGameStopped(({ instanceId }) => {
        setInstances((prev) =>
          prev.map((i) => (i.id === instanceId ? { ...i, isRunning: false } : i))
        );
        setSelectedInstance((curr) => (curr && curr.id === instanceId ? { ...curr, isRunning: false } : curr));
        setInspectingInstance((curr) => (curr && curr.id === instanceId ? { ...curr, isRunning: false } : curr));
      });
    }

    window.galaxy.onAchievementUnlocked((ach) => {
      setSettings((curr) => {
        if (curr.enableAchievementPopups !== false) {
          setLatestUnlockedAchievement(ach);
        }
        return curr;
      });
    });

    const isNewer = (latest?: string, current?: string): boolean => {
      if (!latest || !current) return false;
      const clean = (v: string) => v.trim().replace(/^v/i, '');
      if (clean(latest) === clean(current)) return false;

      const parse = (v: string) => clean(v).split(/[-+.]/).map((n) => parseInt(n, 10) || 0);
      const [lMaj = 0, lMin = 0, lPat = 0] = parse(latest);
      const [cMaj = 0, cMin = 0, cPat = 0] = parse(current);

      if (lMaj > cMaj) return true;
      if (lMaj < cMaj) return false;
      if (lMin > cMin) return true;
      if (lMin < cMin) return false;
      return lPat > cPat;
    };

    window.galaxy.onUpdateStatus((update) => {
      if (
        (update.status === 'available' || update.status === 'downloading' || update.status === 'downloaded') &&
        update.latestVersion &&
        isNewer(update.latestVersion, update.currentVersion)
      ) {
        setActiveUpdate(update);
        if (update.status === 'available') {
          sounds.playSuccess();
          addToast({
            type: 'info',
            title: `Update v${update.latestVersion} Available`,
            message: 'Downloading update in the background...'
          });
        } else if (update.status === 'downloaded') {
          sounds.playSuccess();
          addToast({
            type: 'success',
            title: 'Update Ready!',
            message: 'Click Restart & Install to apply new version.'
          });
        }
      } else {
        setActiveUpdate(null);
      }
    });
  };

  const addToast = (toast: Omit<ToastMessage, 'id'> & { id?: string }) => {
    const id = toast.id || Math.random().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Periodic & Focus Process Reconciler to guarantee UI running state stays in sync
  useEffect(() => {
    const reconcileProcesses = async () => {
      if (!window.galaxy?.isInstanceRunning) return;
      const currentList = instancesRef.current;
      const runningInsts = currentList.filter((i) => i.isRunning);
      if (runningInsts.length === 0) return;

      for (const inst of runningInsts) {
        try {
          const isAlive = await window.galaxy.isInstanceRunning(inst.id);
          if (!isAlive) {
            setInstances((prev) =>
              prev.map((i) => (i.id === inst.id ? { ...i, isRunning: false } : i))
            );
            setSelectedInstance((curr) => (curr && curr.id === inst.id ? { ...curr, isRunning: false } : curr));
            setInspectingInstance((curr) => (curr && curr.id === inst.id ? { ...curr, isRunning: false } : curr));
          }
        } catch {}
      }
    };

    const interval = setInterval(reconcileProcesses, 1500);
    window.addEventListener('focus', reconcileProcesses);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', reconcileProcesses);
    };
  }, []);

  // Launch Game Handler
  const handleLaunch = async (instance: Instance) => {
    if (!activeAccount) {
      addToast({
        type: 'warning',
        title: 'Account Required',
        message: 'Please add or select a Minecraft account first in Skins & Auth.'
      });
      setActiveTab('accounts');
      return;
    }

    // Explicit User Requirement: Whenever an instance is opened / started,
    // the launcher first redirects the user to the Play Tab and then loads the instance in front of the user.
    setActiveTab('home');
    setSelectedInstance(instance);
    setInspectingInstance(null);

    sounds.playLaunch();
    // Update running state
    setInstances((prev) => prev.map((i) => (i.id === instance.id ? { ...i, isRunning: true } : i)));
    setSelectedInstance({ ...instance, isRunning: true });

    addToast({
      type: 'info',
      title: `Launching ${instance.name}`,
      message: `Player: ${activeAccount.username} (${activeAccount.type.toUpperCase()})`
    });

    try {
      await window.galaxy.launchInstance(instance.id);
    } catch (err: any) {
      sounds.playError();
      addToast({
        type: 'error',
        title: 'Launch Failed',
        message: err.message
      });
      setInstances((prev) => prev.map((i) => (i.id === instance.id ? { ...i, isRunning: false } : i)));
      if (selectedInstance?.id === instance.id) {
        setSelectedInstance({ ...selectedInstance, isRunning: false });
      }
    }
  };

  // Kill Process Handler
  const handleKill = async (instance: Instance) => {
    try {
      await window.galaxy.killInstance(instance.id);
      setInstances((prev) => prev.map((i) => (i.id === instance.id ? { ...i, isRunning: false } : i)));
      if (selectedInstance?.id === instance.id) {
        setSelectedInstance({ ...selectedInstance, isRunning: false });
      }
      addToast({
        type: 'info',
        title: `Stopped ${instance.name}`
      });
    } catch (err) {
      console.error('Failed to stop instance:', err);
    }
  };

  // 1-Click Performance Boost
  const handleOptimizeInstance = async (instance: Instance) => {
    sounds.playSuccess();
    addToast({
      type: 'info',
      title: 'Applying Performance Boost',
      message: 'Installing Sodium, Lithium, and FerriteCore...'
    });

    try {
      // Install performance mods from Modrinth
      if (instance.loader === 'fabric') {
        const perfMods = ['sodium', 'lithium', 'ferrite-core', 'iris'];
        for (const modSlug of perfMods) {
          try {
            const versions = await window.galaxy.getMarketplaceVersions(modSlug, ['fabric'], [instance.version]);
            if (versions.length > 0 && versions[0].files[0]) {
              const file = versions[0].files[0];
              await window.galaxy.installMarketplaceItem(
                instance.id,
                'mod',
                file.url,
                file.filename,
                file.hashes.sha1
              );
            }
          } catch (e) {
            console.warn(`Could not auto-fetch ${modSlug}:`, e);
          }
        }
      }

      // Mark instance as optimized
      const updated: Instance = { ...instance, isOptimized: true };
      await window.galaxy.updateInstance(updated);
      setInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      if (selectedInstance?.id === updated.id) setSelectedInstance(updated);

      sounds.playSuccess();
      addToast({
        type: 'success',
        title: 'Performance Boost Applied!',
        message: 'Sodium and RAM optimizations are now active.'
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Optimization failed',
        message: err.message
      });
    }
  };

  // Instance Create Handler
  const handleCreateInstance = async (data: {
    name: string;
    version: string;
    loader: any;
    loaderVersion?: string;
    icon?: string;
    iconBackground?: string;
    memoryMin?: number;
    memoryMax?: number;
    optimize?: boolean;
    jvmProfile?: any;
    resolution?: {
      width: number;
      height: number;
      fullscreen: boolean;
    };
  }) => {
    const newInst = await window.galaxy.createInstance(data);
    if (data.optimize) {
      await handleOptimizeInstance(newInst);
    }
    const refreshed = await window.galaxy.listInstances();
    setInstances(refreshed);
    setSelectedInstance(newInst);
    addToast({
      type: 'success',
      title: `Created "${newInst.name}"`,
      message: `Minecraft ${newInst.version} (${newInst.loader.toUpperCase()})`
    });
  };

  // Open Directory Handler
  const handleOpenFolder = (instance: Instance, subDir?: string) => {
    sounds.playClick();
    window.galaxy?.openInstanceFolder(instance.id, subDir);
  };

  const handleOpenCreateModal = (tab: 'create' | 'share_code' | 'import' = 'create') => {
    setCreateModalInitialTab(tab);
    setShowCreateModal(true);
  };

  const runningCount = instances.filter((i) => i.isRunning).length;

  return (
    <div
      className="relative w-screen h-screen flex flex-col text-slate-100 overflow-hidden"
      style={{ background: 'var(--theme-bg-radial, #07080e)' }}
    >
      {/* Background Interactive Starfield Shader Canvas */}
      <BackgroundCanvas animated={settings.backgroundAnimation} theme={settings.theme} />

      {/* Top Frameless Titlebar */}
      <Titlebar
        activeAccount={activeAccount}
        onOpenAccounts={() => {
          setInspectingInstance(null);
          setActiveTab('accounts');
        }}
        soundEnabled={settings.soundEffects}
        onToggleSound={() => {
          const updated = { ...settings, soundEffects: !settings.soundEffects };
          setSettings(updated);
          sounds.setEnabled(updated.soundEffects);
          window.galaxy?.saveSettings(updated);
        }}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex pt-11 overflow-hidden z-10">
        {/* Floating Cosmic Sidebar */}
        <Sidebar
          activeTab={inspectingInstance ? 'instances' : activeTab}
          onSelectTab={(tab) => {
            setInspectingInstance(null);
            setActiveTab(tab);
          }}
          runningCount={runningCount}
          instancesCount={instances.length}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 h-[calc(100vh-2.75rem)] overflow-y-auto custom-scrollbar relative flex flex-col">
          {inspectingInstance ? (
            <InstanceDetailView
              instance={inspectingInstance}
              onBack={() => setInspectingInstance(null)}
              onLaunch={handleLaunch}
              onKill={handleKill}
              onUpdateInstance={async (updated) => {
                await window.galaxy.updateInstance(updated);
                setInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                setInspectingInstance(updated);
                if (selectedInstance?.id === updated.id) setSelectedInstance(updated);
              }}
              onDeleteInstance={async (id) => {
                await window.galaxy.deleteInstance(id);
                const list = await window.galaxy.listInstances();
                setInstances(list);
                if (selectedInstance?.id === id) {
                  setSelectedInstance(list[0] || null);
                }
                setInspectingInstance(null);
                addToast({ type: 'success', title: 'Instance Deleted' });
              }}
              onCloneInstance={async (id, options) => {
                const cloned = await window.galaxy.cloneInstance(id, options);
                if (cloned) {
                  const list = await window.galaxy.listInstances();
                  setInstances(list);
                  setInspectingInstance(cloned);
                  addToast({ type: 'success', title: `Cloned into "${cloned.name}"` });
                }
              }}
              onOpenFolder={handleOpenFolder}
              onNavigateToMarketplace={(type) => {
                setInitialMarketplaceType(type);
                setInspectingInstance(null);
                setActiveTab('marketplace');
              }}
              onShowToast={addToast}
              detectedJava={detectedJava}
            />
          ) : activeTab === 'home' || activeTab === 'instances' ? (
            <HomeView
              activeTab={activeTab}
              instances={instances}
              selectedInstance={selectedInstance}
              onSelectInstance={(inst) => setSelectedInstance(inst)}
              onLaunch={handleLaunch}
              onKill={handleKill}
              launchProgress={launchProgress}
              activeAccount={activeAccount}
              onOpenInstanceDetails={(inst) => setInspectingInstance(inst)}
              onCreateInstance={handleOpenCreateModal}
              onOpenFolder={(inst) => handleOpenFolder(inst)}
              onOptimizeInstance={handleOptimizeInstance}
              onUpdateInstance={async (updated) => {
                await window.galaxy.updateInstance(updated);
                setInstances((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                if (selectedInstance?.id === updated.id) setSelectedInstance(updated);
              }}
              onDeleteInstance={async (id) => {
                await window.galaxy.deleteInstance(id);
                const list = await window.galaxy.listInstances();
                setInstances(list);
                if (selectedInstance?.id === id) {
                  setSelectedInstance(list[0] || null);
                }
                addToast({ type: 'success', title: 'Instance Deleted' });
              }}
              onCloneInstance={async (id, options) => {
                const cloned = await window.galaxy.cloneInstance(id, options);
                if (cloned) {
                  const list = await window.galaxy.listInstances();
                  setInstances(list);
                  setSelectedInstance(cloned);
                  addToast({ type: 'success', title: `Cloned into "${cloned.name}"` });
                }
              }}
              onSelectTab={(tab) => {
                setInspectingInstance(null);
                setActiveTab(tab);
              }}
              onNavigateToMarketplace={(type) => {
                setInitialMarketplaceType(type);
                setActiveTab('marketplace');
              }}
              onShowToast={addToast}
            />
          ) : activeTab === 'marketplace' ? (
            <MarketplaceView
              instances={instances}
              selectedInstance={selectedInstance}
              initialType={initialMarketplaceType}
              onShowToast={addToast}
              onRefreshInstances={async () => {
                const refreshed = await window.galaxy.listInstances();
                setInstances(refreshed);
              }}
              onSelectInstance={(inst) => {
                setSelectedInstance(inst);
              }}
              onNavigateToTab={(tab) => {
                setActiveTab(tab as TabType);
              }}
            />
          ) : activeTab === 'accounts' ? (
            <AccountManagerView
              accounts={accounts}
              activeAccount={activeAccount}
              onSetActiveAccount={async (id) => {
                const act = await window.galaxy.setActiveAccount(id);
                setActiveAccount(act);
                const list = await window.galaxy.getAccounts();
                setAccounts(list);
                addToast({
                  type: 'success',
                  title: `Switched account to "${act?.username}"`
                });
              }}
              onCreateOfflineAccount={async (name, skin, model) => {
                let finalSkin = skin;
                let finalModel = model || 'classic';
                if (!finalSkin) {
                  try {
                    const resolved = await resolvePlayerSkin(name);
                    finalSkin = resolved.skinUrl;
                    if (!model) finalModel = resolved.modelType;
                  } catch {
                    // Fallback
                  }
                }
                const newAcc = await window.galaxy.createOfflineAccount(name, finalSkin, finalModel);
                const list = await window.galaxy.getAccounts();
                setAccounts(list);
                setActiveAccount(newAcc);
              }}
              onAddMicrosoftAccount={async (name, skin, model, verifiedUuid) => {
                let finalUuid = verifiedUuid;
                let finalSkin = skin;
                let finalModel = model || 'classic';

                if (!finalUuid) {
                  const check = await window.galaxy.verifyOfficialMinecraftAccount(name);
                  if (!check.verified) {
                    throw new Error(check.error || `No official Minecraft account found for "${name}".`);
                  }
                  finalUuid = check.uuid;
                  finalSkin = skin || check.skinUrl;
                  finalModel = model || check.modelType || 'classic';
                }

                const newAcc = await window.galaxy.addMicrosoftAccount({
                  username: name,
                  uuid: finalUuid,
                  type: 'microsoft',
                  skinUrl: finalSkin || `https://crafatar.com/skins/${finalUuid}`,
                  modelType: finalModel
                });
                const list = await window.galaxy.getAccounts();
                setAccounts(list);
                setActiveAccount(newAcc);
              }}
              onRemoveAccount={async (id) => {
                await window.galaxy.removeAccount(id);
                const list = await window.galaxy.getAccounts();
                setAccounts(list);
                const act = await window.galaxy.getActiveAccount();
                setActiveAccount(act);
                addToast({ type: 'info', title: 'Account removed' });
              }}
              onUpdateAccountSkin={async (id, skinUrl, modelType) => {
                await window.galaxy.updateAccountSkin(id, skinUrl, modelType);
                const list = await window.galaxy.getAccounts();
                setAccounts(list);
                const act = await window.galaxy.getActiveAccount();
                setActiveAccount(act);
              }}
              onShowToast={addToast}
            />
          ) : activeTab === 'screenshots' ? (
            <ScreenshotsView instances={instances} />
          ) : activeTab === 'achievements' ? (
            <AchievementsView
              onShowToast={addToast}
              settings={settings}
              activeAccount={activeAccount}
              onSaveSettings={async (newSett) => {
                await window.galaxy.saveSettings(newSett);
                setSettings(newSett);
              }}
            />
          ) : activeTab === 'social' ? (
            <SocialView
              instances={instances}
              activeAccount={activeAccount}
              onLaunchInstance={handleLaunch}
              onShowToast={addToast}
              initialTab="friends"
              onInstanceRestored={async (inst) => {
                const list = await window.galaxy.listInstances();
                setInstances(list);
                setSelectedInstance(inst);
                setActiveTab('instances');
              }}
            />
          ) : activeTab === 'cloud' ? (
            <SocialView
              instances={instances}
              activeAccount={activeAccount}
              onLaunchInstance={handleLaunch}
              onShowToast={addToast}
              initialTab="cloud"
              onInstanceRestored={async (inst) => {
                const list = await window.galaxy.listInstances();
                setInstances(list);
                setSelectedInstance(inst);
                setActiveTab('instances');
              }}
            />
          ) : activeTab === 'profile' ? (
            <ProfileStatsView
              instances={instances}
              activeAccount={activeAccount}
              settings={settings}
              onSaveSettings={async (newSett) => {
                const oldTheme = settings.theme || 'deep-void';
                const newTheme = newSett.theme || 'deep-void';
                await window.galaxy.saveSettings(newSett);
                setSettings(newSett);
                document.documentElement.className = `theme-${newTheme}`;
                document.documentElement.setAttribute('data-theme', newTheme);
                sounds.setEnabled(newSett.soundEffects);
                sounds.setVolume(newSett.soundVolume);
                if (newTheme !== oldTheme && window.galaxy.themeChangedAchievement) {
                  window.galaxy.themeChangedAchievement(newTheme);
                }
              }}
              onLaunchInstance={handleLaunch}
              onShowToast={addToast}
              onPreviewStartupAnimation={() => setShowStartupIntro(true)}
            />
          ) : activeTab === 'console' ? (
            <LogConsoleView
              logs={logs}
              onClearLogs={() => setLogs([])}
              onShowToast={addToast}
            />
          ) : activeTab === 'settings' ? (
            <SettingsView
              settings={settings}
              onSaveSettings={async (newSett) => {
                await window.galaxy.saveSettings(newSett);
                setSettings(newSett);
              }}
              detectedJava={detectedJava}
              onScanJava={async () => {
                const runtimes = await window.galaxy.detectAllJava();
                setDetectedJava(runtimes);
              }}
              onShowToast={addToast}
              onOpenOnboarding={() => setShowOnboarding(true)}
            />
          ) : null}
        </main>
      </div>

      {/* Modals & Floating Notifications */}
      <InstanceCreateModal
        isOpen={showCreateModal}
        initialTab={createModalInitialTab}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateInstance}
        onImportSuccess={async (newInst) => {
          const refreshed = await window.galaxy.listInstances();
          setInstances(refreshed);
          setSelectedInstance(newInst);
          addToast({
            type: 'success',
            title: `Imported "${newInst.name}"`,
            message: `Modpack successfully installed!`
          });
          setShowCreateModal(false);
        }}
        detectedJava={detectedJava}
        defaultRamMax={settings.defaultRamMax}
      />

      {showOnboarding && (
        <OnboardingModal
          settings={settings}
          onUpdateSettings={async (newSett) => {
            await window.galaxy.saveSettings(newSett);
            setSettings(newSett);
            document.documentElement.className = `theme-${newSett.theme || 'deep-void'}`;
            document.documentElement.setAttribute('data-theme', newSett.theme || 'deep-void');
            sounds.setEnabled(newSett.soundEffects);
            sounds.setVolume(newSett.soundVolume);

            // Sync user's RAM and Resolution choice to existing instances
            if (instances.length > 0) {
              const updatedInsts = await Promise.all(
                instances.map(async (inst) => {
                  const updated: Instance = {
                    ...inst,
                    memoryMax: newSett.defaultRamMax || inst.memoryMax,
                    memoryMin: newSett.defaultRamMin || inst.memoryMin,
                    resolution: {
                      width: newSett.defaultResolutionWidth || inst.resolution?.width || 1280,
                      height: newSett.defaultResolutionHeight || inst.resolution?.height || 720,
                      fullscreen: newSett.defaultFullscreen !== undefined ? newSett.defaultFullscreen : inst.resolution?.fullscreen ?? false
                    }
                  };
                  await window.galaxy.updateInstance(updated);
                  return updated;
                })
              );
              setInstances(updatedInsts);
              if (selectedInstance) {
                const updatedSelected = updatedInsts.find((i) => i.id === selectedInstance.id);
                if (updatedSelected) setSelectedInstance(updatedSelected);
              }
            }
          }}
          onCreateOfflineAccount={async (name, skin, model) => {
            let finalSkin = skin;
            let finalModel = model || 'classic';
            if (!finalSkin) {
              try {
                const resolved = await resolvePlayerSkin(name);
                finalSkin = resolved.skinUrl;
                if (!model) finalModel = resolved.modelType;
              } catch {
                // Fallback
              }
            }
            const newAcc = await window.galaxy.createOfflineAccount(name, finalSkin, finalModel);
            const list = await window.galaxy.getAccounts();
            setAccounts(list);
            setActiveAccount(newAcc);
            addToast({
              type: 'success',
              title: `Created Profile "${newAcc.username}"`
            });
          }}
          onAddMicrosoftAccount={async (name, skin, model) => {
            const check = await window.galaxy.verifyOfficialMinecraftAccount(name);
            if (!check.verified) {
              throw new Error(check.error || `No official Minecraft account found for "${name}".`);
            }
            const newAcc = await window.galaxy.addMicrosoftAccount({
              username: check.username,
              uuid: check.uuid,
              type: 'microsoft',
              skinUrl: skin || check.skinUrl || `https://crafatar.com/skins/${check.uuid}`,
              modelType: model || check.modelType || 'classic'
            });
            const list = await window.galaxy.getAccounts();
            setAccounts(list);
            setActiveAccount(newAcc);
            addToast({
              type: 'success',
              title: `Signed in as "${newAcc.username}"`,
              message: 'Official Minecraft profile connected.'
            });
          }}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {settings.enableAchievementPopups !== false && (
        <AchievementToast
          achievement={latestUnlockedAchievement}
          onDismiss={() => setLatestUnlockedAchievement(null)}
        />
      )}

      {/* Direct In-App Update Modal (Suppressed during onboarding) */}
      {!showOnboarding && (
        <UpdateModal
          updateStatus={activeUpdate}
          onDismiss={() => setActiveUpdate(null)}
        />
      )}

      {/* Java 21 LTS Automatic Setup Modal */}
      <JavaSetupModal
        isOpen={showJavaSetupModal}
        onClose={() => setShowJavaSetupModal(false)}
        onSuccess={async () => {
          const runtimes = await window.galaxy.detectAllJava();
          setDetectedJava(runtimes);
          addToast({
            type: 'success',
            title: 'Java Runtime Installed',
            message: 'Eclipse Temurin OpenJDK 21 LTS is ready for Minecraft.'
          });
        }}
        onShowToast={addToast}
      />

      {/* Cosmic Startup Rocket Intro Animation */}
      {showStartupIntro && (
        <GalaxyStartupAnimation
          onComplete={() => {
            try {
              sessionStorage.setItem('galaxy_intro_played', 'true');
            } catch {}
            setShowStartupIntro(false);
          }}
          onDisableFuture={async (disabled) => {
            const updated = { ...settings, startupAnimation: !disabled };
            setSettings(updated);
            await window.galaxy.saveSettings(updated);
            addToast({
              type: 'info',
              title: 'Startup Animation Disabled',
              message: 'You can re-enable it anytime in Settings > Themes & Visuals.'
            });
          }}
          soundEnabled={settings.soundEffects}
          soundVolume={settings.soundVolume}
        />
      )}
    </div>
  );
};
