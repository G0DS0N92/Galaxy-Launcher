import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = pkg.version;
const tagName = `v${version}`;

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

if (!token) {
  console.error('❌ GH_TOKEN not found in .env');
  process.exit(1);
}

const owner = 'G0DS0N92';
const repo = 'Galaxy-Launcher';

function requestGitHub(apiPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'User-Agent': 'Galaxy-Launcher-Release/1.0',
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
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function uploadAsset(uploadUrlTemplate, filePath, assetName) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found for upload: ${filePath}`);
      return resolve(null);
    }

    const fileSize = fs.statSync(filePath).size;
    const fileStream = fs.createReadStream(filePath);
    const cleanUrl = uploadUrlTemplate.replace(/\{.*?\}/, '') + `?name=${encodeURIComponent(assetName)}`;
    const urlObj = new URL(cleanUrl);

    console.log(`Uploading ${assetName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)...`);

    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'User-Agent': 'Galaxy-Launcher-Release/1.0',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileSize
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`✓ Uploaded ${assetName} successfully!`);
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ ok: true });
          }
        } else {
          console.error(`Failed to upload ${assetName}: HTTP ${res.statusCode}`, data);
          resolve(null);
        }
      });
    });

    req.on('error', reject);
    fileStream.pipe(req);
  });
}

async function main() {
  console.log(`🚀 Starting GitHub Release process for ${owner}/${repo} -> ${tagName}...`);

  const releaseName = `✨ Galaxy Launcher v${version} — The Quantum Share & Cosmetics Update 🌌`;
  const releaseBody = `## 🌌 Galaxy Launcher v${version} — The Quantum Share & Cosmetics Update 🚀

Welcome to **Galaxy Launcher v${version}**! This massive release introduces **1-Click Instance Share Codes (GLX-XXXX)**, the **Free Galaxy Capes & Cosmetics Wardrobe**, **Cosmic Achievements & Voyager Progression**, **Galaxy Cloud Sync**, and **Advanced 3D Skin Studio**.

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

### 🎨 3D Skin Studio & Preset Gallery
- **Preset Skin Library**: 1-click apply iconic skins (Steve, Alex, Technoblade, Dream, Grian, Mumbo, DanTDM, Herobrine, and more).
- **Mojang IGN Search**: Pull any player skin directly by username.
- **Custom PNG Uploader**: Upload 64x64 or 64x32 PNG skin textures with customizable Classic (4px) or Slim (3px) arms.

---

### 🏆 Cosmic Achievements & Voyager Progression
- **12 Unique Achievements**: Unlock XP, level up your Galaxy profile from *Stargazer* to *Cosmic Overlord*, with animated unlock toasts and sound effects.

---

### ☁️ Galaxy Cloud Sync & Network
- **Cloud Backup Vault**: Safe sync for instances, playtime stats, and profile settings.
- **Live Friends & Network Activity**: Real-time status and party invites.`;

  // 1. Check if release already exists
  let release = null;
  const listRes = await requestGitHub(`/repos/${owner}/${repo}/releases`);
  if (Array.isArray(listRes.data)) {
    release = listRes.data.find(r => r.tag_name === tagName);
  }

  if (!release) {
    const tagRes = await requestGitHub(`/repos/${owner}/${repo}/releases/tags/${tagName}`);
    if (tagRes.status === 200 && tagRes.data && tagRes.data.id) {
      release = tagRes.data;
    }
  }

  if (release && release.id) {
    console.log(`Found existing release #${release.id}. Updating metadata...`);
    const updateRes = await requestGitHub(`/repos/${owner}/${repo}/releases/${release.id}`, 'PATCH', {
      name: releaseName,
      body: releaseBody,
      draft: false,
      prerelease: false,
      make_latest: 'true'
    });
    console.log('Update release status:', updateRes.status);
    console.log('Update release data:', updateRes.data);
    if (updateRes.status >= 200 && updateRes.status < 300) {
      release = updateRes.data;
    } else {
      console.warn('Could not update release, trying delete and recreate...');
      await requestGitHub(`/repos/${owner}/${repo}/releases/${release.id}`, 'DELETE');
      release = null;
    }
  }

  if (!release || !release.id) {
    console.log(`Creating fresh public release for ${tagName}...`);
    const createRes = await requestGitHub(`/repos/${owner}/${repo}/releases`, 'POST', {
      tag_name: tagName,
      name: releaseName,
      body: releaseBody,
      draft: false,
      prerelease: false,
      make_latest: 'true'
    });
    console.log('Create release status:', createRes.status, createRes.data);

    if (createRes.status === 201) {
      release = createRes.data;
      console.log(`✓ Release created successfully! ID: ${release.id}`);
    } else {
      console.error('❌ Failed to create release. HTTP', createRes.status, createRes.data);
      process.exit(1);
    }
  }

  console.log(`Release URL: ${release.html_url}`);
  console.log(`Upload URL: ${release.upload_url}`);

  // 2. Upload assets
  const releaseDir = path.join(rootDir, 'release');
  if (!fs.existsSync(releaseDir)) {
    console.error(`Release dir ${releaseDir} does not exist`);
    process.exit(1);
  }

  const files = fs.readdirSync(releaseDir);
  console.log('Files in release dir:', files);

  const exeFiles = files.filter(f => f.endsWith('.exe') && !f.includes('uninstaller'));
  console.log('Found executable binaries:', exeFiles);

  const primaryExe = exeFiles.find(f => f.includes(version)) || exeFiles[0];
  if (!primaryExe) {
    console.error('No .exe installer found in release/');
    process.exit(1);
  }

  // Check existing assets on release
  const assetsRes = await requestGitHub(`/repos/${owner}/${repo}/releases/${release.id}/assets`);
  const existingAssets = Array.isArray(assetsRes.data) ? assetsRes.data : [];

  const uploadTargets = [
    { name: `Galaxy.Launcher.Setup.${version}.exe`, localPath: path.join(releaseDir, primaryExe) },
    { name: `Galaxy Launcher Setup ${version}.exe`, localPath: path.join(releaseDir, primaryExe) }
  ];

  const blockmapFile = files.find(f => f.endsWith('.blockmap'));
  if (blockmapFile) {
    uploadTargets.push({
      name: `Galaxy.Launcher.Setup.${version}.exe.blockmap`,
      localPath: path.join(releaseDir, blockmapFile)
    });
  }

  // Generate latest.yml
  const exeBuffer = fs.readFileSync(path.join(releaseDir, primaryExe));
  const sha512 = crypto.createHash('sha512').update(exeBuffer).digest('base64');
  const latestYmlContent = `version: ${version}
files:
  - url: Galaxy.Launcher.Setup.${version}.exe
    sha512: ${sha512}
    size: ${exeBuffer.length}
path: Galaxy.Launcher.Setup.${version}.exe
sha512: ${sha512}
releaseDate: '${new Date().toISOString()}'
`;
  const ymlPath = path.join(releaseDir, 'latest.yml');
  fs.writeFileSync(ymlPath, latestYmlContent, 'utf8');
  uploadTargets.push({ name: 'latest.yml', localPath: ymlPath });

  for (const target of uploadTargets) {
    const existing = existingAssets.find(a => a.name === target.name);
    if (existing) {
      console.log(`Deleting existing asset ${existing.name} (id: ${existing.id})...`);
      await requestGitHub(`/repos/${owner}/${repo}/releases/assets/${existing.id}`, 'DELETE');
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log(`Uploading ${target.name}...`);
    await uploadAsset(release.upload_url, target.localPath, target.name);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n======================================================');
  console.log(`🎉 RELEASE v${version} SUCCESSFULLY DEPLOYED TO GITHUB!`);
  console.log(`Public Release URL: ${release.html_url}`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Fatal error in deploy-release.mjs:', err);
  process.exit(1);
});
