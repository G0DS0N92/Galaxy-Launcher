import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Orbit,
  Palette,
  User,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Volume2,
  VolumeX,
  Layers,
  Flame,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Monitor,
  Maximize2,
  Sliders,
  HardDrive,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { LauncherSettings, Account, SystemSpecs } from '../../types';
import { sounds } from '../../services/soundEngine';
import { resolvePlayerSkin } from '../../services/skinResolver';

interface OnboardingModalProps {
  settings: LauncherSettings;
  onUpdateSettings: (settings: LauncherSettings) => Promise<void>;
  onCreateOfflineAccount: (username: string, skinUrl?: string, modelType?: 'classic' | 'slim') => Promise<void>;
  onAddMicrosoftAccount: (username: string, skinUrl?: string, modelType?: 'classic' | 'slim') => Promise<void>;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  settings,
  onUpdateSettings,
  onCreateOfflineAccount,
  onAddMicrosoftAccount,
  onComplete
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTheme, setSelectedTheme] = useState<LauncherSettings['theme']>(settings.theme || 'deep-void');
  const [bgAnimation, setBgAnimation] = useState<boolean>(settings.backgroundAnimation ?? true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEffects ?? true);
  const [soundVolume, setSoundVolume] = useState<number>(settings.soundVolume ?? 0.7);

  // Step 3: Hardware RAM & Resolution State
  const [systemSpecs, setSystemSpecs] = useState<SystemSpecs | null>(null);
  const [ramMax, setRamMax] = useState<number>(settings.defaultRamMax || 4096);
  const [ramMin, setRamMin] = useState<number>(settings.defaultRamMin || 2048);
  const [resolutionWidth, setResolutionWidth] = useState<number>(settings.defaultResolutionWidth || 1920);
  const [resolutionHeight, setResolutionHeight] = useState<number>(settings.defaultResolutionHeight || 1080);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(settings.defaultFullscreen || false);

  // Step 4: Account Step State
  const [authChoice, setAuthChoice] = useState<'cracked' | 'microsoft' | 'later'>('cracked');
  const [username, setUsername] = useState('');
  const [msEmail, setMsEmail] = useState('');
  const [msPassword, setMsPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modelType, setModelType] = useState<'classic' | 'slim'>('classic');
  const [skinOption, setSkinOption] = useState<'steve' | 'cosmic' | 'custom'>('steve');
  const [customSkinUrl, setCustomSkinUrl] = useState('');

  const themes: {
    id: LauncherSettings['theme'];
    name: string;
    desc: string;
    gradient: string;
    accentHex: string;
    borderCol: string;
  }[] = [
    {
      id: 'deep-void',
      name: 'Deep Void Obsidian',
      desc: 'Ultra-dark stealth obsidian',
      gradient: 'from-slate-950 via-zinc-950 to-black',
      accentHex: '#94a3b8',
      borderCol: 'border-slate-500/40'
    },
    {
      id: 'nebula-purple',
      name: 'Nebula Purple',
      desc: 'Deep cosmic violet & indigo',
      gradient: 'from-purple-900 via-indigo-950 to-black',
      accentHex: '#a855f7',
      borderCol: 'border-purple-500/40'
    },
    {
      id: 'supernova-cyan',
      name: 'Supernova Cyan',
      desc: 'Electric neon cyan & teal',
      gradient: 'from-cyan-950 via-sky-950 to-black',
      accentHex: '#06b6d4',
      borderCol: 'border-cyan-500/40'
    },
    {
      id: 'solar-gold',
      name: 'Solar Flare Gold',
      desc: 'Warm stellar amber & gold',
      gradient: 'from-amber-950 via-orange-950 to-black',
      accentHex: '#f59e0b',
      borderCol: 'border-amber-500/40'
    },
    {
      id: 'emerald-aurora',
      name: 'Emerald Aurora',
      desc: 'Radiant aurora & emerald mint',
      gradient: 'from-emerald-950 via-teal-950 to-black',
      accentHex: '#10b981',
      borderCol: 'border-emerald-500/40'
    },
    {
      id: 'crimson-quasar',
      name: 'Crimson Quasar',
      desc: 'Blazing supernova & crimson',
      gradient: 'from-rose-950 via-red-950 to-black',
      accentHex: '#f43f5e',
      borderCol: 'border-rose-500/40'
    }
  ];

  // Descending order: 2560x1440 -> 1920x1080 (Default) -> 1600x900 -> 1280x720
  const resolutionPresets = [
    { label: '1440p (2K QHD)', width: 2560, height: 1440, desc: 'Crisp High-End' },
    { label: '1080p (Full HD)', width: 1920, height: 1080, desc: 'Recommended Standard (Default)' },
    { label: '900p (HD+)', width: 1600, height: 900, desc: 'Balanced Wide' },
    { label: '720p (HD Ready)', width: 1280, height: 720, desc: 'Laptops / High FPS' }
  ];

  const ramPresets = [
    { label: '2 GB', mb: 2048, desc: 'Light / Vanilla' },
    { label: '4 GB', mb: 4096, desc: 'Standard / OptiFine' },
    { label: '6 GB', mb: 6144, desc: 'Shaders / Modded' },
    { label: '8 GB', mb: 8192, desc: 'Heavy Modpacks' },
    { label: '12 GB', mb: 12288, desc: 'Extreme 200+ Mods' },
    { label: '16 GB', mb: 16384, desc: 'Max Allocation' }
  ];

  useEffect(() => {
    // Auto-detect system hardware specifications on mount
    const detectHardware = async () => {
      try {
        if (window.galaxy?.getSystemSpecs) {
          const specs = await window.galaxy.getSystemSpecs();
          setSystemSpecs(specs);
          // If no custom RAM is set yet, default to recommended
          if (!settings.defaultRamMax && specs.recommendedRamMb) {
            setRamMax(specs.recommendedRamMb);
          }
        }
      } catch (err) {
        console.error('Failed to detect system hardware specs:', err);
      }
    };
    detectHardware();
  }, []);

  useEffect(() => {
    document.documentElement.className = `theme-${selectedTheme}`;
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }, [selectedTheme]);

  const handleThemeChange = (themeId: LauncherSettings['theme']) => {
    setSelectedTheme(themeId);
    sounds.playSwitch();
    document.documentElement.className = `theme-${themeId}`;
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const handleNext = async () => {
    sounds.playClick();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      // Save visual & hardware preferences
      const updated: LauncherSettings = {
        ...settings,
        theme: selectedTheme,
        backgroundAnimation: bgAnimation,
        soundEffects: soundEnabled,
        soundVolume: soundVolume,
        defaultRamMax: ramMax,
        defaultRamMin: ramMin,
        defaultResolutionWidth: resolutionWidth,
        defaultResolutionHeight: resolutionHeight,
        defaultFullscreen: isFullscreen
      };
      await onUpdateSettings(updated);
      setStep(4);
    } else if (step === 4) {
      handleFinish();
    }
  };

  const handleBack = () => {
    sounds.playClick();
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
    if (step === 4) setStep(3);
  };

  const handleFinish = async () => {
    sounds.playSuccess();
    if (authChoice === 'cracked' && username.trim()) {
      let finalSkin = undefined;
      let finalModel = modelType;
      if (skinOption === 'custom' && customSkinUrl.trim()) {
        finalSkin = customSkinUrl.trim();
      } else {
        try {
          const resolved = await resolvePlayerSkin(username.trim());
          finalSkin = resolved.skinUrl;
          finalModel = resolved.modelType;
        } catch {
          finalSkin = `https://minotar.net/skin/${username.trim()}`;
        }
      }
      await onCreateOfflineAccount(username.trim(), finalSkin, finalModel);
    } else if (authChoice === 'microsoft' && msEmail.trim() && msPassword.trim() && username.trim()) {
      const finalGamertag = username.trim();
      let finalSkin = undefined;
      let finalModel = modelType;
      if (skinOption === 'custom' && customSkinUrl.trim()) {
        finalSkin = customSkinUrl.trim();
      } else {
        try {
          const resolved = await resolvePlayerSkin(finalGamertag);
          finalSkin = resolved.skinUrl;
          finalModel = resolved.modelType;
        } catch {
          finalSkin = `https://minotar.net/skin/${finalGamertag}`;
        }
      }
      await onAddMicrosoftAccount(finalGamertag, finalSkin, finalModel);
    }

    await onUpdateSettings({
      ...settings,
      theme: selectedTheme,
      backgroundAnimation: bgAnimation,
      soundEffects: soundEnabled,
      soundVolume: soundVolume,
      defaultRamMax: ramMax,
      defaultRamMin: ramMin,
      defaultResolutionWidth: resolutionWidth,
      defaultResolutionHeight: resolutionHeight,
      defaultFullscreen: isFullscreen,
      firstTimeSetupCompleted: true
    });

    onComplete();
  };

  const handleSkip = async () => {
    sounds.playClick();
    await onUpdateSettings({
      ...settings,
      theme: selectedTheme,
      backgroundAnimation: bgAnimation,
      soundEffects: soundEnabled,
      soundVolume: soundVolume,
      defaultRamMax: ramMax,
      defaultRamMin: ramMin,
      defaultResolutionWidth: resolutionWidth,
      defaultResolutionHeight: resolutionHeight,
      defaultFullscreen: isFullscreen,
      firstTimeSetupCompleted: true
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-xl select-none animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-galaxy-900/90 border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Cosmic Header & Step Tracker */}
        <div className="px-8 pt-6 pb-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-glow-sm">
              <Orbit className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-sm tracking-wider text-white">GALAXY LAUNCHER</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SETUP
                </span>
              </div>
              <p className="text-xs text-slate-400">Step {step} of 4</p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? 'w-8 bg-gradient-to-r from-purple-500 to-cyan-400'
                    : s < step
                    ? 'w-3 bg-purple-500/60'
                    : 'w-3 bg-white/[0.1]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body: Dynamic Step Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* STEP 1: WELCOME & INTRO */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2 text-center max-w-lg mx-auto">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Welcome to the Next Generation</span>
                </div>
                <h2 className="text-2xl font-display font-extrabold text-white tracking-wide">
                  Minecraft, Reimagined for You
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Galaxy Launcher brings together lightning-fast performance, full modding freedom, instant Modrinth marketplace access, and customizable hardware presets.
                </p>
              </div>

              {/* 4 Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                    <Orbit className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-slate-200">Modrinth Marketplace</div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      Browse & 1-click install 100,000+ mods, shaders, and modpacks.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-slate-200">Isolated Instances</div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      Run Fabric, Forge, NeoForge, Quilt & Vanilla side-by-side with zero conflicts.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-slate-200">Custom Memory & Display</div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      Set custom RAM limits, 1080p/720p/2K resolutions, and GPU shaders.
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-slate-200">Premium & Cracked</div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      Seamless support for both Microsoft OAuth and Offline Cracked accounts.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: THEME & VISUAL CUSTOMIZATION */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-white">
                  Personalize Your Cosmic Aesthetic
                </h3>
                <p className="text-xs text-slate-400">
                  Select your favorite launcher color scheme. The entire UI updates live!
                </p>
              </div>

              {/* Theme Grid: Equalized, Compact, Uniform Height */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {themes.map((t) => {
                  const isSelected = selectedTheme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={`h-[68px] px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between bg-gradient-to-r ${t.gradient} ${
                        isSelected
                          ? `border-white shadow-glow-sm ring-2 ring-white/20`
                          : 'border-white/[0.08] hover:border-white/[0.2] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.accentHex }}
                          />
                          <span className="font-bold text-xs text-white truncate">{t.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{t.desc}</p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border ${
                          isSelected
                            ? 'bg-white text-black border-white'
                            : 'border-white/[0.2]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Toggles: Starfield & Audio */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/[0.08]">
                <div
                  onClick={() => {
                    sounds.playSwitch();
                    setBgAnimation(!bgAnimation);
                  }}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-slate-200">Starfield Particle Shader</div>
                    <div className="text-[11px] text-slate-400">GPU cosmic particle background</div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      bgAnimation ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        bgAnimation ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                <div
                  onClick={() => {
                    sounds.playSwitch();
                    setSoundEnabled(!soundEnabled);
                  }}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-slate-200">UI Sound Effects</div>
                    <div className="text-[11px] text-slate-400">Futuristic clicks and launch audio</div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      soundEnabled ? 'bg-purple-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: HARDWARE RAM ALLOCATION & DISPLAY RESOLUTION */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <span>Memory (RAM) & Display Resolution</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Configure how much RAM Minecraft can use and set your preferred default game window resolution.
                </p>
              </div>

              {/* Auto-Detected Hardware Specification Banner */}
              {systemSpecs && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-black/60 border border-cyan-500/30 flex items-center justify-between shadow-glow-sm">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white truncate">{systemSpecs.cpuModel}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                          {systemSpecs.cpuCores} Cores
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Total System RAM: <span className="text-slate-200 font-semibold">{(systemSpecs.totalMemoryMb / 1024).toFixed(1)} GB</span> • Free: <span className="text-slate-200">{(systemSpecs.freeMemoryMb / 1024).toFixed(1)} GB</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">Recommended RAM</span>
                    <span className="text-xs font-mono font-bold text-white bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 rounded-md inline-block">
                      {systemSpecs.recommendedRamMb} MB ({(systemSpecs.recommendedRamMb / 1024).toFixed(0)} GB)
                    </span>
                  </div>
                </div>
              )}

              {/* RAM Allocation Section */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-xs text-slate-200">RAM Allocation Limit</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg">
                    {ramMax} MB ({(ramMax / 1024).toFixed(1)} GB)
                  </span>
                </div>

                {/* RAM Quick Presets */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {ramPresets.map((preset) => {
                    const isRecommended = preset.mb === (systemSpecs?.recommendedRamMb || 4096);
                    return (
                      <button
                        key={preset.mb}
                        type="button"
                        onClick={() => {
                          sounds.playSwitch();
                          setRamMax(preset.mb);
                        }}
                        className={`py-2 px-1 rounded-xl border text-center transition-all relative ${
                          ramMax === preset.mb
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200 font-bold shadow-glow-sm'
                            : isRecommended
                            ? 'border-cyan-500/40 bg-cyan-500/5 text-slate-300 hover:border-cyan-500/70'
                            : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/[0.15]'
                        }`}
                      >
                        <div className="text-xs">{preset.label}</div>
                        {isRecommended && (
                          <div className="text-[9px] font-semibold text-cyan-300 mt-0.5">★ Rec.</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* RAM Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1024"
                    max="16384"
                    step="512"
                    value={ramMax}
                    onChange={(e) => setRamMax(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>1 GB (Low)</span>
                    <span>4 GB (Standard)</span>
                    <span>8 GB (Modded)</span>
                    <span>16 GB (Heavy)</span>
                  </div>
                </div>
              </div>

              {/* Game Window Resolution Section */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <span className="font-semibold text-xs text-slate-200">Default Game Resolution</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-lg">
                    {isFullscreen ? 'Fullscreen' : `${resolutionWidth} × ${resolutionHeight}`}
                  </span>
                </div>

                {/* Resolution Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {resolutionPresets.map((res) => {
                    const isSelected = !isFullscreen && resolutionWidth === res.width && resolutionHeight === res.height;
                    return (
                      <button
                        key={`${res.width}x${res.height}`}
                        type="button"
                        onClick={() => {
                          sounds.playSwitch();
                          setResolutionWidth(res.width);
                          setResolutionHeight(res.height);
                          setIsFullscreen(false);
                        }}
                        className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/20 text-purple-200 font-bold shadow-glow-sm'
                            : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/[0.15]'
                        }`}
                      >
                        <div className="text-xs font-bold font-mono truncate">{res.width} × {res.height}</div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-purple-300 font-semibold' : 'text-slate-400'}`}>{res.desc}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Fullscreen Toggle */}
                <div
                  onClick={() => {
                    sounds.playSwitch();
                    setIsFullscreen(!isFullscreen);
                  }}
                  className="pt-2 border-t border-white/[0.06] flex items-center justify-between cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-slate-200 flex items-center space-x-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Start Minecraft in Fullscreen Mode</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Launch directly in borderless fullscreen</div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      isFullscreen ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        isFullscreen ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ACCOUNT SELECTION */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-white">
                  Choose Your Account Type
                </h3>
                <p className="text-xs text-slate-400">
                  You can play offline with a Cracked username or connect your official Microsoft license.
                </p>
              </div>

              {/* Auth Mode Picker Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    sounds.playSwitch();
                    setAuthChoice('cracked');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    authChoice === 'cracked'
                      ? 'bg-cyan-500/15 border-cyan-500 shadow-glow-cyan'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      <User className="w-5 h-5" />
                    </div>
                    {authChoice === 'cracked' && (
                      <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100">Cracked (Offline Mode)</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Play offline instantly with any custom player nickname.
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    sounds.playSwitch();
                    setAuthChoice('microsoft');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    authChoice === 'microsoft'
                      ? 'bg-emerald-500/15 border-emerald-500 shadow-glow-emerald'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    {authChoice === 'microsoft' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100">Microsoft (Official)</div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Log in securely with OAuth to access official multiplayer servers.
                    </div>
                  </div>
                </div>
              </div>

              {/* Form details for Cracked or Microsoft */}
              {authChoice === 'microsoft' && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Microsoft Account Email</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">Required</span>
                    </label>
                    <input
                      type="email"
                      value={msEmail}
                      onChange={(e) => setMsEmail(e.target.value)}
                      placeholder="e.g. yourname@outlook.com, hotmail.com, or gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Microsoft Account Password</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">Required</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={msPassword}
                        onChange={(e) => setMsPassword(e.target.value)}
                        placeholder="Enter your Microsoft account password"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Minecraft In-Game Name (IGN)</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">Required</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. MasterChief, Notch, G0DS0N92..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <p className="text-[10px] text-slate-400">
                      Enter the exact in-game character name registered with this Microsoft Minecraft account.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Character Model Arms</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModelType('classic')}
                        className={`p-2 rounded-xl border text-xs font-medium ${
                          modelType === 'classic'
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200'
                            : 'border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        Classic (Steve, 4px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModelType('slim')}
                        className={`p-2 rounded-xl border text-xs font-medium ${
                          modelType === 'slim'
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200'
                            : 'border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        Slim (Alex, 3px)
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">Official Microsoft MSA profile & skins will be synchronized.</span>
                  </div>
                </div>
              )}

              {authChoice === 'cracked' && (
                <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Player Nickname <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. GalaxyPlayer"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Character Model Arms</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModelType('classic')}
                        className={`p-2 rounded-xl border text-xs font-medium ${
                          modelType === 'classic'
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200'
                            : 'border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        Classic (Steve, 4px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModelType('slim')}
                        className={`p-2 rounded-xl border text-xs font-medium ${
                          modelType === 'slim'
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200'
                            : 'border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        Slim (Alex, 3px)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation & Skip Button */}
        <div className="px-8 py-4 bg-black/40 border-t border-white/[0.08] flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Skip to Launcher button at the bottom right */}
            <button
              onClick={handleSkip}
              className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-all font-medium flex items-center space-x-1"
            >
              <span>Skip to Launcher</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* Next / Finish Button */}
            <button
              onClick={handleNext}
              disabled={
                step === 4 &&
                ((authChoice === 'cracked' && !username.trim()) ||
                 (authChoice === 'microsoft' && (!msEmail.trim() || !msPassword.trim() || !username.trim())))
              }
              className={`px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-2 transition-all ${
                step === 4 &&
                ((authChoice === 'cracked' && !username.trim()) ||
                 (authChoice === 'microsoft' && (!msEmail.trim() || !msPassword.trim() || !username.trim())))
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95'
              }`}
            >
              <span>{step === 4 ? 'Launch Galaxy' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
