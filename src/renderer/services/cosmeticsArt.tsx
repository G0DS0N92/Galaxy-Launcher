import * as THREE from 'three';
import React from 'react';
import { CosmeticItem } from '../components/accounts/CosmeticsWardrobe';

// ============================================================================
// 1. MINECRAFT CAPE UV COORDINATES (Standard 64x32 Cape UV Map)
// ============================================================================
export interface UVBoxFace {
  left: [number, number, number, number];
  right: [number, number, number, number];
  top: [number, number, number, number];
  bottom: [number, number, number, number];
  front: [number, number, number, number];
  back: [number, number, number, number];
}

export const CAPE_UV_MAP: UVBoxFace = {
  left: [0, 1, 1, 16],      // +X
  right: [11, 1, 1, 16],    // -X
  top: [1, 0, 10, 1],       // +Y
  bottom: [11, 0, 10, 1],   // -Y
  front: [1, 1, 10, 16],    // +Z (Touches player back)
  back: [12, 1, 10, 16]     // -Z (Exterior visible back of cape)
};

export function applyCapeUVs(geo: THREE.BoxGeometry, texW = 64, texH = 32) {
  const uvAttr = geo.attributes.uv;
  const faces = [
    CAPE_UV_MAP.left,
    CAPE_UV_MAP.right,
    CAPE_UV_MAP.top,
    CAPE_UV_MAP.bottom,
    CAPE_UV_MAP.front,
    CAPE_UV_MAP.back
  ];

  for (let i = 0; i < 6; i++) {
    const [x, y, w, h] = faces[i];
    const u0 = x / texW;
    const u1 = (x + w) / texW;
    const v1 = 1 - y / texH;
    const v0 = 1 - (y + h) / texH;

    const offset = i * 4;
    uvAttr.setXY(offset + 0, u0, v1);
    uvAttr.setXY(offset + 1, u1, v1);
    uvAttr.setXY(offset + 2, u0, v0);
    uvAttr.setXY(offset + 3, u1, v0);
  }
  uvAttr.needsUpdate = true;
}

