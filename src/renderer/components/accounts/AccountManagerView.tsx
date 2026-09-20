import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  User,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  RotateCw,
  Sparkles,
  ExternalLink,
  Layers,
  Wand2,
  Copy,
  CheckCircle2,
  Play,
  Pause,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Account } from '../../types';
import { sounds } from '../../services/soundEngine';

interface AccountManagerViewProps {
  accounts: Account[];
  activeAccount: Account | null;
  onSetActiveAccount: (id: string) => Promise<void>;
  onCreateOfflineAccount: (username: string, skinUrl?: string, modelType?: 'classic' | 'slim') => Promise<void>;
  onRemoveAccount: (id: string) => Promise<void>;
  onShowToast: (toast: any) => void;
}

// Procedural Minecraft Steve skin generator for pixel-art fallback
function createSteveSkinCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Base tan skin
  ctx.fillStyle = '#c68c5d';
  ctx.fillRect(0, 0, 64, 64);

  // --- HEAD ---
  // Hair: Dark brown #4a2f1b
  ctx.fillStyle = '#4a2f1b';
  ctx.fillRect(0, 0, 32, 8); // Top, bottom, sides hair
  ctx.fillRect(8, 8, 8, 2); // Forehead
  ctx.fillRect(0, 8, 8, 8); // Right side hair
  ctx.fillRect(16, 8, 8, 8); // Left side hair
  ctx.fillRect(24, 8, 8, 8); // Back hair

  // Face: Tan skin #db9e70
  ctx.fillStyle = '#db9e70';
  ctx.fillRect(8, 10, 8, 6);
  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(8, 12, 2, 1);
  ctx.fillRect(14, 12, 2, 1);
  // Pupils (blue-purple)
  ctx.fillStyle = '#2b3a8c';
  ctx.fillRect(9, 12, 1, 1);
  ctx.fillRect(14, 12, 1, 1);
  // Nose
  ctx.fillStyle = '#bd7d52';
  ctx.fillRect(11, 13, 2, 1);
  // Mouth / Beard
  ctx.fillStyle = '#5c381e';
  ctx.fillRect(10, 14, 4, 1);
  ctx.fillRect(11, 15, 2, 1);

  // --- TORSO / SHIRT ---
  // Teal shirt #00a8a8
  ctx.fillStyle = '#00a3a3';
  ctx.fillRect(16, 16, 24, 16);
  // Collar cutout
  ctx.fillStyle = '#db9e70';
  ctx.fillRect(22, 20, 4, 2);

  // --- ARMS ---
  // Right Arm (40, 16, 16, 16) - Teal shoulder, skin hand
  ctx.fillStyle = '#00a3a3';
  ctx.fillRect(40, 16, 16, 4);
  ctx.fillStyle = '#db9e70';
  ctx.fillRect(40, 20, 16, 12);

  // Left Arm (32, 48, 16, 16)
  ctx.fillStyle = '#00a3a3';
  ctx.fillRect(32, 48, 16, 4);
  ctx.fillStyle = '#db9e70';
  ctx.fillRect(32, 52, 16, 12);

  // --- LEGS / PANTS ---
  // Right Leg (0, 16, 16, 16) - Blue jeans #263366, dark shoes #3b3b3b
  ctx.fillStyle = '#293a75';
  ctx.fillRect(0, 16, 16, 12);
  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(0, 28, 16, 4);

  // Left Leg (16, 48, 16, 16)
  ctx.fillStyle = '#293a75';
  ctx.fillRect(16, 48, 16, 12);
  ctx.fillStyle = '#3d3d3d';
  ctx.fillRect(16, 60, 16, 4);

  return canvas;
}

