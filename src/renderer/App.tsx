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
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import {
  Instance,
  Account,
  LauncherSettings,
  JavaInstallation,
  LaunchProgress,
  LogEntry
} from './types';
import { sounds } from './services/soundEngine';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [inspectingInstance, setInspectingInstance] = useState<Instance | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [settings, setSettings] = useState<LauncherSettings>({
    theme: 'nebula-purple',
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initialMarketplaceType, setInitialMarketplaceType] = useState<'mod' | 'modpack' | 'resourcepack' | 'shader'>('mod');

  // Initialize Launcher Data
  useEffect(() => {
    loadInitialData();
    setupEventListeners();
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
          document.documentElement.className = `theme-${sett.theme || 'nebula-purple'}`;
          document.documentElement.setAttribute('data-theme', sett.theme || 'nebula-purple');
          sounds.setEnabled(sett.soundEffects);
          sounds.setVolume(sett.soundVolume);

          if (!sett.firstTimeSetupCompleted) {
            setShowOnboarding(true);
          }
        }

        // Load Java in background without blocking UI render
        window.galaxy.detectAllJava().then((javaList) => {
          if (javaList) setDetectedJava(javaList);
        }).catch((e) => console.warn('Java background detection note:', e));
      }
    } catch (err) {
      console.error('Failed to initialize Galaxy Launcher data:', err);
    }
  };

  const setupEventListeners = () => {
    if (!window.galaxy) return;

    window.galaxy.onLaunchProgress((prog) => {
      setLaunchProgress(prog);
      if (prog.progress >= 100) {
        setTimeout(() => setLaunchProgress(null), 1200);
      }
    });

    window.galaxy.onLog((log) => {
      setLogs((prev) => [...prev.slice(-1000), log]);
    });

    window.galaxy.onUpdateStatus((update) => {
      if (update.status === 'available') {
        addToast({
          type: 'info',
          title: `Update v${update.latestVersion} Available`,
          message: 'A new version of Galaxy Launcher is available in Settings.'
        });
      } else if (update.status === 'downloaded') {
        addToast({
          type: 'success',
          title: 'Update Ready!',
          message: 'Click in Settings to restart and apply new version.'
        });
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

    sounds.playLaunch();
    // Update running state
    setInstances((prev) => prev.map((i) => (i.id === instance.id ? { ...i, isRunning: true } : i)));
    if (selectedInstance?.id === instance.id) {
      setSelectedInstance({ ...selectedInstance, isRunning: true });
    }

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
    memoryMin?: number;
    memoryMax?: number;
    optimize?: boolean;
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

  const runningCount = instances.filter((i) => i.isRunning).length;

  return (
    <div className="relative w-screen h-screen flex flex-col bg-galaxy-950 text-slate-100 overflow-hidden">
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
          onCreateInstance={() => setShowCreateModal(true)}
          runningCount={runningCount}
          instancesCount={instances.length}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 h-full flex flex-col overflow-hidden relative">
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
              onCloneInstance={async (id, newName) => {
                const cloned = await window.galaxy.cloneInstance(id, newName);
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
              instances={instances}
              selectedInstance={selectedInstance}
              onSelectInstance={(inst) => setSelectedInstance(inst)}
              onLaunch={handleLaunch}
              onKill={handleKill}
              launchProgress={launchProgress}
              activeAccount={activeAccount}
              onOpenInstanceDetails={(inst) => setInspectingInstance(inst)}
              onCreateInstance={() => setShowCreateModal(true)}
              onOpenFolder={(inst) => handleOpenFolder(inst)}
              onOptimizeInstance={handleOptimizeInstance}
            />
          ) : activeTab === 'marketplace' ? (
            <MarketplaceView
              instances={instances}
              selectedInstance={selectedInstance}
              initialType={initialMarketplaceType}
              onShowToast={addToast}
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
                const newAcc = await window.galaxy.createOfflineAccount(name, skin, model);
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
              onShowToast={addToast}
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
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateInstance}
        detectedJava={detectedJava}
        defaultRamMax={settings.defaultRamMax}
      />

      {showOnboarding && (
        <OnboardingModal
          settings={settings}
          onUpdateSettings={async (newSett) => {
            await window.galaxy.saveSettings(newSett);
            setSettings(newSett);
            document.documentElement.className = `theme-${newSett.theme || 'nebula-purple'}`;
            document.documentElement.setAttribute('data-theme', newSett.theme || 'nebula-purple');
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
                      width: newSett.defaultResolutionWidth || inst.resolution.width,
                      height: newSett.defaultResolutionHeight || inst.resolution.height,
                      fullscreen: newSett.defaultFullscreen !== undefined ? newSett.defaultFullscreen : inst.resolution.fullscreen
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
            const newAcc = await window.galaxy.createOfflineAccount(name, skin, model);
            const list = await window.galaxy.getAccounts();
            setAccounts(list);
            setActiveAccount(newAcc);
            addToast({
              type: 'success',
              title: `Created Profile "${newAcc.username}"`
            });
          }}
          onAddMicrosoftAccount={() => {
            setActiveTab('accounts');
            addToast({
              type: 'info',
              title: 'Microsoft Sign-in',
              message: 'Add your Microsoft account in the Skins & Auth panel.'
            });
          }}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
