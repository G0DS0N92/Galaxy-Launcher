import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';
import { sounds } from '../../services/soundEngine';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  subtitle,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  icon,
  onConfirm,
  onClose,
  isLoading = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        sounds.playClick();
        onClose();
      } else if (e.key === 'Enter' && !isLoading) {
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onConfirm, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (type === 'danger') {
      sounds.playError();
    } else {
      sounds.playSuccess();
    }
    await onConfirm();
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
      <div
        className={`relative w-full max-w-md rounded-3xl bg-gradient-to-b from-galaxy-900 via-galaxy-900 to-galaxy-950 border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 ${
          type === 'danger'
            ? 'border-rose-500/30 shadow-rose-950/50'
            : 'border-white/[0.12] shadow-purple-950/50'
        }`}
      >
        {/* Glow ambient background effects */}
        {type === 'danger' ? (
          <>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
          </>
        )}

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-galaxy-950/50">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl border flex items-center justify-center shadow-glow-sm ${
                type === 'danger'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {icon ? (
                icon
              ) : type === 'danger' ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
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
          <div className="text-xs text-slate-300 leading-relaxed">
            {description}
          </div>

          {type === 'danger' && (
            <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/25 flex items-start space-x-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-tight">
                This action cannot be undone. Permanent data removal from disk will occur immediately.
              </span>
            </div>
          )}
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
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center space-x-1.5 ${
              type === 'danger'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/40'
                : 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-glow-sm'
            }`}
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
