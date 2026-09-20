import asar from '@electron/asar';
import path from 'path';
import fs from 'fs';

const targetAsar = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\Admin\\AppData\\Local',
  'Programs',
  'Galaxy Launcher',
  'resources',
  'app.asar'
);

const tempDir = path.join(
  process.env.LOCALAPPDATA || 'C:\\Users\\Admin\\AppData\\Local',
  'Programs',
  'Galaxy Launcher',
  'resources',
  'app_staging'
);

async function sync() {
  try {
    if (!fs.existsSync(path.dirname(targetAsar))) {
      console.log('[Sync] Installed launcher resources folder not found.');
      return;
    }

    console.log('[Sync] Packing latest build to installed app.asar...');

    // Clean old staging artifacts so dead bundles do not accumulate in app.asar
    const distTarget = path.join(tempDir, 'dist');
    const distElectronTarget = path.join(tempDir, 'dist-electron');
    if (fs.existsSync(distTarget)) {
      fs.rmSync(distTarget, { recursive: true, force: true });
    }
    if (fs.existsSync(distElectronTarget)) {
      fs.rmSync(distElectronTarget, { recursive: true, force: true });
    }

    // Copy package.json, dist, dist-electron, build, public, and node_modules
    fs.cpSync('dist', path.join(tempDir, 'dist'), { recursive: true });
    fs.cpSync('dist-electron', path.join(tempDir, 'dist-electron'), { recursive: true });
    fs.cpSync('build', path.join(tempDir, 'build'), { recursive: true });
    fs.cpSync('public', path.join(tempDir, 'public'), { recursive: true });
    
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const minimalPkg = {
      name: pkg.name,
      version: pkg.version,
      type: pkg.type,
      main: pkg.main,
      dependencies: pkg.dependencies
    };
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(minimalPkg, null, 2));

    // Copy production dependencies node_modules if not present
    const stagingModules = path.join(tempDir, 'node_modules');
    if (!fs.existsSync(stagingModules)) {
      const prodDeps = Object.keys(pkg.dependencies || {});
      fs.mkdirSync(stagingModules, { recursive: true });
      for (const dep of prodDeps) {
        const srcDep = path.join('node_modules', dep);
        if (fs.existsSync(srcDep)) {
          fs.cpSync(srcDep, path.join(stagingModules, dep), { recursive: true });
        }
      }
    }

    // Pack to target app.asar
    await asar.createPackageWithOptions(tempDir, targetAsar, {
      unpack: '{*.node,build/**,public/**}'
    });

    console.log('[Sync] Successfully synchronized installed app.asar!');
  } catch (err) {
    console.error('[Sync] Error syncing app.asar:', err.message);
  }
}

sync();