// Maps standard 64x64 Minecraft UV coordinates to a Three.js BoxGeometry
function applyBoxUVs(
  geo: THREE.BoxGeometry,
  right: [number, number, number, number],
  left: [number, number, number, number],
  top: [number, number, number, number],
  bottom: [number, number, number, number],
  front: [number, number, number, number],
  back: [number, number, number, number],
  texW = 64,
  texH = 64
) {
  const uvAttr = geo.attributes.uv;
  const faces = [right, left, top, bottom, front, back];

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

export const AccountManagerView: React.FC<AccountManagerViewProps> = ({
  accounts,
  activeAccount,
  onSetActiveAccount,
  onCreateOfflineAccount,
  onRemoveAccount,
  onShowToast
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [authType, setAuthType] = useState<'cracked' | 'microsoft'>('cracked');
  const [username, setUsername] = useState('');
  const [skinInput, setSkinInput] = useState('');
  const [modelType, setModelType] = useState<'classic' | 'slim'>('classic');
  const [isWalking, setIsWalking] = useState(true);

  // 3D Skin Canvas Ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  const skinCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const limbsRef = useRef<{
    head: THREE.Group;
    body: THREE.Mesh;
    rightArm: THREE.Group;
    leftArm: THREE.Group;
    rightLeg: THREE.Group;
    leftLeg: THREE.Group;
  } | null>(null);

  // Initialize 3D Viewer on mount
  useEffect(() => {
    init3DSkinViewer();
  }, []);

  // Update skin texture when activeAccount changes
  useEffect(() => {
    updateSkinTexture();
  }, [activeAccount]);

  const updateSkinTexture = () => {
    if (!materialRef.current) return;

    const skinUrl = activeAccount?.skinUrl || (activeAccount?.username ? `https://minotar.net/skin/${activeAccount.username}` : null);

    if (skinUrl) {
      const loader = new THREE.TextureLoader();
      loader.crossOrigin = 'anonymous';
      loader.load(
        skinUrl,
        (texture) => {
          texture.magFilter = THREE.NearestFilter;
          texture.minFilter = THREE.NearestFilter;
          texture.generateMipmaps = false;
          if (materialRef.current) {
            materialRef.current.map = texture;
            materialRef.current.needsUpdate = true;
          }
        },
        undefined,
        () => {
          // Fallback to procedural Steve
          const steveCanvas = createSteveSkinCanvas();
          const steveTexture = new THREE.CanvasTexture(steveCanvas);
          steveTexture.magFilter = THREE.NearestFilter;
          steveTexture.minFilter = THREE.NearestFilter;
          if (materialRef.current) {
            materialRef.current.map = steveTexture;
            materialRef.current.needsUpdate = true;
          }
        }
      );
    } else {
      const steveCanvas = createSteveSkinCanvas();
      const steveTexture = new THREE.CanvasTexture(steveCanvas);
      steveTexture.magFilter = THREE.NearestFilter;
      steveTexture.minFilter = THREE.NearestFilter;
      if (materialRef.current) {
        materialRef.current.map = steveTexture;
        materialRef.current.needsUpdate = true;
      }
    }
  };

  const init3DSkinViewer = () => {
    const canvas = skinCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera calibrated for comfortable, balanced viewport framing
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 48);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(15, 25, 20);
    scene.add(dirLight);

    const purpleRim = new THREE.PointLight(0xa855f7, 2.5, 60);
    purpleRim.position.set(-15, -10, 15);
    scene.add(purpleRim);

    const cyanRim = new THREE.PointLight(0x06b6d4, 2.0, 60);
    cyanRim.position.set(15, -15, -10);
    scene.add(cyanRim);

    // Create Initial Steve Texture
    const steveCanvas = createSteveSkinCanvas();
    const steveTexture = new THREE.CanvasTexture(steveCanvas);
    steveTexture.magFilter = THREE.NearestFilter;
    steveTexture.minFilter = THREE.NearestFilter;
    steveTexture.generateMipmaps = false;

    const skinMaterial = new THREE.MeshStandardMaterial({
      map: steveTexture,
      roughness: 0.7,
      metalness: 0.05
    });
    materialRef.current = skinMaterial;

    // Root Character Group
    const character = new THREE.Group();
    character.scale.set(0.58, 0.58, 0.58);
    character.position.set(0, 0.5, 0);
    characterGroupRef.current = character;

    // --- HEAD ---
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 6, 0);
    const headGeo = new THREE.BoxGeometry(8, 8, 8);
    applyBoxUVs(
      headGeo,
      [0, 8, 8, 8],   // Right
      [16, 8, 8, 8],  // Left
      [8, 0, 8, 8],   // Top
      [16, 0, 8, 8],  // Bottom
      [8, 8, 8, 8],   // Front
      [24, 8, 8, 8]   // Back
    );
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.position.set(0, 4, 0);
    headPivot.add(headMesh);
    character.add(headPivot);

    // --- BODY / TORSO ---
    const bodyGeo = new THREE.BoxGeometry(8, 12, 4);
    applyBoxUVs(
      bodyGeo,
      [16, 20, 4, 12], // Right
      [28, 20, 4, 12], // Left
      [20, 16, 8, 4],  // Top
      [28, 16, 8, 4],  // Bottom
      [20, 20, 8, 12], // Front
      [32, 20, 8, 12]  // Back
    );
    const bodyMesh = new THREE.Mesh(bodyGeo, skinMaterial);
    bodyMesh.position.set(0, 0, 0);
    character.add(bodyMesh);

    // --- RIGHT ARM (Shoulder Pivot) ---
    const isSlim = activeAccount?.modelType === 'slim';
    const armW = isSlim ? 3 : 4;
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(-(4 + armW / 2), 5, 0);
    const rightArmGeo = new THREE.BoxGeometry(armW, 12, 4);
    applyBoxUVs(
      rightArmGeo,
      [40, 20, 4, 12],
      [48, 20, 4, 12],
      [44, 16, 4, 4],
      [48, 16, 4, 4],
      [44, 20, 4, 12],
      [52, 20, 4, 12]
    );
    const rightArmMesh = new THREE.Mesh(rightArmGeo, skinMaterial);
    rightArmMesh.position.set(0, -5, 0);
    rightArmPivot.add(rightArmMesh);
    character.add(rightArmPivot);

    // --- LEFT ARM (Shoulder Pivot) ---
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(4 + armW / 2, 5, 0);
    const leftArmGeo = new THREE.BoxGeometry(armW, 12, 4);
    applyBoxUVs(
      leftArmGeo,
      [32, 52, 4, 12],
      [40, 52, 4, 12],
      [36, 48, 4, 4],
      [40, 48, 4, 4],
      [36, 52, 4, 12],
      [44, 52, 4, 12]
    );
    const leftArmMesh = new THREE.Mesh(leftArmGeo, skinMaterial);
    leftArmMesh.position.set(0, -5, 0);
    leftArmPivot.add(leftArmMesh);
    character.add(leftArmPivot);

    // --- RIGHT LEG (Hip Pivot) ---
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(-2, -6, 0);
    const rightLegGeo = new THREE.BoxGeometry(4, 12, 4);
    applyBoxUVs(
      rightLegGeo,
      [0, 20, 4, 12],
      [8, 20, 4, 12],
      [4, 16, 4, 4],
      [8, 16, 4, 4],
      [4, 20, 4, 12],
      [12, 20, 4, 12]
    );
    const rightLegMesh = new THREE.Mesh(rightLegGeo, skinMaterial);
    rightLegMesh.position.set(0, -6, 0);
    rightLegPivot.add(rightLegMesh);
    character.add(rightLegPivot);

    // --- LEFT LEG (Hip Pivot) ---
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(2, -6, 0);
    const leftLegGeo = new THREE.BoxGeometry(4, 12, 4);
    applyBoxUVs(
      leftLegGeo,
      [16, 52, 4, 12],
      [24, 52, 4, 12],
      [20, 48, 4, 4],
      [24, 48, 4, 4],
      [20, 52, 4, 12],
      [28, 52, 4, 12]
    );
    const leftLegMesh = new THREE.Mesh(leftLegGeo, skinMaterial);
    leftLegMesh.position.set(0, -6, 0);
    leftLegPivot.add(leftLegMesh);
    character.add(leftLegPivot);

    // --- GROUND SHADOW DISC ---
    const shadowGeo = new THREE.CircleGeometry(7.5, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -12.1, 0);
    character.add(shadowMesh);

    limbsRef.current = {
      head: headPivot,
      body: bodyMesh,
      rightArm: rightArmPivot,
      leftArm: leftArmPivot,
      rightLeg: rightLegPivot,
      leftLeg: leftLegPivot
    };
    scene.add(character);

    // Initial slight angle
    character.rotation.y = -0.35;
    character.rotation.x = 0.08;

    // Handle Window / Container Resizing
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Mouse Drag Rotation & Zoom Controls
    let clock = new THREE.Clock();
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && characterGroupRef.current) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;

        characterGroupRef.current.rotation.y += deltaX * 0.012;
        characterGroupRef.current.rotation.x = Math.max(
          -0.4,
          Math.min(0.4, characterGroupRef.current.rotation.x + deltaY * 0.008)
        );

        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cameraRef.current) {
        cameraRef.current.position.z = Math.max(
          32,
          Math.min(65, cameraRef.current.position.z + e.deltaY * 0.04)
        );
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Walking swing animation
      if (limbsRef.current) {
        if (isWalking) {
          const speed = 3.2;
          const angle = Math.sin(elapsedTime * speed) * 0.42;
          limbsRef.current.rightArm.rotation.x = angle;
          limbsRef.current.leftArm.rotation.x = -angle;
          limbsRef.current.rightLeg.rotation.x = -angle;
          limbsRef.current.leftLeg.rotation.x = angle;
          limbsRef.current.head.rotation.y = Math.sin(elapsedTime * 1.2) * 0.08;
        } else {
          // Smooth return to idle pose
          limbsRef.current.rightArm.rotation.x *= 0.9;
          limbsRef.current.leftArm.rotation.x *= 0.9;
          limbsRef.current.rightLeg.rotation.x *= 0.9;
          limbsRef.current.leftLeg.rotation.x *= 0.9;
          limbsRef.current.head.rotation.y *= 0.9;
        }
      }

      // Idle subtle floating turntable rotation if not dragging
      if (!isDragging && characterGroupRef.current) {
        characterGroupRef.current.rotation.y += 0.003;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  };

  const resetView = () => {
    sounds.playClick();
    if (characterGroupRef.current) {
      characterGroupRef.current.rotation.set(0.08, -0.35, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 48);
    }
  };

  const handleZoom = (delta: number) => {
    sounds.playClick();
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(
        32,
        Math.min(65, cameraRef.current.position.z + delta)
      );
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    sounds.playSuccess();
    try {
      if (authType === 'cracked') {
        await onCreateOfflineAccount(
          username.trim(),
          skinInput.trim() || undefined,
          modelType
        );
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Created Offline Account "${username.trim()}"`
        });
      } else {
        // Microsoft login flow
        onShowToast({
          id: Math.random().toString(),
          type: 'info',
          title: 'Microsoft OAuth',
          message: 'Redirecting to Microsoft authentication flow...'
        });
      }
      setShowAddModal(false);
      setUsername('');
      setSkinInput('');
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Failed to add account',
        message: err.message
      });
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row select-none overflow-hidden bg-galaxy-950/40">
      {/* Left Column: Account List & Management */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">
              Player Authentication & Skins
            </h2>
            <p className="text-xs text-slate-400">
              Manage both Cracked (Offline) and Premium (Microsoft) Minecraft accounts seamlessly.
            </p>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Account Cards / Empty State */}
        {accounts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-galaxy-900/40 border border-white/[0.08] text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="font-bold text-sm text-slate-100">No Minecraft Accounts Connected</h4>
              <p className="text-xs text-slate-400">
                Add an official Microsoft account or create an offline profile to customize your character skin and play Minecraft.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setAuthType('microsoft');
                  setShowAddModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-glow-emerald flex items-center space-x-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Add Microsoft Account</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setAuthType('cracked');
                  setShowAddModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-200 font-semibold text-xs flex items-center space-x-2 transition-all"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span>Create Offline Profile</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((acc) => {
              const isActive = acc.id === activeAccount?.id;
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    sounds.playSwitch();
                    onSetActiveAccount(acc.id);
                  }}
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-galaxy-800/90 border-purple-500/50 shadow-glow-sm'
                      : 'bg-galaxy-900/60 hover:bg-galaxy-850/80 border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={acc.skinUrl || `https://minotar.net/avatar/${acc.username}/48`}
                      alt={acc.username}
                      className="w-12 h-12 rounded-xl bg-slate-800 border border-white/[0.1] object-cover shadow-sm"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-100">{acc.username}</span>
                        <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase ${
                          acc.type === 'microsoft'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {acc.type}
                        </span>
                        {isActive && (
                          <span className="flex items-center space-x-1 text-[10px] font-medium text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 text-purple-400" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        UUID: {acc.uuid}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {accounts.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playClick();
                          onRemoveAccount(acc.id);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: 3D Interactive Skin Studio Viewport */}
      <div className="w-full md:w-96 p-6 border-l border-white/[0.08] bg-galaxy-900/40 backdrop-blur-md flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-white flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>3D Skin Studio</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Drag to rotate</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Real-time 3D character viewport with skeletal animation.
          </p>
        </div>

        {/* Canvas container with calibrated viewport and floating studio controls */}
        <div
          ref={containerRef}
          className="relative my-4 flex-1 min-h-[320px] max-h-[460px] rounded-2xl bg-gradient-to-b from-purple-950/20 via-black/40 to-black/70 border border-white/[0.08] overflow-hidden flex items-center justify-center shadow-inner group"
        >
          <canvas ref={skinCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Quick Studio View Controls */}
          <div className="absolute top-3 right-3 flex items-center space-x-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/[0.08] opacity-80 hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                sounds.playClick();
                setIsWalking(!isWalking);
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors"
              title={isWalking ? 'Pause Walk Animation' : 'Start Walk Animation'}
            >
              {isWalking ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-slate-300" />}
            </button>
            <button
              onClick={() => handleZoom(-5)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(5)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors"
              title="Reset Angle"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Player Card Footer */}
          {activeAccount ? (
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/[0.1] flex items-center justify-between text-xs shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200">{activeAccount.username}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                {activeAccount.modelType || 'classic'}
              </span>
            </div>
          ) : (
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/[0.1] flex items-center justify-between text-xs shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="font-semibold text-slate-300">Steve / Alex (Default)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.1]">
                DEFAULT SKIN
              </span>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
          <div className="text-slate-300 font-medium">Cracked Mode Tip:</div>
          <p>
            Offline accounts use standard Minecraft player UUID hashing algorithms so your singleplayer world inventories are fully preserved!
          </p>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-display font-bold text-white">Add Minecraft Account</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Auth Type Switcher */}
            <div className="flex space-x-2 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setAuthType('cracked')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  authType === 'cracked'
                    ? 'bg-cyan-600 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cracked (Offline)
              </button>
              <button
                type="button"
                onClick={() => setAuthType('microsoft')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  authType === 'microsoft'
                    ? 'bg-emerald-600 text-white shadow-glow-emerald'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Microsoft (Premium)
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              {authType === 'cracked' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Player Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. GalaxyGamer"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Skin Texture (Optional URL)</label>
                    <input
                      type="text"
                      value={skinInput}
                      onChange={(e) => setSkinInput(e.target.value)}
                      placeholder="https://... or leave blank for default"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Model Arms</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModelType('classic')}
                        className={`p-2 rounded-xl border text-xs font-medium ${
                          modelType === 'classic'
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-200'
                            : 'border-white/[0.08] text-slate-400'
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
                            : 'border-white/[0.08] text-slate-400'
                        }`}
                      >
                        Slim (Alex, 3px)
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-2">
                  <div className="font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Official Microsoft OAuth</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Clicking continue will open the Microsoft authentication device code prompt to securely authenticate your official Minecraft license.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold shadow-glow-sm"
                >
                  {authType === 'cracked' ? 'Save Account' : 'Sign in with Microsoft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
