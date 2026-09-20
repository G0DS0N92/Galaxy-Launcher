import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Sparkles, Zap, FastForward, CheckCircle2 } from 'lucide-react';
import { sounds } from '../../services/soundEngine';

interface GalaxyStartupAnimationProps {
  onComplete: () => void;
  onDisableFuture?: (disabled: boolean) => void;
  soundEnabled?: boolean;
  soundVolume?: number;
}

export const GalaxyStartupAnimation: React.FC<GalaxyStartupAnimationProps> = ({
  onComplete,
  onDisableFuture,
  soundEnabled = true,
  soundVolume = 0.7
}) => {
  const [phase, setPhase] = useState<'igniting' | 'charging' | 'warping' | 'arrival' | 'fading'>('igniting');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Igniting Thrusters...');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const isSkippedRef = useRef(false);

  // Play sound on launch
  useEffect(() => {
    if (soundEnabled) {
      sounds.playWarpDrive();
    }
  }, [soundEnabled]);

  // Main animation timer and phase transitions
  useEffect(() => {
    const startTime = performance.now();
    const totalDuration = 3400; // 3.4 seconds

    const updateTimer = () => {
      if (isSkippedRef.current) return;
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(pct);

      if (elapsed < 800) {
        setPhase('igniting');
        setStatusText('Aligning Cosmic Thrusters...');
      } else if (elapsed < 1800) {
        setPhase('charging');
        setStatusText('Charging Hyperspace Warp Core...');
      } else if (elapsed < 2800) {
        setPhase('warping');
        setStatusText('Entering New Galaxy...');
      } else if (elapsed < 3400) {
        setPhase('arrival');
        setStatusText('Welcome to Galaxy Launcher');
      } else {
        setPhase('fading');
        setTimeout(() => {
          handleFinish();
        }, 350);
        return;
      }

      animFrameRef.current = requestAnimationFrame(updateTimer);
    };

    animFrameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleFinish = () => {
    if (isSkippedRef.current) return;
    isSkippedRef.current = true;
    if (dontShowAgain && onDisableFuture) {
      onDisableFuture(true);
    }
    onComplete();
  };

  const handleSkip = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playSwitch();
    handleFinish();
  };

  // Keyboard shortcut for instant skip (ESC, Space, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dontShowAgain]);

  // Interactive Warp Canvas Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate stars
    const starCount = 350;
    const stars: {
      x: number;
      y: number;
      z: number;
      size: number;
      color: string;
      speed: number;
    }[] = [];

    const colors = ['#818cf8', '#c084fc', '#38bdf8', '#34d399', '#f472b6', '#ffffff'];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 2 + 1
      });
    }

    let loopFrame: number;
    let warpFactor = 1;

    const render = () => {
      // Warp acceleration curve based on progress
      if (progress < 25) {
        warpFactor = 1 + (progress / 25) * 2;
      } else if (progress < 60) {
        warpFactor = 3 + ((progress - 25) / 35) * 8;
      } else if (progress < 85) {
        warpFactor = 11 + ((progress - 60) / 25) * 25; // Hyperspace stretch!
      } else {
        warpFactor = 36 * (1 - (progress - 85) / 15);
      }

      // Space trail motion blur
      ctx.fillStyle = progress > 70 ? 'rgba(5, 4, 15, 0.35)' : 'rgba(3, 2, 10, 0.45)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw celestial vortex glow in center
      const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, width * 0.6);
      if (progress > 60) {
        gradient.addColorStop(0, 'rgba(192, 132, 252, 0.28)');
        gradient.addColorStop(0.3, 'rgba(99, 102, 241, 0.18)');
        gradient.addColorStop(0.7, 'rgba(14, 165, 233, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
        gradient.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render stars & streaks
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.z -= star.speed * warpFactor;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = width;
        }

        const k = 250 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const s = Math.max(0.5, star.size * (1 - star.z / width) * 2.2);

          if (warpFactor > 4) {
            // Star warp streaks
            const prevK = 250 / (star.z + warpFactor * 1.5);
            const oldX = star.x * prevK + cx;
            const oldY = star.y * prevK + cy;

            ctx.beginPath();
            ctx.moveTo(oldX, oldY);
            ctx.lineTo(px, py);
            ctx.strokeStyle = star.color;
            ctx.lineWidth = Math.min(3.5, s * 0.9);
            ctx.stroke();
          } else {
            // Normal twinkling star
            ctx.beginPath();
            ctx.arc(px, py, s, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.shadowBlur = s * 4;
            ctx.shadowColor = star.color;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      loopFrame = requestAnimationFrame(render);
    };

    loopFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(loopFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [progress]);

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 select-none bg-black/95 transition-opacity duration-500 cursor-pointer overflow-hidden ${
        phase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Warp Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Bar: Brand & Quick Skip */}
      <div className="relative z-10 w-full max-w-6xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow-sm">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-xs font-display font-extrabold tracking-wider bg-gradient-to-r from-purple-300 via-cyan-200 to-white bg-clip-text text-transparent">
              GALAXY LAUNCHER
            </div>
            <div className="text-[10px] font-mono text-purple-300/60 uppercase tracking-widest">
              Cosmic Ignition Protocol
            </div>
          </div>
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 hover:border-cyan-400/40 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-2 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-lg group"
        >
          <span>Skip Intro</span>
          <FastForward className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-white/10">
            ESC
          </span>
        </button>
      </div>

      {/* Center Stage: Stylized Rocket Vessel */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 my-auto">
        {/* Hyperspace Energy Rings (Expand during charge) */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Aura */}
          <div
            className={`absolute w-72 h-72 rounded-full border border-purple-500/30 transition-all duration-700 pointer-events-none ${
              phase === 'charging' || phase === 'warping'
                ? 'scale-150 opacity-80 animate-ping'
                : 'scale-100 opacity-30 animate-pulse'
            }`}
          />

          <div
            className={`absolute w-56 h-56 rounded-full border-2 border-dashed border-cyan-400/40 transition-all duration-500 pointer-events-none ${
              phase === 'warping' ? 'rotate-180 scale-125 opacity-90' : 'animate-spin opacity-40'
            }`}
            style={{ animationDuration: phase === 'warping' ? '1.5s' : '8s' }}
          />

          <div
            className={`absolute w-44 h-44 rounded-full bg-gradient-to-tr from-purple-600/30 via-cyan-500/20 to-transparent blur-xl pointer-events-none transition-all duration-500 ${
              phase === 'warping' ? 'scale-150 opacity-100' : 'scale-100 opacity-60'
            }`}
          />

          {/* Rocket Vessel SVG */}
          <div
            className={`relative transition-all duration-700 ease-out flex flex-col items-center ${
              phase === 'igniting'
                ? 'translate-y-2 scale-100'
                : phase === 'charging'
                ? '-translate-y-1 scale-105 animate-bounce'
                : phase === 'warping'
                ? '-translate-y-12 scale-125'
                : '-translate-y-32 scale-150 opacity-0'
            }`}
            style={{
              animationDuration: '0.8s',
              filter:
                phase === 'warping'
                  ? 'drop-shadow(0 0 35px rgba(56, 189, 248, 0.9))'
                  : 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))'
            }}
          >
            <svg
              className="w-32 h-32 md:w-40 md:h-40"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Hull Gradient */}
                <linearGradient id="hullGrad" x1="100" y1="20" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="60%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>

                {/* Wing Gradient */}
                <linearGradient id="wingGrad" x1="50" y1="90" x2="150" y2="150" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                {/* Cockpit Canopy */}
                <linearGradient id="cockpitGrad" x1="100" y1="50" x2="100" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                {/* Plasma Flame Flame */}
                <linearGradient id="plasmaGrad" x1="100" y1="140" x2="100" y2="195" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#38bdf8" />
                  <stop offset="70%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              {/* Left & Right Wing Boosters */}
              <path
                d="M70 100 L45 135 C42 145 50 152 62 148 L75 142 Z"
                fill="url(#wingGrad)"
                stroke="#a855f7"
                strokeWidth="1.5"
              />
              <path
                d="M130 100 L155 135 C158 145 150 152 138 148 L125 142 Z"
                fill="url(#wingGrad)"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />

              {/* Main Fuselage */}
              <path
                d="M100 22 C88 50 74 95 75 140 C75 146 82 150 100 150 C118 150 125 146 125 140 C126 95 112 50 100 22 Z"
                fill="url(#hullGrad)"
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Fuselage Neon Accent Stripes */}
              <path d="M88 85 Q100 88 112 85" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M85 110 Q100 114 115 110" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />

              {/* Glass Cockpit Canopy */}
              <ellipse cx="100" cy="65" rx="11" ry="16" fill="url(#cockpitGrad)" stroke="#e0f2fe" strokeWidth="1.5" />
              <ellipse cx="98" cy="60" rx="4" ry="7" fill="#ffffff" opacity="0.7" />

              {/* Thruster Engine Bell Nozzle */}
              <path d="M86 148 L82 158 H118 L114 148 Z" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Animated Plasma Exhaust Flame */}
              <g
                className="transition-transform duration-200"
                style={{
                  transformOrigin: '100px 155px',
                  transform:
                    phase === 'warping'
                      ? 'scale(1.5, 2.2)'
                      : phase === 'charging'
                      ? 'scale(1.2, 1.4)'
                      : 'scale(1, 1)'
                }}
              >
                {/* Outer Flame */}
                <path
                  d="M84 158 Q100 205 100 215 Q100 205 116 158 Z"
                  fill="url(#plasmaGrad)"
                  opacity="0.9"
                  className="animate-pulse"
                />
                {/* Core White Flame */}
                <path
                  d="M92 158 Q100 185 100 190 Q100 185 108 158 Z"
                  fill="#ffffff"
                  opacity="0.95"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Title & Status HUD */}
        <div className="mt-8 flex flex-col items-center text-center space-y-3 max-w-md">
          <div className="flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
              {statusText}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white drop-shadow-md">
            Warping Into The Universe
          </h2>

          <p className="text-xs text-slate-400 font-medium">
            Preparing game instances, high-speed modloaders, and cosmic visuals...
          </p>

          {/* Glowing Progress Bar */}
          <div className="w-64 md:w-80 h-2 bg-slate-900/90 rounded-full border border-white/10 p-0.5 overflow-hidden shadow-glow-sm">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 transition-all duration-150 ease-out shadow-glow-md"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-2">
            <span>WARP CORE: {progress}%</span>
            <span>•</span>
            <span>HYPERDRIVE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Don't Show Again Quick Toggle & Hint */}
      <div
        className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl pt-4 border-t border-white/[0.08] gap-3 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="flex items-center space-x-2 cursor-pointer group select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-900 border-white/20 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-500"
          />
          <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
            Don't show this intro on startup (can be re-enabled in Settings)
          </span>
        </label>

        <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
          <span>Click anywhere or press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-slate-300 font-mono text-[10px]">
            Space
          </kbd>
          <span>to enter instantly</span>
        </div>
      </div>
    </div>
  );
};