// ============================================================================
// 2. HIGH-RES CAPE TEXTURE GENERATOR (64x32 Pixel Art / HD Texture Canvas)
// ============================================================================
export function generateCapeCanvas(capeId: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  // Clear
  ctx.clearRect(0, 0, 64, 32);

  // Helper drawing functions on UV regions
  const drawBackFace = (renderFn: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void) => {
    // Back Face: [12, 1, 10, 16]
    renderFn(ctx, 12, 1, 10, 16);
  };

  const drawFrontFace = (renderFn: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void) => {
    // Front Face: [1, 1, 10, 16]
    renderFn(ctx, 1, 1, 10, 16);
  };

  const drawSides = (primary: string, trim: string) => {
    // Top [1, 0, 10, 1]
    ctx.fillStyle = trim;
    ctx.fillRect(1, 0, 10, 1);
    // Bottom [11, 0, 10, 1]
    ctx.fillStyle = trim;
    ctx.fillRect(11, 0, 10, 1);
    // Left [0, 1, 1, 16]
    ctx.fillStyle = primary;
    ctx.fillRect(0, 1, 1, 16);
    // Right [11, 1, 1, 16]
    ctx.fillStyle = primary;
    ctx.fillRect(11, 1, 1, 16);
  };

  switch (capeId) {
    case 'cape-starlight': {
      // Starlight Nebula: Deep violet cosmic gradient with golden crescent moon and star
      drawSides('#3b0764', '#facc15');
      drawFrontFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#1e0836');
        g.addColorStop(1, '#4c1d95');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#1e0836');
        g.addColorStop(0.5, '#4c1d95');
        g.addColorStop(1, '#06b6d4');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);

        // Stars
        c.fillStyle = '#ffffff';
        c.fillRect(x + 2, y + 2, 1, 1);
        c.fillRect(x + 7, y + 3, 1, 1);
        c.fillRect(x + 1, y + 12, 1, 1);
        c.fillRect(x + 8, y + 13, 1, 1);

        // Crescent Moon (Golden)
        c.fillStyle = '#facc15';
        c.fillRect(x + 4, y + 5, 2, 4);
        c.fillRect(x + 3, y + 6, 1, 2);
        c.fillRect(x + 5, y + 5, 2, 1);
        c.fillRect(x + 5, y + 8, 2, 1);

        // Center Star
        c.fillStyle = '#38bdf8';
        c.fillRect(x + 6, y + 6, 2, 2);
        c.fillStyle = '#ffffff';
        c.fillRect(x + 6, y + 7, 1, 1);
      });
      break;
    }

    case 'cape-deep-void': {
      // Deep Void: Pitch black void with cyan accretion ring
      drawSides('#030712', '#06b6d4');
      drawFrontFace((c, x, y, w, h) => {
        c.fillStyle = '#030712';
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#030712');
        g.addColorStop(0.6, '#082f49');
        g.addColorStop(1, '#06b6d4');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);

        // Singularity Vortex
        c.fillStyle = '#22d3ee';
        c.fillRect(x + 3, y + 6, 4, 4);
        c.fillStyle = '#030712';
        c.fillRect(x + 4, y + 7, 2, 2);
        c.fillStyle = '#38bdf8';
        c.fillRect(x + 2, y + 5, 1, 1);
        c.fillRect(x + 7, y + 10, 1, 1);
        c.fillRect(x + 7, y + 5, 1, 1);
        c.fillRect(x + 2, y + 10, 1, 1);
      });
      break;
    }

    case 'cape-solar-flare': {
      // Solar Flare: Molten crimson to solar gold with radiant sun
      drawSides('#7f1d1d', '#facc15');
      drawFrontFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#7f1d1d');
        g.addColorStop(1, '#b45309');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#7f1d1d');
        g.addColorStop(0.5, '#ea580c');
        g.addColorStop(1, '#facc15');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);

        // Blazing Sun Crest
        c.fillStyle = '#fef08a';
        c.fillRect(x + 4, y + 6, 2, 3);
        c.fillStyle = '#f59e0b';
        c.fillRect(x + 3, y + 7, 4, 1);
        // Sun rays
        c.fillStyle = '#fbbf24';
        c.fillRect(x + 4, y + 4, 2, 1);
        c.fillRect(x + 4, y + 10, 2, 1);
        c.fillRect(x + 2, y + 7, 1, 1);
        c.fillRect(x + 7, y + 7, 1, 1);
      });
      break;
    }

    case 'cape-quantum-matrix': {
      // Quantum Emerald: Matrix cyber green with isometric hypercube
      drawSides('#022c22', '#34d399');
      drawFrontFace((c, x, y, w, h) => {
        c.fillStyle = '#022c22';
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#022c22');
        g.addColorStop(0.5, '#065f46');
        g.addColorStop(1, '#10b981');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);

        // Matrix Data Grid
        c.fillStyle = '#34d399';
        c.fillRect(x + 1, y + 2, 1, 3);
        c.fillRect(x + 8, y + 4, 1, 4);
        c.fillRect(x + 2, y + 11, 1, 3);

        // Cyber Cube
        c.fillStyle = '#6ee7b7';
        c.fillRect(x + 3, y + 6, 4, 3);
        c.fillStyle = '#022c22';
        c.fillRect(x + 4, y + 7, 2, 1);
        c.fillStyle = '#a7f3d0';
        c.fillRect(x + 4, y + 6, 2, 1);
      });
      break;
    }

    case 'cape-end-portal': {
      // End Portal: Ender purple abyss with Eye of Ender
      drawSides('#1e112a', '#10b981');
      drawFrontFace((c, x, y, w, h) => {
        c.fillStyle = '#1e112a';
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#1e112a');
        g.addColorStop(0.7, '#3b0764');
        g.addColorStop(1, '#059669');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);

        // End Stars
        c.fillStyle = '#a855f7';
        c.fillRect(x + 2, y + 3, 1, 1);
        c.fillRect(x + 7, y + 4, 1, 1);
        c.fillRect(x + 8, y + 12, 1, 1);

        // Eye of Ender
        c.fillStyle = '#10b981';
        c.fillRect(x + 3, y + 6, 4, 4);
        c.fillStyle = '#064e3b';
        c.fillRect(x + 4, y + 6, 2, 4); // Slit pupil
        c.fillStyle = '#6ee7b7';
        c.fillRect(x + 3, y + 7, 1, 2);
      });
      break;
    }

    case 'cape-stargazer-prism': {
      // Stargazer Prism: Iridescent chromatic spectrum with diamond prism
      drawSides('#4a044e', '#38bdf8');
      drawFrontFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, '#ec4899');
        g.addColorStop(0.5, '#a855f7');
        g.addColorStop(1, '#38bdf8');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#db2777');
        g.addColorStop(0.33, '#9333ea');
        g.addColorStop(0.66, '#2563eb');
        g.addColorStop(1, '#06b6d4');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);

        // Faceted Prism Diamond
        c.fillStyle = '#ffffff';
        c.fillRect(x + 4, y + 5, 2, 1);
        c.fillRect(x + 3, y + 6, 4, 2);
        c.fillRect(x + 4, y + 8, 2, 2);
        c.fillRect(x + 4, y + 10, 2, 1);

        c.fillStyle = '#fef08a';
        c.fillRect(x + 4, y + 7, 2, 1);
      });
      break;
    }

    case 'cape-galactic-champion': {
      // Galactic Champion: Royal gold with imperial winged crown
      drawSides('#78350f', '#fbbf24');
      drawFrontFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#78350f');
        g.addColorStop(1, '#d97706');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#78350f');
        g.addColorStop(0.5, '#d97706');
        g.addColorStop(1, '#fbbf24');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);

        // Imperial Crown & Wings
        c.fillStyle = '#fef08a';
        c.fillRect(x + 3, y + 5, 1, 2);
        c.fillRect(x + 4, y + 6, 2, 2);
        c.fillRect(x + 6, y + 5, 1, 2);
        c.fillRect(x + 3, y + 8, 4, 2);

        // Gold Laurels
        c.fillStyle = '#ffffff';
        c.fillRect(x + 4, y + 9, 2, 1);
      });
      break;
    }

    case 'cape-cyber-synthwave': {
      // Cyber Synthwave: Magenta sunset with retro wireframe grid
      drawSides('#701a75', '#22d3ee');
      drawFrontFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#c026d3');
        g.addColorStop(1, '#0f172a');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        const g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#d946ef');
        g.addColorStop(0.5, '#7e22ce');
        g.addColorStop(1, '#0f172a');
        c.fillStyle = g;
        c.fillRect(x, y, w, h);

        // Synthwave Sun
        c.fillStyle = '#facc15';
        c.fillRect(x + 3, y + 4, 4, 3);
        c.fillStyle = '#7e22ce';
        c.fillRect(x + 3, y + 6, 4, 1); // Slice line

        // Cyan Grid lines
        c.fillStyle = '#22d3ee';
        c.fillRect(x + 1, y + 10, 8, 1);
        c.fillRect(x + 1, y + 13, 8, 1);
        c.fillRect(x + 3, y + 10, 1, 5);
        c.fillRect(x + 6, y + 10, 1, 5);
      });
      break;
    }

    default: {
      drawSides('#4c1d95', '#a855f7');
      drawFrontFace((c, x, y, w, h) => {
        c.fillStyle = '#1e0836';
        c.fillRect(x, y, w, h);
      });
      drawBackFace((c, x, y, w, h) => {
        c.fillStyle = '#4c1d95';
        c.fillRect(x, y, w, h);
      });
    }
  }

  return canvas;
}

