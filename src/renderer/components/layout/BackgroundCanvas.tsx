import React, { useEffect, useRef } from 'react';

interface BackgroundCanvasProps {
  animated?: boolean;
  theme?: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  layer: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
}

export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ animated = true, theme = 'nebula-purple' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const currentThemeRef = useRef(theme);

  useEffect(() => {
    currentThemeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Watch for live data-theme attribute changes on <html>
    const observer = new MutationObserver(() => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'nebula-purple';
      currentThemeRef.current = activeTheme;
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
      if (!animated) {
        render();
      }
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!animated) return;
      mousePos.current.targetX = (e.clientX - width / 2) * 0.05;
      mousePos.current.targetY = (e.clientY - height / 2) * 0.05;
    };

    if (animated) {
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      mousePos.current = { x: 0, y: 0, targetX: 0, targetY: 0 };
    }

    // Initialize Stars
    let stars: Star[] = [];
    const initStars = () => {
      stars = [];
      const numStars = Math.floor((width * height) / 4500);
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.8 + 0.4,
          baseAlpha: Math.random() * 0.7 + 0.2,
          alpha: Math.random() * 0.7 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          layer: Math.random() * 3 + 1
        });
      }
    };

    initStars();

    let shootingStars: ShootingStar[] = [];
    let lastShootingStarTime = Date.now();

    const getThemeColors = (t: string) => {
      switch (t) {
        case 'emerald-aurora':
          return {
            nebulaInner: 'rgba(16, 185, 129, 0.55)',
            nebulaMid: 'rgba(4, 120, 87, 0.8)',
            nebulaOuter: 'rgba(2, 20, 15, 0.98)',
            orbColor: 'rgba(52, 211, 153, 0.35)',
            starGlow: 'rgba(110, 231, 183, 0.5)',
            trailColor: 'rgba(52, 211, 153, '
          };
        case 'supernova-cyan':
          return {
            nebulaInner: 'rgba(6, 182, 212, 0.55)',
            nebulaMid: 'rgba(14, 116, 144, 0.8)',
            nebulaOuter: 'rgba(3, 16, 26, 0.98)',
            orbColor: 'rgba(56, 189, 248, 0.35)',
            starGlow: 'rgba(125, 211, 252, 0.5)',
            trailColor: 'rgba(6, 182, 212, '
          };
        case 'solar-gold':
          return {
            nebulaInner: 'rgba(245, 158, 11, 0.55)',
            nebulaMid: 'rgba(180, 83, 9, 0.8)',
            nebulaOuter: 'rgba(26, 10, 2, 0.98)',
            orbColor: 'rgba(251, 191, 36, 0.35)',
            starGlow: 'rgba(252, 211, 77, 0.5)',
            trailColor: 'rgba(245, 158, 11, '
          };
        case 'crimson-quasar':
          return {
            nebulaInner: 'rgba(225, 29, 72, 0.55)',
            nebulaMid: 'rgba(159, 18, 57, 0.8)',
            nebulaOuter: 'rgba(24, 4, 10, 0.98)',
            orbColor: 'rgba(244, 63, 94, 0.35)',
            starGlow: 'rgba(251, 113, 133, 0.5)',
            trailColor: 'rgba(225, 29, 72, '
          };
        case 'deep-void':
          return {
            nebulaInner: 'rgba(51, 65, 85, 0.55)',
            nebulaMid: 'rgba(15, 23, 42, 0.9)',
            nebulaOuter: 'rgba(2, 4, 12, 0.99)',
            orbColor: 'rgba(99, 102, 241, 0.2)',
            starGlow: 'rgba(148, 163, 184, 0.4)',
            trailColor: 'rgba(203, 213, 225, '
          };
        case 'nebula-purple':
        default:
          return {
            nebulaInner: 'rgba(139, 92, 246, 0.55)',
            nebulaMid: 'rgba(76, 29, 149, 0.8)',
            nebulaOuter: 'rgba(8, 7, 20, 0.98)',
            orbColor: 'rgba(168, 85, 247, 0.35)',
            starGlow: 'rgba(196, 181, 253, 0.5)',
            trailColor: 'rgba(168, 85, 247, '
          };
      }
    };

    let galaxyAngle = 0;

    const render = () => {
      if (!ctx || !canvas) return;

      const colors = getThemeColors(currentThemeRef.current);
      galaxyAngle += 0.0008;

      // Mouse smooth interpolation
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Deep Cosmic Nebula Background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2 + mousePos.current.x * 2,
        height * 0.2 + mousePos.current.y * 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, colors.nebulaInner);
      bgGrad.addColorStop(0.5, colors.nebulaMid);
      bgGrad.addColorStop(1, colors.nebulaOuter);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw secondary glowing cosmic orbs with theme tint
      const orbGrad = ctx.createRadialGradient(
        width * 0.85 + mousePos.current.x,
        height * 0.8 + mousePos.current.y,
        10,
        width * 0.85,
        height * 0.8,
        width * 0.45
      );
      orbGrad.addColorStop(0, colors.orbColor);
      orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw tertiary celestial nebula cluster on the left
      const leftOrbGrad = ctx.createRadialGradient(
        width * 0.15 - mousePos.current.x * 0.5,
        height * 0.35 - mousePos.current.y * 0.5,
        5,
        width * 0.15,
        height * 0.35,
        width * 0.35
      );
      leftOrbGrad.addColorStop(0, colors.orbColor);
      leftOrbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = leftOrbGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Galactic Spiral Stardust Arms in background
      ctx.save();
      ctx.translate(width * 0.5 + mousePos.current.x * 0.8, height * 0.45 + mousePos.current.y * 0.8);
      ctx.rotate(galaxyAngle);
      for (let arm = 0; arm < 2; arm++) {
        const armOffset = arm * Math.PI;
        for (let pt = 10; pt < 70; pt += 6) {
          const dist = pt * 4.5;
          const theta = (pt * 0.12) + armOffset;
          const px = Math.cos(theta) * dist;
          const py = Math.sin(theta) * dist * 0.45; // ellipse perspective
          const dustSize = 1.2 + (Math.sin(pt) * 0.8);
          ctx.beginPath();
          ctx.arc(px, py, dustSize, 0, Math.PI * 2);
          ctx.fillStyle = colors.starGlow;
          ctx.fill();
        }
      }
      ctx.restore();

      // Draw Stars
      for (const s of stars) {
        if (animated) {
          s.alpha += s.twinkleSpeed;
          if (s.alpha > 1 || s.alpha < s.baseAlpha * 0.4) {
            s.twinkleSpeed = -s.twinkleSpeed;
          }
        }

        const parallaxX = s.x - mousePos.current.x * (s.layer * 0.3);
        const parallaxY = s.y - mousePos.current.y * (s.layer * 0.3);

        ctx.beginPath();
        ctx.arc(
          ((parallaxX % width) + width) % width,
          ((parallaxY % height) + height) % height,
          s.size,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(240, 245, 255, ${Math.max(0, Math.min(1, s.alpha))})`;
        ctx.fill();

        // Extra glow on larger stars
        if (s.size > 1.3) {
          ctx.beginPath();
          ctx.arc(
            ((parallaxX % width) + width) % width,
            ((parallaxY % height) + height) % height,
            s.size * 2.2,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = colors.starGlow;
          ctx.fill();
        }
      }

      // Handle Shooting Stars
      if (animated && Date.now() - lastShootingStarTime > 3500 && Math.random() < 0.35) {
        lastShootingStarTime = Date.now();
        shootingStars.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.4,
          length: Math.random() * 80 + 50,
          speed: Math.random() * 10 + 12,
          angle: (Math.PI / 4) + (Math.random() * 0.2 - 0.1),
          opacity: 1,
          life: 0
        });
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.life += 1;
        ss.opacity -= 0.02;

        if (ss.opacity <= 0 || ss.x > width || ss.y > height) {
          shootingStars.splice(i, 1);
          continue;
        }

        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const ssGrad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        ssGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        ssGrad.addColorStop(1, `${colors.trailColor}${ss.opacity})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = ssGrad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (animated) {
        animFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameId);
    };
  }, [animated, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
    />
  );
};
