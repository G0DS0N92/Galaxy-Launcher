import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envPath = path.join(rootDir, '.env');
let token = '';
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

function ghRequest(apiPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'User-Agent': 'Galaxy-Launcher-Sync/1.0',
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
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function getAllFiles(dir, fileList = [], relativeTo = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');

    // Skip git, node_modules, dist, dist-electron, release, .gemini, runtimes, versions, libraries, instances, assets
    if (
      relPath.startsWith('node_modules') ||
      relPath.startsWith('.git') ||
      relPath.startsWith('dist') ||
      relPath.startsWith('dist-electron') ||
      relPath.startsWith('release') ||
      relPath.startsWith('.gemini') ||
      relPath.startsWith('runtimes') ||
      relPath.startsWith('versions') ||
      relPath.startsWith('libraries') ||
      relPath.startsWith('instances') ||
      relPath.startsWith('assets') ||
      relPath.endsWith('.env') ||
      relPath.endsWith('.log') ||
      relPath.endsWith('.exe') ||
      relPath.endsWith('.zip')
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList, relativeTo);
    } else {
      fileList.push({ fullPath, relPath });
    }
  }
  return fileList;
}

async function syncToGitHub() {
  console.log(`🌌 Checking GitHub repository ${owner}/${repo}...`);

  // 1. Get latest commit on main
  const refRes = await ghRequest(`/repos/${owner}/${repo}/git/ref/heads/main`);
  if (refRes.status !== 200) {
    throw new Error(`Failed to fetch main ref: HTTP ${refRes.status} ${JSON.stringify(refRes.body)}`);
  }
  const latestCommitSha = refRes.body.object.sha;
  console.log(`✓ Current main commit: ${latestCommitSha}`);

  // 2. Get tree of latest commit
  const commitRes = await ghRequest(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`);
  const baseTreeSha = commitRes.body.tree.sha;

  // 3. Scan all source code files
  const files = getAllFiles(rootDir);
  console.log(`Found ${files.length} project files to sync.`);

  // 4. Create blobs or tree items
  const treeItems = [];
  for (let i = 0; i < files.length; i++) {
    const { fullPath, relPath } = files[i];
    const content = fs.readFileSync(fullPath);
    const isBinary = relPath.endsWith('.png') || relPath.endsWith('.ico') || relPath.endsWith('.jpg') || relPath.endsWith('.mp3');

    // Create Blob for file
    const blobRes = await ghRequest(`/repos/${owner}/${repo}/git/blobs`, 'POST', {
      content: content.toString(isBinary ? 'base64' : 'utf8'),
      encoding: isBinary ? 'base64' : 'utf-8'
    });

    if (blobRes.status !== 201) {
      console.warn(`Failed to create blob for ${relPath}:`, blobRes.body);
      continue;
    }

    treeItems.push({
      path: relPath,
      mode: '100644',
      type: 'blob',
      sha: blobRes.body.sha
    });

    if ((i + 1) % 20 === 0 || i === files.length - 1) {
      console.log(`Uploaded blobs (${i + 1}/${files.length})...`);
    }
  }

  // 5. Create new Tree
  console.log(`Creating GitHub tree with ${treeItems.length} items...`);
  const treeRes = await ghRequest(`/repos/${owner}/${repo}/git/trees`, 'POST', {
    base_tree: baseTreeSha,
    tree: treeItems
  });

  if (treeRes.status !== 201) {
    throw new Error(`Failed to create tree: ${JSON.stringify(treeRes.body)}`);
  }
  const newTreeSha = treeRes.body.sha;
  console.log(`✓ Created new tree: ${newTreeSha}`);

  // 6. Create Commit
  const commitMsg = `🚀 Fix(launcher): In-game cosmetics injection, per-account achievements, instant exit sync & UI clean-up\n\n- Injected 18 default Minecraft character textures & direct client jar patcher for skins\n- Fixed per-account achievement isolation across offline & Microsoft profiles\n- Added Instance Cloning modal with customizable component duplication\n- Added real-time process termination detection & stop game sync\n- Streamlined sidebar navigation layout`;
  
  const newCommitRes = await ghRequest(`/repos/${owner}/${repo}/git/commits`, 'POST', {
    message: commitMsg,
    tree: newTreeSha,
    parents: [latestCommitSha]
  });

  if (newCommitRes.status !== 201) {
    throw new Error(`Failed to create commit: ${JSON.stringify(newCommitRes.body)}`);
  }
  const newCommitSha = newCommitRes.body.sha;
  console.log(`✓ Created new commit: ${newCommitSha}`);

  // 7. Update main branch reference
  const updateRefRes = await ghRequest(`/repos/${owner}/${repo}/git/refs/heads/main`, 'PATCH', {
    sha: newCommitSha,
    force: false
  });

  if (updateRefRes.status !== 200) {
    throw new Error(`Failed to update main ref: ${JSON.stringify(updateRefRes.body)}`);
  }
  console.log(`🎉 Successfully pushed all files to GitHub main branch!`);
  console.log(`Commit URL: https://github.com/${owner}/${repo}/commit/${newCommitSha}`);
}

syncToGitHub().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
