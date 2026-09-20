import React, { useState, useEffect } from 'react';
import {
  Copy,
  X,
  Boxes,
  Sliders,
  Sparkles,
  Layers,
  Globe,
  Camera,
  BarChart3,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Instance, CloneInstanceOptions } from '../../types';
import { sounds } from '../../services/soundEngine';

interface CloneInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: Instance | null;
  onClone: (instanceId: string, options: CloneInstanceOptions) => Promise<void>;
}

export const CloneInstanceModal: React.FC<CloneInstanceModalProps> = ({
  isOpen,
  onClose,
  instance,
  onClone
}) => {
  const [name, setName] = useState('');
  const [copyMods, setCopyMods] = useState(true);
  const [copyConfigurations, setCopyConfigurations] = useState(true);
  const [copyResourcePacks, setCopyResourcePacks] = useState(true);
  const [copyShaderPacks, setCopyShaderPacks] = useState(true);
  const [copyWorlds, setCopyWorlds] = useState(true);
  const [copyScreenshots, setCopyScreenshots] = useState(true);
  const [copyStatistics, setCopyStatistics] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    if (instance) {
      setName(`${instance.name} - Test`);
      setCopyMods(true);
      setCopyConfigurations(true);
      setCopyResourcePacks(true);
      setCopyShaderPacks(true);
      setCopyWorlds(true);
      setCopyScreenshots(true);
      setCopyStatistics(false);
      setIsCloning(false);
    }
  }, [instance, isOpen]);

  if (!isOpen || !instance) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || isCloning) return;

    try {
      setIsCloning(true);
      sounds.playLaunch();
      await onClone(instance.id, {
        name: name.trim(),
        copyMods,
        copyConfigurations,
        copyResourcePacks,
        copyShaderPacks,
        copyWorlds,
        copyScreenshots,
        copyStatistics
      });
      onClose();
    } catch (err) {
      console.error('Failed to clone instance:', err);
      sounds.playError();
    } finally {
      setIsCloning(false);
    }
  };

  const optionsList = [
    {
      id: 'mods',
      label: 'Copy Mods',
      description: 'Duplicate all installed .jar mods and mod libraries',
      icon: Boxes,
      color: 'text-purple-400',
      checked: copyMods,
      toggle: () => setCopyMods(!copyMods)
    },
    {
      id: 'configs',
      label: 'Copy Configurations',
      description: 'Includes your custom in-game keybinds, options.txt, and mod settings',
      icon: Sliders,
      color: 'text-cyan-400',
      checked: copyConfigurations,
      toggle: () => setCopyConfigurations(!copyConfigurations)
    },
    {
      id: 'resourcepacks',
      label: 'Copy Resource Packs',
      description: 'Keep all textures, sound packs, and visual addons',
      icon: Layers,
      color: 'text-amber-400',
      checked: copyResourcePacks,
      toggle: () => setCopyResourcePacks(!copyResourcePacks)
    },
    {
      id: 'shaderpacks',
      label: 'Copy Shader Packs',
      description: 'Duplicate installed Iris / OptiFine shader presets',
      icon: Sparkles,
      color: 'text-yellow-400',
      checked: copyShaderPacks,
      toggle: () => setCopyShaderPacks(!copyShaderPacks)
    },
    {
      id: 'worlds',
      label: 'Copy Worlds',
      description: 'Duplicate singleplayer saved world dimensions',
      icon: Globe,
      color: 'text-emerald-400',
      checked: copyWorlds,
      toggle: () => setCopyWorlds(!copyWorlds)
    },
    {
      id: 'screenshots',
      label: 'Copy Screenshots',
      description: 'Preserve all in-game photo captures from this instance',
      icon: Camera,
      color: 'text-blue-400',
      checked: copyScreenshots,
      toggle: () => setCopyScreenshots(!copyScreenshots)
    },
    {
      id: 'stats',
      label: 'Copy Statistics',
      description: 'Retain playtime minutes and in-game statistics',
      icon: BarChart3,
      color: 'text-rose-400',
      checked: copyStatistics,
      toggle: () => setCopyStatistics(!copyStatistics)
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-galaxy-900 to-cyan-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-glow-sm">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Clone "{instance.name}"</span>
              </h3>
              <p className="text-xs text-slate-400">
                Create an isolated sandbox to test mods, shaders, and configs safely.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            disabled={isCloning}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
          {/* New Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>New Instance Name:</span>
              <span className="text-[10px] text-purple-300 font-mono">
                MC {instance.version} • {instance.loader.toUpperCase()}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Instance Name..."
                autoFocus
                disabled={isCloning}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.12] text-sm text-white font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-all font-mono"
              />
            </div>
          </div>

          {/* Selective Component Checkboxes */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Select Components to Clone:</span>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  const allOn = copyMods && copyConfigurations && copyResourcePacks && copyShaderPacks && copyWorlds && copyScreenshots;
                  setCopyMods(!allOn);
                  setCopyConfigurations(!allOn);
                  setCopyResourcePacks(!allOn);
                  setCopyShaderPacks(!allOn);
                  setCopyWorlds(!allOn);
                  setCopyScreenshots(!allOn);
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
              >
                Toggle Core
              </button>
            </div>

            <div className="space-y-1.5 bg-galaxy-950/60 p-2.5 rounded-xl border border-white/[0.06]">
              {optionsList.map((opt) => {
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (!isCloning) {
                        sounds.playClick();
                        opt.toggle();
                      }
                    }}
                    className={`p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer select-none ${
                      opt.checked
                        ? 'bg-purple-950/20 border-purple-500/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.04] text-slate-400 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="shrink-0">
                        {opt.checked ? (
                          <CheckSquare className="w-4 h-4 text-purple-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <Icon className={`w-4 h-4 ${opt.color}`} />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{opt.label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight">{opt.description}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              disabled={isCloning}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!name.trim() || isCloning}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer"
            >
              {isCloning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cloning Sandbox...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Clone Instance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
