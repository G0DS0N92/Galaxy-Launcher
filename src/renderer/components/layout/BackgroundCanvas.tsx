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

export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({ animated = true, theme = 'deep-void' }) => {
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

    const observer = new MutationObserver(() => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'deep-void';
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
      mousePos.current.targetX = (e.clientX - width / 2) * 0.04;
      mousePos.current.targetY = (e.clientY - height / 2) * 0.04;
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
      const numStars = Math.floor((width * height) / 3800);
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2.0 + 0.5,
          baseAlpha: Math.random() * 0.7 + 0.3,
          alpha: Math.random() * 0.7 + 0.3,
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
            nebulaInner: 'rgba(16, 185, 129, 0.45)',
            nebulaMid: 'rgba(4, 120, 87, 0.75)',
            nebulaOuter: 'rgba(3, 10, 15, 0.99)',
            orbColor: 'rgba(52, 211, 153, 0.35)',
            starGlow: 'rgba(110, 231, 183, 0.6)',
            trailColor: 'rgba(52, 211, 153, '
          };
        case 'supernova-cyan':
          return {
            nebulaInner: 'rgba(6, 182, 212, 0.45)',
            nebulaMid: 'rgba(14, 116, 144, 0.75)',
            nebulaOuter: 'rgba(4, 10, 24, 0.99)',
            orbColor: 'rgba(56, 189, 248, 0.35)',
            starGlow: 'rgba(125, 211, 252, 0.6)',
            trailColor: 'rgba(6, 182, 212, '
          };
        case 'solar-gold':
          return {
            nebulaInner: 'rgba(245, 158, 11, 0.45)',
            nebulaMid: 'rgba(180, 83, 9, 0.75)',
            nebulaOuter: 'rgba(16, 6, 2, 0.99)',
            orbColor: 'rgba(251, 191, 36, 0.35)',
            starGlow: 'rgba(252, 211, 77, 0.6)',
            trailColor: 'rgba(245, 158, 11, '
          };
        case 'crimson-quasar':
          return {
            nebulaInner: 'rgba(225, 29, 72, 0.45)',
            nebulaMid: 'rgba(159, 18, 57, 0.75)',
            nebulaOuter: 'rgba(14, 2, 8, 0.99)',
            orbColor: 'rgba(244, 63, 94, 0.35)',
            starGlow: 'rgba(251, 113, 133, 0.6)',
            trailColor: 'rgba(225, 29, 72, '
          };
        case 'deep-void':
        default:
          return {
            nebulaInner: 'rgba(67, 56, 202, 0.45)', // Rich deep indigo/violet
            nebulaMid: 'rgba(17, 24, 58, 0.85)',
            nebulaOuter: 'rgba(5, 7, 18, 0.99)',
            orbColor: 'rgba(124, 58, 237, 0.35)', // Purple nebula glow
            starGlow: 'rgba(165, 180, 252, 0.6)',
            trailColor: 'rgba(147, 51, 234, '
          };
      }
    };

    let galaxyAngle = 0;

    const render = () => {
      if (!ctx || !canvas) return;

      const colors = getThemeColors(currentThemeRef.current);
      galaxyAngle += 0.0006;

      // Mouse smooth interpolation
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Deep Cosmic Nebula Background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2 + mousePos.current.x * 2,
        height * 0.25 + mousePos.current.y * 2,
        60,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, colors.nebulaInner);
      bgGrad.addColorStop(0.5, colors.nebulaMid);
      bgGrad.addColorStop(1, colors.nebulaOuter);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw glowing cosmic orbs with purple/blue tint
      const orbGrad = ctx.createRadialGradient(
        width * 0.85 + mousePos.current.x,
        height * 0.75 + mousePos.current.y,
        15,
        width * 0.85,
        height * 0.75,
        width * 0.45
      );
      orbGrad.addColorStop(0, colors.orbColor);
      orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, width, height);

      // Left celestial nebula cluster
      const leftOrbGrad = ctx.createRadialGradient(
        width * 0.15 - mousePos.current.x * 0.5,
        height * 0.35 - mousePos.current.y * 0.5,
        10,
        width * 0.15,
        height * 0.35,
        width * 0.35
      );
      leftOrbGrad.addColorStop(0, colors.orbColor);
      leftOrbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = leftOrbGrad;
      ctx.fillRect(0, 0, width, height);

      // Galactic Spiral Stardust Arms
      ctx.save();
      ctx.translate(width * 0.5 + mousePos.current.x * 0.8, height * 0.45 + mousePos.current.y * 0.8);
      ctx.rotate(galaxyAngle);
      for (let arm = 0; arm < 2; arm++) {
        const armOffset = arm * Math.PI;
        for (let pt = 10; pt < 70; pt += 5) {
          const dist = pt * 4.8;
          const theta = pt * 0.12 + armOffset;
          const px = Math.cos(theta) * dist;
          const py = Math.sin(theta) * dist * 0.45;
          const dustSize = 1.2 + Math.sin(pt) * 0.8;
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
          if (s.alpha > 1 || s.alpha < s.baseAlpha * 0.3) {
            s.twinkleSpeed = -s.twinkleSpeed;
          }
        }

        const parallaxX = s.x - mousePos.current.x * (s.layer * 0.3);
        const parallaxY = s.y - mousePos.current.y * (s.layer * 0.3);

        ctx.beginPath();
        ctx.arc(parallaxX, parallaxY, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, s.alpha))})`;
        ctx.fill();
      }

      // Draw Shooting Stars
      if (animated) {
        const now = Date.now();
        if (now - lastShootingStarTime > 4000 && Math.random() < 0.03 && shootingStars.length < 2) {
          shootingStars.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.5),
            length: Math.random() * 80 + 40,
            speed: Math.random() * 10 + 12,
            angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
            opacity: 1,
            life: 1
          });
          lastShootingStarTime = now;
        }

        for (let i = shootingStars.length - 1; i >= 0; i--) {
          const ss = shootingStars[i];
          ss.x += Math.cos(ss.angle) * ss.speed;
          ss.y += Math.sin(ss.angle) * ss.speed;
          ss.life -= 0.02;

          if (ss.life <= 0 || ss.x > width + 100 || ss.y > height + 100) {
            shootingStars.splice(i, 1);
            continue;
          }

          const tailX = ss.x - Math.cos(ss.angle) * ss.length;
          const tailY = ss.y - Math.sin(ss.angle) * ss.length;

          const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
          grad.addColorStop(0, `rgba(255, 255, 255, ${ss.life})`);
          grad.addColorStop(0.3, `${colors.trailColor}${ss.life * 0.8})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(tailX, tailY);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      if (animated) {
        animFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [animated]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