export function generateCapeCanvasTexture(capeId: string): THREE.CanvasTexture {
  const canvas = generateCapeCanvas(capeId);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ============================================================================
// 3. HIGH-RES WING TEXTURE GENERATOR
// ============================================================================
// ============================================================================
// 3. HIGH-RES WING TEXTURE GENERATOR (256x128 Ultra-Quality Art)
// ============================================================================
export function generateWingCanvas(wingId: string, isLeft = true): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 128);

  ctx.save();
  if (!isLeft) {
    ctx.translate(256, 0);
    ctx.scale(-1, 1);
  }

  // Anchor origin is (20, 64) - attached to shoulder joint
  if (wingId === 'wings-void-angel') {
    // Ethereal Archangel Wings: 5 sculpted glowing feather blades with starlight gradient
    const drawFeather = (
      startX: number,
      startY: number,
      tipX: number,
      tipY: number,
      cp1x: number,
      cp1y: number,
      cp2x: number,
      cp2y: number,
      gradColors: [string, string, string]
    ) => {
      const g = ctx.createLinearGradient(startX, startY, tipX, tipY);
      g.addColorStop(0, gradColors[0]);
      g.addColorStop(0.6, gradColors[1]);
      g.addColorStop(1, gradColors[2]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(cp1x, cp1y, tipX - 10, tipY - 8, tipX, tipY);
      ctx.bezierCurveTo(tipX - 15, tipY + 12, cp2x, cp2y, startX, startY + 10);
      ctx.closePath();
      ctx.fill();

      // Feather center spine
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY + 4);
      ctx.quadraticCurveTo((startX + tipX) / 2, (startY + tipY) / 2 - 4, tipX - 2, tipY);
      ctx.stroke();
    };

    // Layer 1: Longest Primary Top Feather Blade
    drawFeather(25, 60, 248, 22, 100, 10, 140, 45, ['#0284c7', '#06b6d4', '#e0f2fe']);
    // Layer 2: Second Primary Feather
    drawFeather(25, 62, 235, 48, 95, 24, 130, 65, ['#0369a1', '#0ea5e9', '#38bdf8']);
    // Layer 3: Third Mid Feather
    drawFeather(25, 64, 205, 78, 85, 42, 120, 88, ['#0284c7', '#06b6d4', '#67e8f9']);
    // Layer 4: Fourth Lower Feather
    drawFeather(25, 66, 165, 102, 70, 60, 100, 105, ['#075985', '#0284c7', '#38bdf8']);
    // Layer 5: Base Covert Plume
    drawFeather(25, 68, 120, 118, 55, 75, 80, 118, ['#0c4a6e', '#0369a1', '#7dd3fc']);

    // Wing Bone Spine
    const spineGrad = ctx.createLinearGradient(20, 64, 180, 20);
    spineGrad.addColorStop(0, '#ffffff');
    spineGrad.addColorStop(0.5, '#7dd3fc');
    spineGrad.addColorStop(1, '#0284c7');
    ctx.strokeStyle = spineGrad;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(20, 64);
    ctx.bezierCurveTo(80, 20, 160, 14, 240, 24);
    ctx.stroke();

    // Glowing Stardust Diamonds
    ctx.fillStyle = '#ffffff';
    [[90, 22], [140, 24], [190, 30], [242, 24], [228, 48], [198, 76]].forEach(([x, y]) => {
      ctx.fillRect(x - 2, y - 2, 4, 4);
    });
  } else if (wingId === 'wings-phoenix') {
    // Blazing Phoenix Fire Wings: Molten crimson to solar flare gold flame blades
    const drawFlameFeather = (
      startX: number,
      startY: number,
      tipX: number,
      tipY: number,
      w: number,
      colors: [string, string, string]
    ) => {
      const g = ctx.createLinearGradient(startX, startY, tipX, tipY);
      g.addColorStop(0, colors[0]);
      g.addColorStop(0.5, colors[1]);
      g.addColorStop(1, colors[2]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(startX + 60, startY - w, tipX - 20, tipY - 10, tipX, tipY);
      ctx.bezierCurveTo(tipX - 10, tipY + 15, startX + 70, startY + w, startX, startY + 8);
      ctx.closePath();
      ctx.fill();

      // Flame core
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX + 10, startY + 3);
      ctx.quadraticCurveTo((startX + tipX) / 2, (startY + tipY) / 2 - 4, tipX - 4, tipY);
      ctx.stroke();
    };

    drawFlameFeather(25, 60, 250, 18, 28, ['#7f1d1d', '#ea580c', '#facc15']);
    drawFlameFeather(25, 62, 238, 46, 24, ['#991b1b', '#f97316', '#fde047']);
    drawFlameFeather(25, 64, 208, 76, 20, ['#b91c1c', '#ea580c', '#facc15']);
    drawFlameFeather(25, 66, 168, 100, 18, ['#c2410c', '#fb923c', '#fef08a']);
    drawFlameFeather(25, 68, 125, 116, 16, ['#9a3412', '#f97316', '#fde047']);

    // Solar Phoenix Spine
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(20, 64);
    ctx.bezierCurveTo(70, 16, 160, 12, 242, 20);
    ctx.stroke();

    // Fiery Embers
    ctx.fillStyle = '#fef08a';
    [[110, 18], [170, 22], [220, 28], [244, 20], [232, 46]].forEach(([x, y]) => {
      ctx.fillRect(x - 2, y - 2, 4, 4);
    });
  } else if (wingId === 'wings-dark-matter') {
    // Abyssal Dark Matter Wings: Bat/Dragon bony talons with void membrane
    ctx.fillStyle = 'rgba(24, 9, 44, 0.9)';
    ctx.beginPath();
    ctx.moveTo(20, 64);
    ctx.bezierCurveTo(60, 10, 140, 8, 235, 15); // Top bone
    ctx.bezierCurveTo(210, 48, 180, 52, 215, 62); // Talon 1
    ctx.bezierCurveTo(185, 78, 150, 82, 175, 96); // Talon 2
    ctx.bezierCurveTo(145, 108, 110, 110, 125, 120); // Talon 3
    ctx.bezierCurveTo(80, 115, 50, 95, 20, 64);
    ctx.closePath();
    ctx.fill();

    // Void Gradient Membrane
    const memGrad = ctx.createLinearGradient(40, 20, 200, 100);
    memGrad.addColorStop(0, '#581c87');
    memGrad.addColorStop(0.5, '#7e22ce');
    memGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = memGrad;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Dark Matter Bone Struts
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 64);
    ctx.bezierCurveTo(70, 14, 150, 10, 235, 15);
    ctx.moveTo(20, 64);
    ctx.lineTo(215, 62);
    ctx.moveTo(20, 64);
    ctx.lineTo(175, 96);
    ctx.moveTo(20, 64);
    ctx.lineTo(125, 120);
    ctx.stroke();

    // Arcane Runes & Talons
    ctx.fillStyle = '#e9d5ff';
    [[235, 15], [215, 62], [175, 96], [125, 120]].forEach(([x, y]) => {
      ctx.fillRect(x - 3, y - 3, 6, 6);
    });
  } else {
    // Cyber Mech Thrusters: Titanium armor panels with cyan thruster exhaust
    // Main Wing Armor Plating
    const mechGrad = ctx.createLinearGradient(20, 64, 240, 40);
    mechGrad.addColorStop(0, '#1e293b');
    mechGrad.addColorStop(0.5, '#334155');
    mechGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = mechGrad;
    ctx.beginPath();
    ctx.moveTo(20, 64);
    ctx.lineTo(90, 20);
    ctx.lineTo(240, 24);
    ctx.lineTo(215, 55);
    ctx.lineTo(175, 85);
    ctx.lineTo(120, 115);
    ctx.closePath();
    ctx.fill();

    // Titanium Panel Edges
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Neon Cyan Energy Thruster Vents
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 56);
    ctx.lineTo(225, 32);
    ctx.moveTo(50, 68);
    ctx.lineTo(200, 60);
    ctx.moveTo(60, 80);
    ctx.lineTo(160, 90);
    ctx.stroke();

    // Jet Energy Flame Exhaust at wing tips
    const jetGrad = ctx.createLinearGradient(210, 30, 255, 30);
    jetGrad.addColorStop(0, '#38bdf8');
    jetGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = jetGrad;
    ctx.fillRect(230, 22, 25, 8);
    ctx.fillRect(205, 52, 25, 7);
  }

  ctx.restore();
  return canvas;
}

