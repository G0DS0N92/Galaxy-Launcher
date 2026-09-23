import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, X, Star } from 'lucide-react';
import { Achievement, AchievementRarity } from '../../types';
import { sounds } from '../../services/soundEngine';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

const rarityGradients: Record<AchievementRarity, { border: string; bg: string; text: string; glow: string }> = {
  common: {
    border: 'border-cyan-500/40',
    bg: 'bg-gradient-to-r from-cyan-950/90 via-slate-900/90 to-galaxy-950/90',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_25px_rgba(6,182,212,0.35)]'
  },
  uncommon: {
    border: 'border-emerald-500/40',
    bg: 'bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-galaxy-950/90',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]'
  },
  rare: {
    border: 'border-blue-500/50',
    bg: 'bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-galaxy-950/90',
    text: 'text-blue-400',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.45)]'
  },
  epic: {
    border: 'border-purple-500/50',
    bg: 'bg-gradient-to-r from-purple-950/90 via-fuchsia-950/90 to-galaxy-950/90',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_35px_rgba(168,85,247,0.5)]'
  },
  legendary: {
    border: 'border-amber-500/60',
    bg: 'bg-gradient-to-r from-amber-950/90 via-yellow-950/90 to-galaxy-950/90',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.55)]'
  },
  cosmic: {
    border: 'border-fuchsia-400/80 animate-pulse',
    bg: 'bg-gradient-to-r from-indigo-950/95 via-purple-950/95 to-pink-950/95',
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 font-extrabold',
    glow: 'shadow-[0_0_50px_rgba(217,70,239,0.65)]'
  }
};

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      sounds.playSuccess();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 5500);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [achievement]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!achievement) return null;

  const style = rarityGradients[achievement.rarity] || rarityGradients.common;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div
        className={`w-96 rounded-2xl p-4 border backdrop-blur-2xl ${style.border} ${style.bg} ${style.glow} flex items-start space-x-3.5 relative overflow-hidden`}
      >
        {/* Animated Light Sweep Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />

        {/* Achievement Icon / Emoji Container */}
        <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 text-2xl relative shadow-inner">
          <span>{achievement.icon}</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-theme-accent/80 border border-white/20 flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              Achievement Unlocked!
            </span>
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-white/10 bg-black/30 ${style.text}`}>
              {achievement.rarity}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white tracking-wide truncate mt-0.5">
            {achievement.title}
          </h4>

          <p className="text-xs text-slate-300/90 leading-tight mt-1 line-clamp-2">
            {achievement.description}
          </p>

          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10 text-[11px]">
            <span className="text-slate-400 font-mono flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              +{achievement.xp} XP
            </span>
            <span className="text-[10px] text-purple-300 font-medium">Galaxy Chronicle</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
