import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Sparkles,
  X,
  Boxes,
  Layers,
  Cpu,
  ShieldAlert,
  MessageSquare,
  FileCode2,
  CheckCircle2
} from 'lucide-react';
import { Instance, InstanceShareData } from '../../types';
import { sounds } from '../../services/soundEngine';

interface ShareInstanceModalProps {
  instance: Instance;
  onClose: () => void;
  onShowToast: (toast: any) => void;
}

export const ShareInstanceModal: React.FC<ShareInstanceModalProps> = ({
  instance,
  onClose,
  onShowToast
}) => {
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState<InstanceShareData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  useEffect(() => {
    generateCode();
  }, [instance.id]);

  const generateCode = async () => {
    setLoading(true);
    try {
      if (window.galaxy && window.galaxy.generateShareCode) {
        const res = await window.galaxy.generateShareCode(instance.id);
        setShareData(res);
      } else {
        // Fallback generator
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let rand = '';
        for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
        const code = `GLX-${rand}`;
        setShareData({
          code,
          shareString: `${code}:local`,
          instanceName: instance.name,
          version: instance.version,
          loader: instance.loader,
          modsCount: 0,
          payload: {}
        });
      }
    } catch (err: any) {
      console.error('Failed to generate share code:', err);
      onShowToast({
        title: 'Share Code Failed',
        message: err.message || 'Could not generate share code',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!shareData) return;
    navigator.clipboard.writeText(shareData.code);
    sounds.playSuccess();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    onShowToast({
      title: 'Share Code Copied!',
      message: `Code ${shareData.code} copied to clipboard.`,
      type: 'success'
    });
  };

  const handleCopyInvite = () => {
    if (!shareData) return;
    const inviteText = `🎮 Join my Minecraft setup on Galaxy Launcher!\n📦 Instance: ${instance.name}\n⚡ Version: ${instance.version} (${instance.loader.toUpperCase()})\n🧩 Mods: ${shareData.modsCount} installed\n🔗 1-Click Code: ${shareData.code}\n\nPaste this code in Galaxy Launcher -> New Instance -> Import via Share Code!`;
    navigator.clipboard.writeText(inviteText);
    sounds.playSuccess();
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
    onShowToast({
      title: 'Invite Text Copied!',
      message: 'Formatted invite message copied for Discord/Steam/Chat.',
      type: 'success'
    });
  };

  const handleCopyFullString = () => {
    if (!shareData) return;
    navigator.clipboard.writeText(shareData.shareString);
    sounds.playSuccess();
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
    onShowToast({
      title: 'Full Share Payload Copied!',
      message: 'Universal portable instance string copied.',
      type: 'success'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-galaxy-900 border border-white/[0.12] rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10 gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
              <Share2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h3 className="font-display font-bold text-base sm:text-lg text-white tracking-wide whitespace-nowrap">
                  1-Click Instance Share Code
                </h3>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 whitespace-nowrap shrink-0 font-semibold">
                  Instant Clone
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                Share this code with your friends to let them clone this exact instance instantly.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playSwitch();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-5 relative z-10">
          {/* Instance Preview Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{instance.name}</h4>
                <p className="text-xs text-slate-400">
                  Minecraft {instance.version} • {instance.loader.toUpperCase()}
                </p>
              </div>
            </div>
            {shareData && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                {shareData.modsCount} {shareData.modsCount === 1 ? 'Mod' : 'Mods'}
              </span>
            )}
          </div>

          {/* Glowing 6-Character Share Code Box */}
          <div className="text-center p-6 rounded-3xl bg-gradient-to-b from-cyan-950/40 to-galaxy-950 border border-cyan-500/30 shadow-glow-sm relative overflow-hidden group">
            <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Galaxy Share Code
            </div>

            {loading ? (
              <div className="h-14 flex items-center justify-center space-x-2 text-cyan-300">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-mono font-bold">Generating Cosmic Code...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3 my-2">
                <span className="font-mono font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300 tracking-wider select-all">
                  {shareData?.code || 'GLX-XXXX'}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-105 active:scale-95"
                  title="Copy Code"
                >
                  {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-2">
              Friends can enter this code in Galaxy Launcher to clone this instance in seconds.
            </p>
          </div>

          {/* Quick Sharing Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyInvite}
              disabled={loading || !shareData}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 font-bold text-xs tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied Invite!</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>Discord / Chat Invite</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyFullString}
              disabled={loading || !shareData}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-slate-200 font-bold text-xs tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {copiedFull ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied Payload!</span>
                </>
              ) : (
                <>
                  <FileCode2 className="w-4 h-4 text-slate-400" />
                  <span>Full Portable Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="py-2.5 px-6 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold text-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
