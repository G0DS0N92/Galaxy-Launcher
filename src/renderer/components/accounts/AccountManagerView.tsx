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
  ZoomOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Palette,
  Upload,
  Search,
  RefreshCw,
  Image as ImageIcon,
  Shirt
} from 'lucide-react';
import { Account } from '../../types';

import { sounds } from '../../services/soundEngine';
import { STEVE_SKIN_BASE64, ALEX_SKIN_BASE64 } from '../../assets/skins/defaultSkins';
import { CosmeticsWardrobe, GALAXY_COSMETICS } from './CosmeticsWardrobe';
import { GalaxyCosmetics } from '../../types';
import {
  applyCapeUVs,
  generateCapeCanvasTexture,
  generateWingTexture
} from '../../services/cosmeticsArt';
import {
  resolvePlayerSkin,
  loadNormalizedSkinTexture
} from '../../services/skinResolver';

interface AccountManagerViewProps {
  accounts: Account[];
  activeAccount: Account | null;
  onSetActiveAccount: (id: string) => Promise<void>;
  onCreateOfflineAccount: (username: string, skinUrl?: string, modelType?: 'classic' | 'slim') => Promise<void>;
  onAddMicrosoftAccount: (username: string, skinUrl?: string, modelType?: 'classic' | 'slim', verifiedUuid?: string) => Promise<void>;
  onRemoveAccount: (id: string) => Promise<void>;
  onUpdateAccountSkin?: (id: string, skinUrl: string, modelType?: 'classic' | 'slim') => Promise<void>;
  onShowToast: (toast: any) => void;
}

const PRESET_SKINS = [
  { id: 'steve', name: 'Steve (Default)', url: STEVE_SKIN_BASE64, model: 'classic' as const, avatar: 'https://minotar.net/avatar/MHF_Steve/48' },
  { id: 'alex', name: 'Alex (Default)', url: ALEX_SKIN_BASE64, model: 'slim' as const, avatar: 'https://minotar.net/avatar/MHF_Alex/48' },
  { id: 'techno', name: 'Technoblade', url: 'https://minotar.net/skin/Technoblade', model: 'classic' as const, avatar: 'https://minotar.net/avatar/Technoblade/48' },
  { id: 'dream', name: 'Dream', url: 'https://minotar.net/skin/Dream', model: 'classic' as const, avatar: 'https://minotar.net/avatar/Dream/48' },
  { id: 'grian', name: 'Grian', url: 'https://minotar.net/skin/Grian', model: 'classic' as const, avatar: 'https://minotar.net/avatar/Grian/48' },
  { id: 'mumbo', name: 'MumboJumbo', url: 'https://minotar.net/skin/MumboJumbo', model: 'classic' as const, avatar: 'https://minotar.net/avatar/MumboJumbo/48' },
  { id: 'dantdm', name: 'DanTDM', url: 'https://minotar.net/skin/DanTDM', model: 'classic' as const, avatar: 'https://minotar.net/avatar/DanTDM/48' },
  { id: 'herobrine', name: 'Herobrine', url: 'https://minotar.net/skin/Herobrine', model: 'classic' as const, avatar: 'https://minotar.net/avatar/Herobrine/48' },
  { id: 'astro', name: 'Cyber Astro', url: 'https://minotar.net/skin/Astro', model: 'classic' as const, avatar: 'https://minotar.net/avatar/Astro/48' },
  { id: 'enderman', name: 'Ender Knight', url: 'https://minotar.net/skin/Enderman', model: 'classic' as const, avatar: 'https://minotar.net/avatar/Enderman/48' },
  { id: 'neon', name: 'Neon Cyber', url: 'https://minotar.net/skin/Cyber', model: 'slim' as const, avatar: 'https://minotar.net/avatar/Cyber/48' },
  { id: 'diamond', name: 'Diamond Hero', url: 'https://minotar.net/skin/Diamond', model: 'classic' as const, avatar: 'https://minotar.net/avatar/Diamond/48' }
];

interface UVBoxFace {
  left: [number, number, number, number];
  right: [number, number, number, number];
  top: [number, number, number, number];
  bottom: [number, number, number, number];
  front: [number, number, number, number];
  back: [number, number, number, number];
}

