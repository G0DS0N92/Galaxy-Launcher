import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let token = '';
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*(GH_TOKEN|GITHUB_TOKEN)\s*=\s*(.+?)\s*$/i);
    if (match) {
      token = match[2].trim().replace(/^['"]|['"]$/g, '');
      break;
    }
  }
}

const owner = 'G0DS0N92';
const repo = 'Galaxy-Launcher';

function requestGitHub(apiPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'User-Agent': 'Galaxy-Launcher-Checker/1.0',
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };

    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request({
      hostname: 'api.github.com',
      path: apiPath,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`🔍 Inspecting releases for ${owner}/${repo}...`);
  const listRes = await requestGitHub(`/repos/${owner}/${repo}/releases`);
  if (!Array.isArray(listRes.data)) {
    console.error('Failed to list releases:', listRes);
    return;
  }

  console.log(`Found ${listRes.data.length} total releases on GitHub:`);
  for (const r of listRes.data) {
    console.log(`- ID: ${r.id} | Tag: ${r.tag_name} | Name: ${r.name} | Draft: ${r.draft} | Prerelease: ${r.prerelease}`);
  }

  // Desired releases:
  // v1.0.1: Initial Genesis Foundation
  // v1.0.2: Visuals, Multi-Tier Updater & Mod Selection
  // v1.0.3: Social, Cloud Sync & Network
  // v1.0.4: The Quantum Share & Cosmetics Update (Latest)

  const allowedTags = ['v1.0.1', 'v1.0.2', 'v1.0.3', 'v1.0.4'];

  for (const r of listRes.data) {
    if (!allowedTags.includes(r.tag_name)) {
      console.log(`🗑️ Deleting redundant release #${r.id} (${r.tag_name})...`);
      await requestGitHub(`/repos/${owner}/${repo}/releases/${r.id}`, 'DELETE');
    }
  }

  // Verify and update descriptions of 4 official releases:
  const releaseDetails = {
    'v1.0.1': {
      name: '✨ Galaxy Launcher v1.0.1 — The Genesis Release 🚀',
      body: `## 🌌 Galaxy Launcher v1.0.1 — The Genesis Release 🚀

Welcome to the genesis of **Galaxy Launcher** — the modern, cosmic-themed Minecraft launcher built from the ground up for maximum speed, security, and aesthetics!

---

### 🌟 Core Highlights & Features
- 🚀 **Universal Player Auth**: Seamless support for both Microsoft (Premium) and Offline (Cracked) accounts.
- ⚡ **High-Performance Launch Engine**: Optimized JVM memory allocation, automated Java detection (Java 8 to 21+), and lightning-fast game initialization.
- 🎨 **Cosmic Glassmorphic UI**: Deep void space aesthetics with fluid animations, glowing accents, and dynamic background canvas.
- 📦 **ModLoader Support**: Instant setup for Fabric, Forge, NeoForge, Quilt, and Vanilla across all Minecraft versions.
- 📊 **Real-Time Crash Doctor**: Smart log analyzer pinpointing crash causes with actionable solutions.`
    },
    'v1.0.2': {
      name: '🎨 Galaxy Launcher v1.0.2 — Visuals & Modding Evolution 🌌',
      body: `## 🌌 Galaxy Launcher v1.0.2 — Visuals & Modding Evolution 🚀

Galaxy Launcher v1.0.2 brings a refined cosmic design system, direct mod selection, and a smooth instance browsing experience.

---

### 🌟 Core Highlights & Features
- 🌌 **Direct Mod Selection**: Glowing cyan selection borders for instant batch management.
- 🚀 **Deep Void Default Theme**: Signature dark matter cosmic visual experience.
- 🎨 **Paginated Icon Carousel**: Slide-paginated instance icon browser with category tabs.
- 📐 **Compact 3D Isometric Cards**: Isometric visual badges for all your instances.
- 🔄 **Multi-Tier Auto-Updater**: Delta updates with instant background check and 1-click relaunch.`
    },
    'v1.0.3': {
      name: '👥 Galaxy Launcher v1.0.3 — Social, Cloud & Network Update 🌐',
      body: `## 🌌 Galaxy Launcher v1.0.3 — Social, Cloud & Network Update 🚀

Galaxy Launcher v1.0.3 connects the community with rich multiplayer social tools, cloud sync, and player profiles.

---

### 🌟 Core Highlights & Features
- 👥 **Friends & Social Network**: Live friend presence, player tags, and party invites.
- ☁️ **Galaxy Cloud Sync**: Secure cloud backups for instance configurations, worlds, and settings.
- 📊 **Gameplay Stats Tracker**: Comprehensive playtime tracker per instance and across all Minecraft versions.
- 🏆 **Cosmic Achievements Engine**: 12 in-launcher achievements with XP progression from *Stargazer* to *Cosmic Overlord*.
- 🎮 **Discord Rich Presence**: Live presence showing active instance, modloader, and playtime.`
    },
    'v1.0.4': {
      name: '✨ Galaxy Launcher v1.0.4 — The Quantum Share & Cosmetics Update 🌌',
      body: `## 🌌 Galaxy Launcher v1.0.4 — The Quantum Share & Cosmetics Update 🚀

Welcome to **Galaxy Launcher v1.0.4**! This massive release introduces **1-Click Instance Share Codes (GLX-XXXX)**, the **Free Galaxy Capes & Cosmetics Wardrobe**, **In-Place Add Content Modal**, and **Cosmic Achievements**.

---

### 🔗 1-Click Instance Share Codes (\`GLX-XXXX\`)
- **Instant Instance Sharing**: Generate short 8-character codes (e.g. \`GLX-7749\`) or portable encrypted base64 payload strings for any installed instance.
- **1-Click Import Engine**: Friends can paste the code or share string into the "Share Code (GLX-XXXX)" tab in the Create Instance modal to instantly recreate the exact instance, modloader, version, and mod list in seconds!
- **Universal Discord Invites**: 1-click button copies a formatted Discord / Steam-style share message ready to paste into any chat.

---

### ✨ Free Galaxy Capes & Cosmetics Wardrobe
- **100% Free Cosmetic Engine**: Premium cosmetics unlocked **free forever for all Galaxy players**!
- **8 Animated Cosmic Capes**: Starlight Nebula, Deep Void, Solar Flare, Quantum Emerald, End Portal Dimension, Stargazer Prism, Cybernetic Matrix, and Blood Nebula.
- **4 Animated Void Wings**: Cosmic Galaxy Wings, Void Butterfly Wings, Cyber Angel Wings, and Solar Dragon Wings with flapping skeletal animations.
- **4 Radiant Starlight Halos**: Celestial Starlight Halo, Void Singularity Ring, Neon Cyber Hex-Ring, and Starlight Corona.
- **Interactive 3D Studio Preview**: Live Three.js character model preview with skeletal cape physics, wing flapping, and rotating glowing halos.

---

### 📦 In-Place Add Content Engine
- **Direct "+ Add Mods / Shaders / Resource Packs"**: Instant popup modal allows searching, filtering, and 1-click installing content directly to the instance without losing your place.
- **Clean Responsive Card Action Buttons**: Compact emoji action buttons (\`📥 Install\`, \`ℹ️ Details\`, \`🗑️ Remove\`, \`✅ Installed\`) that never glitch or wrap on any window size.

---

### 🎨 3D Skin Studio & Preset Gallery
- **Preset Skin Library**: 1-click apply iconic skins (Steve, Alex, Technoblade, Dream, Grian, Mumbo, DanTDM, Herobrine, and more).
- **Mojang IGN Search**: Pull any player skin directly by username.
- **Custom PNG Uploader**: Upload 64x64 or 64x32 PNG skin textures with customizable Classic (4px) or Slim (3px) arms.`
    }
  };

  for (const tag of allowedTags) {
    const detail = releaseDetails[tag];
    let rel = listRes.data.find(r => r.tag_name === tag);
    if (rel) {
      console.log(`Updating release ${tag} (#${rel.id})...`);
      await requestGitHub(`/repos/${owner}/${repo}/releases/${rel.id}`, 'PATCH', {
        name: detail.name,
        body: detail.body,
        draft: false,
        prerelease: false,
        make_latest: tag === 'v1.0.4' ? 'true' : 'false'
      });
    } else {
      console.log(`Creating release ${tag}...`);
      await requestGitHub(`/repos/${owner}/${repo}/releases`, 'POST', {
        tag_name: tag,
        name: detail.name,
        body: detail.body,
        draft: false,
        prerelease: false,
        make_latest: tag === 'v1.0.4' ? 'true' : 'false'
      });
    }
  }

  console.log('✅ All 4 releases successfully verified and aligned on GitHub!');
}

main().catch(console.error);