export function generateWingTexture(wingId: string, isLeft: boolean): THREE.CanvasTexture {
  const canvas = generateWingCanvas(wingId, isLeft);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ============================================================================
// 4. BEAUTIFUL 2D CARD EMBLEM PREVIEW (For Wardrobe Cards)
// ============================================================================
export const CosmeticPreviewVisual: React.FC<{ item: CosmeticItem; isEquipped: boolean }> = ({ item, isEquipped }) => {
  if (item.type === 'cape') {
    return (
      <div className="w-full h-28 flex items-center justify-center relative py-1">
        {/* Realistic 3D Cape Banner Graphic */}
        <div
          className={`w-20 h-24 rounded-b-xl rounded-t-sm shadow-xl border-2 transition-transform duration-300 group-hover:scale-105 flex flex-col justify-between p-2 relative overflow-hidden bg-gradient-to-b ${item.gradient}`}
          style={{
            borderColor: item.accentColor,
            boxShadow: `0 8px 20px -4px ${item.accentColor}55, inset 0 1px 2px rgba(255,255,255,0.4)`
          }}
        >
          {/* Top Cape Collar Hanger */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-black/40 rounded-b-sm border-b border-white/30" />

          {/* Golden/Cyan Cape Border Stitching */}
          <div className="absolute inset-1 border border-dashed border-white/25 rounded-b-lg pointer-events-none" />

          {/* Top Label */}
          <div className="text-[8px] font-mono font-black text-white/90 uppercase tracking-widest text-center mt-1">
            GALAXY
          </div>

          {/* Central Emblazoned Icon */}
          <div className="flex-1 flex items-center justify-center my-0.5">
            {item.id === 'cape-starlight' && (
              <div className="relative flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z" />
                </svg>
                <div className="absolute w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
              </div>
            )}
            {item.id === 'cape-deep-void' && (
              <div className="w-7 h-7 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_12px_#06b6d4]">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 animate-pulse" />
              </div>
            )}
            {item.id === 'cape-solar-flare' && (
              <div className="w-8 h-8 flex items-center justify-center text-amber-300 drop-shadow-[0_0_10px_#f59e0b]">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
            {item.id === 'cape-quantum-matrix' && (
              <div className="w-7 h-7 border-2 border-emerald-300 rounded-md rotate-45 flex items-center justify-center bg-emerald-950/60 shadow-[0_0_10px_#10b981]">
                <div className="w-3 h-3 bg-emerald-400 rounded-sm -rotate-45" />
              </div>
            )}
            {item.id === 'cape-end-portal' && (
              <div className="w-7 h-7 rounded-full bg-purple-950 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_12px_#a855f7]">
                <div className="w-1.5 h-4 bg-emerald-300 rounded-full" />
              </div>
            )}
            {item.id === 'cape-stargazer-prism' && (
              <div className="w-7 h-7 rotate-45 bg-gradient-to-tr from-pink-400 via-purple-300 to-cyan-300 border border-white shadow-[0_0_12px_#38bdf8] flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full -rotate-45" />
              </div>
            )}
            {item.id === 'cape-galactic-champion' && (
              <div className="flex flex-col items-center text-yellow-300 drop-shadow-[0_0_8px_#fbbf24]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                </svg>
              </div>
            )}
            {item.id === 'cape-cyber-synthwave' && (
              <div className="w-8 h-8 flex flex-col items-center justify-center">
                <div className="w-6 h-3 rounded-t-full bg-yellow-300 border-b-2 border-fuchsia-600 shadow-[0_0_10px_#facc15]" />
                <div className="w-7 h-2 bg-cyan-400/40 border-t border-cyan-300 flex justify-between px-1">
                  <span className="w-0.5 h-full bg-cyan-200" />
                  <span className="w-0.5 h-full bg-cyan-200" />
                  <span className="w-0.5 h-full bg-cyan-200" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Hem */}
          <div className="text-[7px] font-mono text-center text-white/70 tracking-tighter">
            ★ ★ ★
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'wings') {
    return (
      <div className="w-full h-28 flex items-center justify-center relative py-1">
        {/* Sculpted Wing Span Preview */}
        <div className="flex items-center space-x-1 group-hover:scale-110 transition-transform duration-300">
          {/* Left Wing */}
          <svg className="w-16 h-16 drop-shadow-[0_0_12px_currentColor]" style={{ color: item.accentColor }} viewBox="0 0 100 80" fill="currentColor">
            <path d="M90 70 C70 50, 40 40, 10 10 C30 25, 45 40, 50 65 C40 50, 25 38, 15 30 C35 48, 55 60, 75 75 Z" opacity="0.9" />
            <path d="M85 65 C65 45, 45 35, 20 20 C38 35, 55 50, 70 68 Z" fill="#ffffff" opacity="0.6" />
          </svg>
          {/* Central Power Core */}
          <div
            className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-glow-sm z-10 -mx-1"
            style={{ backgroundColor: item.primaryColor }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
          {/* Right Wing (Mirrored) */}
          <svg className="w-16 h-16 transform -scale-x-100 drop-shadow-[0_0_12px_currentColor]" style={{ color: item.accentColor }} viewBox="0 0 100 80" fill="currentColor">
            <path d="M90 70 C70 50, 40 40, 10 10 C30 25, 45 40, 50 65 C40 50, 25 38, 15 30 C35 48, 55 60, 75 75 Z" opacity="0.9" />
            <path d="M85 65 C65 45, 45 35, 20 20 C38 35, 55 50, 70 68 Z" fill="#ffffff" opacity="0.6" />
          </svg>
        </div>
      </div>
    );
  }

  // Halo
  return (
    <div className="w-full h-28 flex items-center justify-center relative py-1">
      <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {/* Floating Ring Torus */}
        <div
          className="w-16 h-8 rounded-[100%] border-4 shadow-xl flex items-center justify-center"
          style={{
            borderColor: item.accentColor,
            backgroundColor: `${item.primaryColor}33`,
            boxShadow: `0 0 20px 4px ${item.accentColor}88, inset 0 0 10px ${item.accentColor}`
          }}
        >
          <div
            className="w-10 h-4 rounded-[100%] border border-dashed border-white/60"
          />
        </div>
        {/* Orbiting Starlight Diamonds */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rotate-45 shadow-[0_0_8px_#ffffff] animate-bounce" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rotate-45 shadow-[0_0_8px_#facc15] animate-bounce" />
      </div>
    </div>
  );
};