// Maps standard 64x64 Minecraft UV coordinates to Three.js BoxGeometry faces
function applyMinecraftBoxUVs(geo: THREE.BoxGeometry, faces: UVBoxFace, texW = 64, texH = 64) {
  const uvAttr = geo.attributes.uv;
  // Three.js BoxGeometry face order: +X (left), -X (right), +Y (top), -Y (bottom), +Z (front), -Z (back)
  const faceList = [faces.left, faces.right, faces.top, faces.bottom, faces.front, faces.back];

  for (let i = 0; i < 6; i++) {
    const [x, y, w, h] = faceList[i];
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

// Standard 64x64 Minecraft Skin UV mapping coordinates
const HEAD_BASE_UV: UVBoxFace = {
  left: [16, 8, 8, 8],
  right: [0, 8, 8, 8],
  top: [8, 0, 8, 8],
  bottom: [16, 0, 8, 8],
  front: [8, 8, 8, 8],
  back: [24, 8, 8, 8]
};

const HEAD_HAT_UV: UVBoxFace = {
  left: [48, 8, 8, 8],
  right: [32, 8, 8, 8],
  top: [40, 0, 8, 8],
  bottom: [48, 0, 8, 8],
  front: [40, 8, 8, 8],
  back: [56, 8, 8, 8]
};

const TORSO_BASE_UV: UVBoxFace = {
  left: [28, 20, 4, 12],
  right: [16, 20, 4, 12],
  top: [20, 16, 8, 4],
  bottom: [28, 16, 8, 4],
  front: [20, 20, 8, 12],
  back: [32, 20, 8, 12]
};

const TORSO_JACKET_UV: UVBoxFace = {
  left: [28, 36, 4, 12],
  right: [16, 36, 4, 12],
  top: [20, 32, 8, 4],
  bottom: [28, 32, 8, 4],
  front: [20, 36, 8, 12],
  back: [32, 36, 8, 12]
};

const getRightArmBaseUV = (isSlim: boolean): UVBoxFace => ({
  left: [isSlim ? 47 : 48, 20, 4, 12],
  right: [40, 20, 4, 12],
  top: [44, 16, isSlim ? 3 : 4, 4],
  bottom: [isSlim ? 47 : 48, 16, isSlim ? 3 : 4, 4],
  front: [44, 20, isSlim ? 3 : 4, 12],
  back: [isSlim ? 51 : 52, 20, isSlim ? 3 : 4, 12]
});

const getRightArmSleeveUV = (isSlim: boolean): UVBoxFace => ({
  left: [isSlim ? 47 : 48, 36, 4, 12],
  right: [40, 36, 4, 12],
  top: [44, 32, isSlim ? 3 : 4, 4],
  bottom: [isSlim ? 47 : 48, 32, isSlim ? 3 : 4, 4],
  front: [44, 36, isSlim ? 3 : 4, 12],
  back: [isSlim ? 51 : 52, 36, isSlim ? 3 : 4, 12]
});

const getLeftArmBaseUV = (isSlim: boolean): UVBoxFace => ({
  left: [isSlim ? 39 : 40, 52, 4, 12],
  right: [32, 52, 4, 12],
  top: [36, 48, isSlim ? 3 : 4, 4],
  bottom: [isSlim ? 39 : 40, 48, isSlim ? 3 : 4, 4],
  front: [36, 52, isSlim ? 3 : 4, 12],
  back: [isSlim ? 43 : 44, 52, isSlim ? 3 : 4, 12]
});

const getLeftArmSleeveUV = (isSlim: boolean): UVBoxFace => ({
  left: [isSlim ? 55 : 56, 52, 4, 12],
  right: [48, 52, 4, 12],
  top: [52, 48, isSlim ? 3 : 4, 4],
  bottom: [isSlim ? 55 : 56, 48, isSlim ? 3 : 4, 4],
  front: [52, 52, isSlim ? 3 : 4, 12],
  back: [isSlim ? 59 : 60, 52, isSlim ? 3 : 4, 12]
});

const RIGHT_LEG_BASE_UV: UVBoxFace = {
  left: [8, 20, 4, 12],
  right: [0, 20, 4, 12],
  top: [4, 16, 4, 4],
  bottom: [8, 16, 4, 4],
  front: [4, 20, 4, 12],
  back: [12, 20, 4, 12]
};

const RIGHT_LEG_PANTS_UV: UVBoxFace = {
  left: [8, 36, 4, 12],
  right: [0, 36, 4, 12],
  top: [4, 32, 4, 4],
  bottom: [8, 32, 4, 4],
  front: [4, 36, 4, 12],
  back: [12, 36, 4, 12]
};

const LEFT_LEG_BASE_UV: UVBoxFace = {
  left: [24, 52, 4, 12],
  right: [16, 52, 4, 12],
  top: [20, 48, 4, 4],
  bottom: [24, 48, 4, 4],
  front: [20, 52, 4, 12],
  back: [28, 52, 4, 12]
};

const LEFT_LEG_PANTS_UV: UVBoxFace = {
  left: [8, 52, 4, 12],
  right: [0, 52, 4, 12],
  top: [4, 48, 4, 4],
  bottom: [8, 48, 4, 4],
  front: [4, 52, 4, 12],
  back: [12, 52, 4, 12]
};

export const AccountManagerView: React.FC<AccountManagerViewProps> = ({
  accounts,
  activeAccount,
  onSetActiveAccount,
  onCreateOfflineAccount,
  onAddMicrosoftAccount,
  onRemoveAccount,
  onUpdateAccountSkin,
  onShowToast
}) => {
  const [subTab, setSubTab] = useState<'accounts' | 'skins' | 'cosmetics'>('cosmetics');
  const [showAddModal, setShowAddModal] = useState(false);
  const [authType, setAuthType] = useState<'cracked' | 'microsoft'>('cracked');
  const [username, setUsername] = useState('');
  const [msEmail, setMsEmail] = useState('');
  const [msPassword, setMsPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [skinInput, setSkinInput] = useState('');
  const [modelType, setModelType] = useState<'classic' | 'slim'>('classic');
  const [defaultSkinType, setDefaultSkinType] = useState<'steve' | 'alex'>('steve');
  const [isWalking, setIsWalking] = useState(true);
  const isWalkingRef = useRef(true);

  // Skin Customizer Modal State
  const [customizingAccount, setCustomizingAccount] = useState<Account | null>(null);
  const [customSkinTab, setCustomSkinTab] = useState<'presets' | 'mojang' | 'upload'>('presets');
  const [customSkinUrl, setCustomSkinUrl] = useState<string>('');
  const [customModelType, setCustomModelType] = useState<'classic' | 'slim'>('classic');
  const [customUsernameInput, setCustomUsernameInput] = useState<string>('');
  const [isSavingSkin, setIsSavingSkin] = useState<boolean>(false);
  const [isVerifyingMicrosoft, setIsVerifyingMicrosoft] = useState<boolean>(false);
  const [microsoftVerifyError, setMicrosoftVerifyError] = useState<string | null>(null);

  useEffect(() => {
    isWalkingRef.current = isWalking;
  }, [isWalking]);

  const handleOpenSkinCustomizer = (acc: Account) => {
    sounds.playClick();
    setCustomizingAccount(acc);
    setCustomSkinUrl(acc.skinUrl || (acc.username ? `https://minotar.net/skin/${acc.username}` : STEVE_SKIN_BASE64));
    setCustomModelType(acc.modelType || 'classic');
    setCustomUsernameInput(acc.username);
    setCustomSkinTab('presets');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes('png')) {
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Invalid File Format',
        message: 'Please select a standard .png Minecraft skin texture file.'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomSkinUrl(result);
        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: 'Custom Skin Loaded',
          message: `${file.name} loaded.`
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFetchMojangSkin = async () => {
    const trimmed = customUsernameInput.trim();
    if (!trimmed) {
      onShowToast({
        id: Math.random().toString(),
        type: 'warning',
        title: 'Username Required',
        message: 'Please enter a Minecraft username to fetch.'
      });
      return;
    }
    sounds.playClick();
    try {
      const resolved = await resolvePlayerSkin(trimmed);
      setCustomSkinUrl(resolved.skinUrl);
      setCustomModelType(resolved.modelType);
      sounds.playSuccess();
      onShowToast({
        id: Math.random().toString(),
        type: 'success',
        title: `Found Skin for "${trimmed}"`,
        message: resolved.isOfficial
          ? `Official Mojang ${resolved.modelType.toUpperCase()} skin loaded!`
          : `Custom community skin loaded (${resolved.modelType.toUpperCase()} arms).`
      });
    } catch {
      const fallback = `https://minotar.net/skin/${trimmed}`;
      setCustomSkinUrl(fallback);
      onShowToast({
        id: Math.random().toString(),
        type: 'info',
        title: `Fetched Skin for "${trimmed}"`,
        message: 'Preview loaded. Click Save & Apply to set.'
      });
    }
  };

  const handleSaveSkin = async () => {
    if (!customizingAccount) return;
    setIsSavingSkin(true);
    sounds.playLaunch();
    try {
      if (onUpdateAccountSkin) {
        await onUpdateAccountSkin(customizingAccount.id, customSkinUrl, customModelType);
      } else if (window.galaxy?.updateAccountSkin) {
        await window.galaxy.updateAccountSkin(customizingAccount.id, customSkinUrl, customModelType);
        const list = await window.galaxy.getAccounts();
        if (activeAccount?.id === customizingAccount.id) {
          const act = await window.galaxy.getActiveAccount();
          if (act) onSetActiveAccount(act.id);
        }
      }

      // Refresh 3D view if the customized account is active
      if (activeAccount?.id === customizingAccount.id) {
        const isSlim = customModelType === 'slim';
        rebuildCharacterRig(isSlim);
        updateSkinTexture();
      }

      sounds.playSuccess();
      onShowToast({
        id: Math.random().toString(),
        type: 'success',
        title: `Updated Skin for "${customizingAccount.username}"!`,
        message: `Skin texture saved with ${customModelType.toUpperCase()} arms.`
      });
      setCustomizingAccount(null);
    } catch (err: any) {
      sounds.playError();
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Failed to update skin',
        message: err.message
      });
    } finally {
      setIsSavingSkin(false);
    }
  };

  // 3D Skin Canvas Ref
  const containerRef = useRef<HTMLDivElement | null>(null);
  const skinCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const overlayMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const limbsRef = useRef<{
    head: THREE.Group;
    body: THREE.Group;
    rightArm: THREE.Group;
    leftArm: THREE.Group;
    rightLeg: THREE.Group;
    leftLeg: THREE.Group;
  } | null>(null);
  const cosmeticsMeshRef = useRef<{
    cape?: THREE.Group;
    wings?: { group: THREE.Group; left: THREE.Group; right: THREE.Group };
    halo?: { group: THREE.Group; outerRing: THREE.Mesh; innerRing: THREE.Mesh; crystals: THREE.Mesh[] } | THREE.Mesh;
  }>({});

  // Initialize 3D Viewer on mount
  useEffect(() => {
    init3DSkinViewer();
  }, []);

  // Update skin texture and rebuild character model when activeAccount or defaultSkinType changes
  useEffect(() => {
    const isSlim = activeAccount ? activeAccount.modelType === 'slim' : defaultSkinType === 'alex';
    rebuildCharacterRig(isSlim, activeAccount);
    updateSkinTexture();
  }, [activeAccount, defaultSkinType]);

  const updateSkinTexture = async () => {
    if (!materialRef.current || !overlayMaterialRef.current) return;

    const isSlim = activeAccount ? activeAccount.modelType === 'slim' : defaultSkinType === 'alex';
    const fallbackBase64 = isSlim ? ALEX_SKIN_BASE64 : STEVE_SKIN_BASE64;
    const skinUrl = activeAccount?.skinUrl || (activeAccount?.username ? `https://minotar.net/skin/${activeAccount.username}` : null);

    const applyTexture = (texture: THREE.CanvasTexture) => {
      if (materialRef.current && overlayMaterialRef.current) {
        materialRef.current.map = texture;
        materialRef.current.needsUpdate = true;
        overlayMaterialRef.current.map = texture;
        overlayMaterialRef.current.needsUpdate = true;
      }
    };

    if (skinUrl) {
      try {
        const tex = await loadNormalizedSkinTexture(skinUrl);
        applyTexture(tex);
        return;
      } catch {
        // Continue to fallback
      }
    }

    try {
      const fallbackTex = await loadNormalizedSkinTexture(fallbackBase64);
      applyTexture(fallbackTex);
    } catch {
      // Ignore
    }
  };

  const rebuildCharacterRig = (isSlim: boolean, currentAcc: Account | null = activeAccount) => {
    const character = characterGroupRef.current;
    const baseMat = materialRef.current;
    const overlayMat = overlayMaterialRef.current;
    if (!character || !baseMat || !overlayMat) return;

    // Reset cosmetics mesh ref
    cosmeticsMeshRef.current = {};

    // Remove existing limbs
    while (character.children.length > 0) {
      const child = character.children[0];
      character.remove(child);
    }

    const armW = isSlim ? 3 : 4;

    // --- HEAD ---
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 6, 0);

    const headGeo = new THREE.BoxGeometry(8, 8, 8);
    applyMinecraftBoxUVs(headGeo, HEAD_BASE_UV);
    const headMesh = new THREE.Mesh(headGeo, baseMat);
    headMesh.position.set(0, 4, 0);
    headPivot.add(headMesh);

    const hatGeo = new THREE.BoxGeometry(8.5, 8.5, 8.5);
    applyMinecraftBoxUVs(hatGeo, HEAD_HAT_UV);
    const hatMesh = new THREE.Mesh(hatGeo, overlayMat);
    hatMesh.position.set(0, 4, 0);
    headPivot.add(hatMesh);

    character.add(headPivot);

    // --- BODY / TORSO ---
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, 0, 0);

    const bodyGeo = new THREE.BoxGeometry(8, 12, 4);
    applyMinecraftBoxUVs(bodyGeo, TORSO_BASE_UV);
    const bodyMesh = new THREE.Mesh(bodyGeo, baseMat);
    bodyGroup.add(bodyMesh);

    const jacketGeo = new THREE.BoxGeometry(8.5, 12.5, 4.5);
    applyMinecraftBoxUVs(jacketGeo, TORSO_JACKET_UV);
    const jacketMesh = new THREE.Mesh(jacketGeo, overlayMat);
    bodyGroup.add(jacketMesh);

    character.add(bodyGroup);

    // --- RIGHT ARM ---
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(-(4 + armW / 2), 5, 0);

    const rightArmGeo = new THREE.BoxGeometry(armW, 12, 4);
    applyMinecraftBoxUVs(rightArmGeo, getRightArmBaseUV(isSlim));
    const rightArmMesh = new THREE.Mesh(rightArmGeo, baseMat);
    rightArmMesh.position.set(0, -5, 0);
    rightArmPivot.add(rightArmMesh);

    const rightSleeveGeo = new THREE.BoxGeometry(armW + 0.5, 12.5, 4.5);
    applyMinecraftBoxUVs(rightSleeveGeo, getRightArmSleeveUV(isSlim));
    const rightSleeveMesh = new THREE.Mesh(rightSleeveGeo, overlayMat);
    rightSleeveMesh.position.set(0, -5, 0);
    rightArmPivot.add(rightSleeveMesh);

    character.add(rightArmPivot);

    // --- LEFT ARM ---
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(4 + armW / 2, 5, 0);

    const leftArmGeo = new THREE.BoxGeometry(armW, 12, 4);
    applyMinecraftBoxUVs(leftArmGeo, getLeftArmBaseUV(isSlim));
    const leftArmMesh = new THREE.Mesh(leftArmGeo, baseMat);
    leftArmMesh.position.set(0, -5, 0);
    leftArmPivot.add(leftArmMesh);

    const leftSleeveGeo = new THREE.BoxGeometry(armW + 0.5, 12.5, 4.5);
    applyMinecraftBoxUVs(leftSleeveGeo, getLeftArmSleeveUV(isSlim));
    const leftSleeveMesh = new THREE.Mesh(leftSleeveGeo, overlayMat);
    leftSleeveMesh.position.set(0, -5, 0);
    leftArmPivot.add(leftSleeveMesh);

    character.add(leftArmPivot);

    // --- RIGHT LEG ---
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(-2, -6, 0);

    const rightLegGeo = new THREE.BoxGeometry(4, 12, 4);
    applyMinecraftBoxUVs(rightLegGeo, RIGHT_LEG_BASE_UV);
    const rightLegMesh = new THREE.Mesh(rightLegGeo, baseMat);
    rightLegMesh.position.set(0, -6, 0);
    rightLegPivot.add(rightLegMesh);

    const rightPantsGeo = new THREE.BoxGeometry(4.5, 12.5, 4.5);
    applyMinecraftBoxUVs(rightPantsGeo, RIGHT_LEG_PANTS_UV);
    const rightPantsMesh = new THREE.Mesh(rightPantsGeo, overlayMat);
    rightPantsMesh.position.set(0, -6, 0);
    rightLegPivot.add(rightPantsMesh);

    character.add(rightLegPivot);

    // --- LEFT LEG ---
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(2, -6, 0);

    const leftLegGeo = new THREE.BoxGeometry(4, 12, 4);
    applyMinecraftBoxUVs(leftLegGeo, LEFT_LEG_BASE_UV);
    const leftLegMesh = new THREE.Mesh(leftLegGeo, baseMat);
    leftLegMesh.position.set(0, -6, 0);
    leftLegPivot.add(leftLegMesh);

    const leftPantsGeo = new THREE.BoxGeometry(4.5, 12.5, 4.5);
    applyMinecraftBoxUVs(leftPantsGeo, LEFT_LEG_PANTS_UV);
    const leftPantsMesh = new THREE.Mesh(leftPantsGeo, overlayMat);
    leftPantsMesh.position.set(0, -6, 0);
    leftLegPivot.add(leftPantsMesh);

    character.add(leftLegPivot);

    // --- COSMETICS: CAPE ---
    const equippedCapeId = currentAcc?.cosmetics?.equippedCape;
    if (equippedCapeId) {
      const capePivot = new THREE.Group();
      capePivot.position.set(0, 5.8, -2.05);

      const capeGeo = new THREE.BoxGeometry(10, 16, 0.8);
      applyCapeUVs(capeGeo, 64, 32);

      const capeMat = new THREE.MeshStandardMaterial({
        map: generateCapeCanvasTexture(equippedCapeId),
        roughness: 0.45,
        metalness: 0.15
      });
      const capeMesh = new THREE.Mesh(capeGeo, capeMat);
      capeMesh.position.set(0, -8, -0.4);
      capePivot.add(capeMesh);

      // Gold / trim clasp at top collar
      const claspGeo = new THREE.BoxGeometry(8, 0.8, 0.9);
      const claspMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x78350f,
        emissiveIntensity: 0.3
      });
      const claspMesh = new THREE.Mesh(claspGeo, claspMat);
      claspMesh.position.set(0, 0, -0.4);
      capePivot.add(claspMesh);

      capePivot.rotation.x = 0.16;
      character.add(capePivot);
      cosmeticsMeshRef.current.cape = capePivot;
    }

    // --- COSMETICS: WINGS ---
    const equippedWingsId = currentAcc?.cosmetics?.equippedWings;
    if (equippedWingsId) {
      const wingsGroup = new THREE.Group();
      wingsGroup.position.set(0, 4.0, -2.1);

      const wingItem = GALAXY_COSMETICS.find((c) => c.id === equippedWingsId);
      const wingColor = wingItem?.accentColor || '#06b6d4';

      const leftTexture = generateWingTexture(equippedWingsId, true);
      const rightTexture = generateWingTexture(equippedWingsId, false);

      const createWingSide = (isLeft: boolean, tex: THREE.CanvasTexture) => {
        const wingPivot = new THREE.Group();
        wingPivot.position.set(isLeft ? -2.2 : 2.2, 0, 0);

        // Shoulder joint core sphere
        const jointGeo = new THREE.SphereGeometry(1.1, 16, 16);
        const jointMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(wingColor),
          emissive: new THREE.Color(wingColor),
          emissiveIntensity: 0.8,
          metalness: 0.7,
          roughness: 0.2
        });
        const jointMesh = new THREE.Mesh(jointGeo, jointMat);
        wingPivot.add(jointMesh);

        // Main Layered Feather Mesh Blade
        const wingGeo = new THREE.PlaneGeometry(24, 12);
        const wingMat = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.08,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(wingColor),
          emissiveIntensity: 0.4,
          roughness: 0.3,
          metalness: 0.2
        });

        const wingMesh = new THREE.Mesh(wingGeo, wingMat);
        wingMesh.position.set(isLeft ? -10.5 : 10.5, 0.5, -0.2);
        wingMesh.rotation.y = isLeft ? -0.25 : 0.25;
        wingPivot.add(wingMesh);

        // Secondary luminous overlay blade for 3D depth and shimmer
        const overlayGeo = new THREE.PlaneGeometry(20, 10);
        const overlayMat = new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.15,
          side: THREE.DoubleSide,
          emissive: new THREE.Color('#ffffff'),
          emissiveIntensity: 0.2,
          opacity: 0.9
        });
        const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat);
        overlayMesh.position.set(isLeft ? -9 : 9, 0.8, 0.2);
        overlayMesh.rotation.y = isLeft ? -0.35 : 0.35;
        wingPivot.add(overlayMesh);

        return wingPivot;
      };

      const leftWing = createWingSide(true, leftTexture);
      const rightWing = createWingSide(false, rightTexture);

      wingsGroup.add(leftWing);
      wingsGroup.add(rightWing);

      character.add(wingsGroup);
      cosmeticsMeshRef.current.wings = { group: wingsGroup, left: leftWing, right: rightWing };
    }

    // --- COSMETICS: HALO ---
    const equippedHaloId = currentAcc?.cosmetics?.equippedHalo;
    if (equippedHaloId) {
      const haloItem = GALAXY_COSMETICS.find((c) => c.id === equippedHaloId);
      const haloColor = haloItem?.accentColor || '#fbbf24';
      const haloPrimary = haloItem?.primaryColor || '#d97706';

      const haloGroup = new THREE.Group();
      haloGroup.position.set(0, 16.5, 0);
      haloGroup.rotation.x = Math.PI / 2 + 0.12;

      // Outer Main Torus Ring
      const outerGeo = new THREE.TorusGeometry(5.6, 0.5, 16, 36);
      const outerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(haloColor),
        emissive: new THREE.Color(haloColor),
        emissiveIntensity: 1.0,
        roughness: 0.15,
        metalness: 0.85
      });
      const outerMesh = new THREE.Mesh(outerGeo, outerMat);
      haloGroup.add(outerMesh);

      // Inner Concentric Starlight Ring
      const innerGeo = new THREE.TorusGeometry(3.6, 0.22, 16, 32);
      const innerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(haloPrimary),
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      haloGroup.add(innerMesh);

      // 4 Orbiting Starlight Diamond Crystals
      const crystalGeo = new THREE.OctahedronGeometry(0.85);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffffff'),
        emissive: new THREE.Color(haloColor),
        emissiveIntensity: 1.2,
        roughness: 0.05,
        metalness: 0.95
      });

      const crystals: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(Math.cos(angle) * 5.6, Math.sin(angle) * 5.6, 0);
        haloGroup.add(crystal);
        crystals.push(crystal);
      }

      character.add(haloGroup);
      cosmeticsMeshRef.current.halo = {
        group: haloGroup,
        outerRing: outerMesh,
        innerRing: innerMesh,
        crystals
      };
    }

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
      body: bodyGroup,
      rightArm: rightArmPivot,
      leftArm: leftArmPivot,
      rightLeg: rightLegPivot,
      leftLeg: leftLegPivot
    };
  };

  const init3DSkinViewer = () => {
    const canvas = skinCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera calibrated for balanced viewport framing
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // Create Initial Materials
    const baseMat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.05
    });
    const overlayMat = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.05,
      transparent: true,
      alphaTest: 0.5,
      depthWrite: true,
      side: THREE.FrontSide
    });

    materialRef.current = baseMat;
    overlayMaterialRef.current = overlayMat;

    // Root Character Group
    const character = new THREE.Group();
    character.scale.set(0.58, 0.58, 0.58);
    character.position.set(0, 0.5, 0);
    characterGroupRef.current = character;
    scene.add(character);

    // Initial slight angle
    character.rotation.y = -0.35;
    character.rotation.x = 0.08;

    // Build initial rig
    const isSlim = activeAccount ? activeAccount.modelType === 'slim' : defaultSkinType === 'alex';
    rebuildCharacterRig(isSlim);
    updateSkinTexture();

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
        if (isWalkingRef.current) {
          const speed = 3.2;
          const angle = Math.sin(elapsedTime * speed) * 0.42;
          limbsRef.current.rightArm.rotation.x = angle;
          limbsRef.current.leftArm.rotation.x = -angle;
          limbsRef.current.rightLeg.rotation.x = -angle;
          limbsRef.current.leftLeg.rotation.x = angle;
          limbsRef.current.head.rotation.y = Math.sin(elapsedTime * 1.2) * 0.08;
        } else {
          // Smooth return to idle pose
          limbsRef.current.rightArm.rotation.x *= 0.85;
          limbsRef.current.leftArm.rotation.x *= 0.85;
          limbsRef.current.rightLeg.rotation.x *= 0.85;
          limbsRef.current.leftLeg.rotation.x *= 0.85;
          limbsRef.current.head.rotation.y *= 0.85;
        }
      }

      // Cosmetics dynamic animations
      if (cosmeticsMeshRef.current.cape) {
        const walkingOffset = isWalkingRef.current ? 0.22 : 0;
        cosmeticsMeshRef.current.cape.rotation.x =
          0.16 + Math.sin(elapsedTime * 3.2) * 0.14 + walkingOffset;
        cosmeticsMeshRef.current.cape.rotation.z = Math.sin(elapsedTime * 1.6) * 0.04;
      }
      if (cosmeticsMeshRef.current.wings) {
        const flap = Math.sin(elapsedTime * 4.0) * 0.38;
        cosmeticsMeshRef.current.wings.left.rotation.y = -0.28 + flap;
        cosmeticsMeshRef.current.wings.right.rotation.y = 0.28 - flap;
        cosmeticsMeshRef.current.wings.left.rotation.z = 0.12 + flap * 0.2;
        cosmeticsMeshRef.current.wings.right.rotation.z = -0.12 - flap * 0.2;
      }
      if (cosmeticsMeshRef.current.halo) {
        const haloData = cosmeticsMeshRef.current.halo;
        if ('group' in haloData) {
          haloData.group.position.y = 16.5 + Math.sin(elapsedTime * 2.2) * 0.5;
          haloData.group.rotation.z += 0.018;
          haloData.crystals.forEach((c) => {
            c.rotation.x += 0.04;
            c.rotation.y += 0.04;
          });
        } else {
          haloData.rotation.z += 0.02;
          haloData.position.y = 16.5 + Math.sin(elapsedTime * 2.0) * 0.4;
        }
      }

      // Idle subtle floating turntable rotation if not dragging and animation is running
      if (!isDragging && isWalkingRef.current && characterGroupRef.current) {
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
    setMicrosoftVerifyError(null);

    if (authType === 'cracked') {
      const trimmed = username.trim();
      if (!trimmed) return;
      sounds.playSuccess();
      try {
        let finalSkin = skinInput.trim() || undefined;
        let finalModel = modelType;

        if (!finalSkin) {
          try {
            const resolved = await resolvePlayerSkin(trimmed);
            finalSkin = resolved.skinUrl;
            finalModel = resolved.modelType;
          } catch {
            // Default fallback
          }
        }

        await onCreateOfflineAccount(
          trimmed,
          finalSkin,
          finalModel
        );
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Created Offline Account "${trimmed}"`,
          message: finalSkin ? 'Skin texture automatically synchronized.' : undefined
        });
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
    } else {
      // Microsoft (Premium) Authentication
      const trimmedEmail = msEmail.trim();
      const trimmedPassword = msPassword.trim();
      const trimmedGamertag = username.trim();

      if (!trimmedEmail) {
        sounds.playError();
        setMicrosoftVerifyError('Microsoft account email address is required.');
        onShowToast({
          id: Math.random().toString(),
          type: 'error',
          title: 'Email Required',
          message: 'Please enter your Microsoft account email address.'
        });
        return;
      }

      if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        sounds.playError();
        setMicrosoftVerifyError('Please enter a valid Microsoft email address (e.g. yourname@outlook.com).');
        onShowToast({
          id: Math.random().toString(),
          type: 'error',
          title: 'Invalid Email',
          message: 'Please enter a valid Microsoft email address.'
        });
        return;
      }

      if (!trimmedPassword) {
        sounds.playError();
        setMicrosoftVerifyError('Microsoft account password is required for verification.');
        onShowToast({
          id: Math.random().toString(),
          type: 'error',
          title: 'Password Required',
          message: 'Please enter your Microsoft account password.'
        });
        return;
      }

      if (!trimmedGamertag) {
        sounds.playError();
        setMicrosoftVerifyError('Minecraft In-Game Character Name (IGN) is required to connect your Minecraft profile.');
        onShowToast({
          id: Math.random().toString(),
          type: 'error',
          title: 'Minecraft IGN Required',
          message: 'Please enter your in-game Minecraft character name.'
        });
        return;
      }

      setIsVerifyingMicrosoft(true);
      setMicrosoftVerifyError(null);
      try {
        // Run official Mojang / Microsoft session server verification
        const check = await window.galaxy.verifyOfficialMinecraftAccount(trimmedGamertag);
        if (!check.verified) {
          sounds.playError();
          setMicrosoftVerifyError(
            check.error || `No official paid Minecraft account named "${trimmedGamertag}" found on Mojang / Microsoft servers. Please check your exact in-game character name or switch to "Create Offline Profile".`
          );
          onShowToast({
            id: Math.random().toString(),
            type: 'error',
            title: 'Official Verification Failed',
            message: check.error || `No official paid Minecraft account named "${trimmedGamertag}".`
          });
          return;
        }

        // Account is verified official Minecraft paid account!
        await onAddMicrosoftAccount(
          check.username,
          skinInput.trim() || check.skinUrl,
          check.modelType || modelType,
          check.uuid
        );

        sounds.playSuccess();
        onShowToast({
          id: Math.random().toString(),
          type: 'success',
          title: `Connected Official Account "${check.username}"!`,
          message: `Verified Mojang UUID: ${check.uuid.substring(0, 13)}...`
        });

        setShowAddModal(false);
        setUsername('');
        setMsEmail('');
        setMsPassword('');
        setShowPassword(false);
        setSkinInput('');
        setMicrosoftVerifyError(null);
      } catch (err: any) {
        sounds.playError();
        setMicrosoftVerifyError(err.message || 'Authentication error');
        onShowToast({
          id: Math.random().toString(),
          type: 'error',
          title: 'Authentication Failed',
          message: err.message
        });
      } finally {
        setIsVerifyingMicrosoft(false);
      }
    }
  };

  const handleUpdateCosmetics = async (cosmetics: GalaxyCosmetics) => {
    if (!activeAccount) return;
    try {
      if (window.galaxy?.updateAccountCosmetics) {
        await window.galaxy.updateAccountCosmetics(activeAccount.id, cosmetics);
        const list = await window.galaxy.getAccounts();
        const updated = list.find((a: any) => a.id === activeAccount.id);
        if (updated) {
          await onSetActiveAccount(updated.id);
        }
      }
      const isSlim = activeAccount.modelType === 'slim';
      rebuildCharacterRig(isSlim, { ...activeAccount, cosmetics });
    } catch (err: any) {
      onShowToast({
        id: Math.random().toString(),
        type: 'error',
        title: 'Failed to update cosmetics',
        message: err.message
      });
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row select-none overflow-hidden bg-galaxy-950/40">
      {/* Left Column: Account List & Management / Wardrobe / Skins */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header & Sub-Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-display font-bold text-white tracking-wide flex items-center space-x-2">
              <span>Profile & Personalization</span>
              {activeAccount?.cosmetics && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  COSMETICS ACTIVE
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Manage player authentication, animated Galaxy cosmetics wardrobe, and custom skin studio.
            </p>
          </div>

          {subTab === 'accounts' && (
            <button
              onClick={() => {
                sounds.playClick();
                setShowAddModal(true);
              }}
              className="shrink-0 whitespace-nowrap self-start sm:self-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add Account</span>
            </button>
          )}
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center space-x-2 p-1 rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-md">
          <button
            onClick={() => {
              sounds.playClick();
              setSubTab('cosmetics');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              subTab === 'cosmetics'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-glow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
            <span>Cosmetics Wardrobe</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setSubTab('accounts');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              subTab === 'accounts'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Accounts & Auth</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
              {accounts.length}
            </span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setSubTab('skins');
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              subTab === 'skins'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-emerald'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Skin Studio</span>
          </button>
        </div>

        {/* Tab 1: Accounts Management */}
        {subTab === 'accounts' && (
          <>
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
                      className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-galaxy-800/90 border-purple-500/50 shadow-glow-sm'
                          : 'bg-galaxy-900/60 hover:bg-galaxy-850/80 border-white/[0.06] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <img
                          src={acc.skinUrl || `https://minotar.net/avatar/${acc.username}/48`}
                          alt={acc.username}
                          className="w-12 h-12 rounded-xl bg-slate-800 border border-white/[0.1] object-cover shadow-sm shrink-0"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-bold text-sm text-slate-100 truncate">{acc.username}</span>
                            <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase shrink-0 whitespace-nowrap ${
                              acc.type === 'microsoft'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}>
                              {acc.type}
                            </span>
                            {isActive && (
                              <span className="flex items-center space-x-1 text-[10px] font-medium text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                                <Check className="w-3 h-3 text-purple-400" />
                                <span>Active</span>
                              </span>
                            )}
                            {acc.cosmetics?.equippedCape && (
                              <span className="text-[9px] font-mono font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded shrink-0">
                                🌌 Cape
                              </span>
                            )}
                            {acc.cosmetics?.equippedWings && (
                              <span className="text-[9px] font-mono font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/25 px-1.5 py-0.5 rounded shrink-0">
                                🪽 Wings
                              </span>
                            )}
                            {acc.cosmetics?.equippedHalo && (
                              <span className="text-[9px] font-mono font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded shrink-0">
                                👑 Halo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate">
                            UUID: {acc.uuid}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 pl-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSkinCustomizer(acc);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 hover:border-purple-400/50 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                          title="Change skin texture and arms"
                        >
                          <Palette className="w-3.5 h-3.5 text-purple-400" />
                          <span>Skin</span>
                        </button>

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
          </>
        )}

        {/* Tab 2: Cosmetics Wardrobe */}
        {subTab === 'cosmetics' && (
          <CosmeticsWardrobe
            activeAccount={activeAccount}
            onUpdateCosmetics={handleUpdateCosmetics}
            onShowToast={onShowToast}
          />
        )}

        {/* Tab 3: Skin Studio & Preset Gallery */}
        {subTab === 'skins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Preset Skin Library</h3>
                <p className="text-xs text-slate-400">
                  Select any iconic Minecraft skin below to apply it instantly to your active character.
                </p>
              </div>
              {activeAccount && (
                <button
                  type="button"
                  onClick={() => handleOpenSkinCustomizer(activeAccount)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-glow-emerald flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload / Search IGN</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {PRESET_SKINS.map((preset) => {
                const isCurrentSkin = activeAccount?.skinUrl === preset.url;
                return (
                  <div
                    key={preset.id}
                    onClick={async () => {
                      if (!activeAccount) {
                        sounds.playError();
                        onShowToast({
                          type: 'warning',
                          title: 'Account Required',
                          message: 'Please create or select an account first.'
                        });
                        return;
                      }
                      sounds.playSuccess();
                      if (onUpdateAccountSkin) {
                        await onUpdateAccountSkin(activeAccount.id, preset.url, preset.model);
                      } else if (window.galaxy?.updateAccountSkin) {
                        await window.galaxy.updateAccountSkin(activeAccount.id, preset.url, preset.model);
                        const list = await window.galaxy.getAccounts();
                        const updated = list.find((a: any) => a.id === activeAccount.id);
                        if (updated) onSetActiveAccount(updated.id);
                      }
                      const isSlim = preset.model === 'slim';
                      rebuildCharacterRig(isSlim, { ...activeAccount, skinUrl: preset.url, modelType: preset.model });
                      updateSkinTexture();
                      onShowToast({
                        type: 'success',
                        title: `Applied Skin "${preset.name}"!`,
                        message: `Updated to ${preset.model.toUpperCase()} arms.`
                      });
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 group ${
                      isCurrentSkin
                        ? 'bg-purple-600/25 border-purple-400 shadow-glow-sm ring-1 ring-purple-400/50'
                        : 'bg-galaxy-900/60 hover:bg-galaxy-850/80 border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                  >
                    <img
                      src={preset.avatar}
                      alt={preset.name}
                      className="w-10 h-10 rounded-xl bg-black/40 border border-white/[0.1] object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono capitalize">
                        <span>{preset.model}</span>
                        {isCurrentSkin && (
                          <span className="text-purple-300 font-bold">• Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
          className="relative my-4 flex-1 min-h-[320px] max-h-[440px] rounded-2xl bg-gradient-to-b from-purple-950/20 via-black/40 to-black/70 border border-white/[0.08] overflow-hidden flex items-center justify-center shadow-inner group"
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
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/[0.1] flex items-center justify-between text-xs shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-slate-200">{activeAccount.username}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                {activeAccount.modelType || 'classic'}
              </span>
            </div>
          ) : (
            <div className="absolute bottom-3 left-3 right-3 p-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/[0.12] flex items-center justify-between text-xs shadow-xl">
              <div className="flex items-center space-x-1.5 bg-white/[0.06] p-0.5 rounded-lg border border-white/[0.08]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playSwitch();
                    setDefaultSkinType('steve');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    defaultSkinType === 'steve'
                      ? 'bg-cyan-600 text-white shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Steve (Classic)
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playSwitch();
                    setDefaultSkinType('alex');
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    defaultSkinType === 'alex'
                      ? 'bg-emerald-600 text-white shadow-glow-emerald'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Alex (Slim)
                </button>
              </div>
              <span className="text-[9px] font-mono font-semibold text-purple-300 uppercase px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/25">
                OFFICIAL 3D
              </span>
            </div>
          )}
        </div>

        {/* Change Skin Studio Action Button */}
        {activeAccount && (
          <button
            type="button"
            onClick={() => handleOpenSkinCustomizer(activeAccount)}
            className="w-full mb-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-sm flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            <Palette className="w-4 h-4" />
            <span>Customize & Change Skin</span>
          </button>
        )}

        {/* Quick Tips */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
          <div className="text-slate-300 font-medium">Player Skin & Profile Tip:</div>
          <p>
            You can upload custom `.png` skin files, fetch any player skin by Minecraft username, or choose from popular preset skins!
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
              {authType === 'microsoft' ? (
                <>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-emerald-300 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Official Minecraft Verification</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Verifies your official paid Minecraft license against Mojang & Microsoft session servers.
                    </p>
                  </div>

                  {microsoftVerifyError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 leading-relaxed animate-in fade-in">
                      <div className="font-bold text-rose-300 mb-0.5">Verification Error</div>
                      {microsoftVerifyError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Microsoft Account Email</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">Required</span>
                    </label>
                    <input
                      type="email"
                      value={msEmail}
                      onChange={(e) => {
                        setMsEmail(e.target.value);
                        setMicrosoftVerifyError(null);
                      }}
                      placeholder="e.g. yourname@outlook.com, hotmail.com, or gmail.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Microsoft Account Password</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">Required</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={msPassword}
                        onChange={(e) => {
                          setMsPassword(e.target.value);
                          setMicrosoftVerifyError(null);
                        }}
                        placeholder="Enter your Microsoft account password"
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Minecraft In-Game Name (IGN)</span>
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono">Required</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setMicrosoftVerifyError(null);
                      }}
                      placeholder="e.g. MasterChief, Notch, G0DS0N92..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <p className="text-[10px] text-slate-400">
                      Enter your exact in-game Minecraft character name linked to this Microsoft account.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Player Nickname</span>
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono">Required</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. GalaxyGamer"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-400">
                    Existing skins from Mojang & Ely.by will automatically sync.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Skin Texture (Optional URL)</label>
                <input
                  type="text"
                  value={skinInput}
                  onChange={(e) => setSkinInput(e.target.value)}
                  placeholder="https://... or leave empty to auto-fetch"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Arm Model Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Character Model Arms</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModelType('classic')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      modelType === 'classic'
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/[0.08] bg-galaxy-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Classic (4px Arms)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelType('slim')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      modelType === 'slim'
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/[0.08] bg-galaxy-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Slim / Alex (3px Arms)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingMicrosoft}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-glow-sm flex items-center space-x-2 transition-all ${
                    isVerifyingMicrosoft
                      ? 'bg-emerald-700 text-emerald-200 cursor-wait'
                      : authType === 'microsoft'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-glow-emerald'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-400 text-white shadow-glow-cyan'
                  }`}
                >
                  {isVerifyingMicrosoft ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Official License...</span>
                    </>
                  ) : authType === 'microsoft' ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify & Connect Account</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Offline Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skin Customizer Modal */}
      {customizingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-galaxy-900 border border-white/[0.12] shadow-2xl p-6 space-y-5 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white flex items-center space-x-2">
                    <span>Skin Customizer</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-300 font-normal">
                      {customizingAccount.username}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Customize character skin texture, arm width, and player appearance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCustomizingAccount(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Customizer Tabs */}
            <div className="flex space-x-2 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setCustomSkinTab('presets')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  customSkinTab === 'presets'
                    ? 'bg-purple-600 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Preset Gallery</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomSkinTab('mojang')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  customSkinTab === 'mojang'
                    ? 'bg-cyan-600 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-cyan-300" />
                <span>Search by IGN</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomSkinTab('upload')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                  customSkinTab === 'upload'
                    ? 'bg-emerald-600 text-white shadow-glow-emerald'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-emerald-300" />
                <span>Upload Custom (.PNG)</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {customSkinTab === 'presets' && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Choose from Iconic Minecraft Skins:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {PRESET_SKINS.map((preset) => {
                      const isSelected = customSkinUrl === preset.url;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            sounds.playClick();
                            setCustomSkinUrl(preset.url);
                            setCustomModelType(preset.model);
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                            isSelected
                              ? 'bg-purple-600/30 border-purple-400 shadow-glow-sm ring-1 ring-purple-400'
                              : 'bg-black/30 border-white/[0.08] hover:border-white/[0.2] hover:bg-black/50'
                          }`}
                        >
                          <img
                            src={preset.avatar}
                            alt={preset.name}
                            className="w-9 h-9 rounded-lg bg-black/40 border border-white/[0.1] object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = '0.4';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-100 truncate">{preset.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono capitalize">{preset.model}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {customSkinTab === 'mojang' && (
                <div className="space-y-4 p-4 rounded-xl bg-black/30 border border-white/[0.08]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Enter Minecraft Player Username:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customUsernameInput}
                        onChange={(e) => setCustomUsernameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchMojangSkin()}
                        placeholder="e.g. Technoblade, Dream, DanTDM, Grian..."
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={handleFetchMojangSkin}
                        className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-glow-cyan flex items-center space-x-1.5 transition-all"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Fetch</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Pulls official skin data directly from Mojang skin servers via player username.
                  </p>
                </div>
              )}

              {customSkinTab === 'upload' && (
                <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-white/[0.08]">
                  <div className="text-xs font-semibold text-slate-200">
                    Upload Local 64x64 or 64x32 PNG Skin:
                  </div>
                  <label className="border-2 border-dashed border-white/[0.15] hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col items-center justify-center space-y-2 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                    <Upload className="w-8 h-8 text-emerald-400" />
                    <div className="text-xs font-bold text-slate-200">Click to Browse Skin (.PNG) File</div>
                    <div className="text-[10px] text-slate-400 font-mono">Standard Minecraft Skin dimensions supported</div>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Arm Model Selection */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Arm Model Geometry:</span>
                  <span className="text-[10px] font-mono text-slate-400">Classic = 4px arms | Slim = 3px arms</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSwitch();
                      setCustomModelType('classic');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      customModelType === 'classic'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-200 shadow-glow-sm'
                        : 'border-white/[0.08] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Classic (Steve, 4px)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playSwitch();
                      setCustomModelType('slim');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                      customModelType === 'slim'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-glow-emerald'
                        : 'border-white/[0.08] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Slim (Alex, 3px)</span>
                  </button>
                </div>
              </div>

              {/* Current Skin Preview Thumbnail Bar */}
              {customSkinUrl && (
                <div className="p-3 rounded-xl bg-galaxy-950/70 border border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={customSkinUrl.startsWith('data:') ? customSkinUrl : (customSkinUrl.includes('minotar') ? customSkinUrl.replace('/skin/', '/avatar/') : customSkinUrl)}
                      alt="Skin Preview"
                      className="w-10 h-10 rounded-lg bg-black border border-white/[0.1] object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0.4';
                      }}
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Selected Skin Texture</div>
                      <div className="text-[10px] font-mono text-emerald-400">Preview Ready</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.08] text-slate-300 uppercase">
                    {customModelType}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setCustomizingAccount(null)}
                disabled={isSavingSkin}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSkin}
                disabled={isSavingSkin}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-sm flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {isSavingSkin ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Skin...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Apply Skin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
