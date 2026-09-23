import React, { useState, useEffect } from 'react';
import { Copy, Sparkles, X } from 'lucide-react';
import { sounds } from '../../services/soundEngine';

export interface PromptModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  onConfirm: (value: string) => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  subtitle,
  label,
  placeholder,
  defaultValue = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon,
  onConfirm,
  onClose,
  isLoading = false
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        sounds.playClick();
        onClose();
      } else if (e.key === 'Enter' && !isLoading && value.trim()) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, value, onConfirm, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return;
    sounds.playSuccess();
    await onConfirm(value.trim());
  };

  const handleClose = () => {
    sounds.playClick();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-galaxy-900 via-galaxy-900 to-galaxy-950 border border-white/[0.12] shadow-2xl shadow-purple-950/50 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-galaxy-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-glow-sm">
              {icon || <Copy className="w-4 h-4 text-cyan-300" />}
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white tracking-wide">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-slate-400 font-mono">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-6 space-y-4">
          {label && (
            <label className="block text-xs font-semibold text-slate-200">
              {label}
            </label>
          )}

          <div className="relative">
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-xl bg-galaxy-950 border border-white/[0.12] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-medium"
            />
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="relative z-10 flex items-center justify-end space-x-3 px-6 py-4 border-t border-white/[0.08] bg-galaxy-950/40">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !value.trim()}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-glow-sm active:scale-95 disabled:opacity-50 transition-all flex items-center space-x-1.5"
          >
            {isLoading ? (
              <span className="inline-block animate-spin mr-1">⏳</span>
            ) : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
