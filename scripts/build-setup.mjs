import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

async function buildSetupPackage() {
  console.log('🚀 Packaging Galaxy Launcher Setup Bundle...');

  const rootDir = process.cwd();
  const unpackedDir = path.join(rootDir, 'release', 'win-unpacked');
  const releaseDir = path.join(rootDir, 'release');

  if (!fs.existsSync(unpackedDir)) {
    console.error('❌ Error: release/win-unpacked directory not found. Run npm run pack first.');
    process.exit(1);
  }

  // 1. Create 1-Click Installer Script for friends
  const installBatContent = `@echo off
title Galaxy Launcher Installer
color 0b
echo ========================================================
echo          GALAXY LAUNCHER -- MINECRAFT, REIMAGINED
echo                 1-Click Setup & Installer
echo ========================================================
echo.
echo Installing Galaxy Launcher to your computer...
echo.

set "INSTALL_DIR=%LOCALAPPDATA%\\Programs\\GalaxyLauncher"

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo Copying application files...
xcopy /E /I /Y "%~dp0win-unpacked\\*" "%INSTALL_DIR%\\" >nul

echo Creating Desktop shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\\Galaxy Launcher.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\Galaxy Launcher.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\Galaxy Launcher.exe,0'; $Shortcut.Save()"

echo Creating Start Menu shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('StartMenu') + '\\Programs\\Galaxy Launcher.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\\Galaxy Launcher.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.IconLocation = '%INSTALL_DIR%\\Galaxy Launcher.exe,0'; $Shortcut.Save()"

echo.
echo ========================================================
echo        Installation Complete! Launching Galaxy...
echo ========================================================
echo.
start "" "%INSTALL_DIR%\\Galaxy Launcher.exe"
exit
`;

  // 2. Create Portable Runner Script
  const portableBatContent = `@echo off
start "" "%~dp0win-unpacked\\Galaxy Launcher.exe"
exit
`;

  const installBatPath = path.join(releaseDir, 'Install-Galaxy-Launcher.bat');
  const portableBatPath = path.join(releaseDir, 'Run-Galaxy-Launcher-Portable.bat');

  fs.writeFileSync(installBatPath, installBatContent, 'utf-8');
  fs.writeFileSync(portableBatPath, portableBatContent, 'utf-8');

  // 3. Create the ZIP distribution
  console.log('📦 Compressing Galaxy-Launcher-1.0.0-Setup.zip...');
  const zip = new AdmZip();

  // Add the unpacked app directory
  zip.addLocalFolder(unpackedDir, 'win-unpacked');

  // Add the installer scripts
  zip.addLocalFile(installBatPath);
  zip.addLocalFile(portableBatPath);

  // Add instructions file
  const readmeContent = `# Galaxy Launcher — Minecraft, Reimagined 🚀

## How to Install & Play:

### Option 1: 1-Click Install (Recommended)
Double-click \`Install-Galaxy-Launcher.bat\`.
This will install Galaxy Launcher to your system, create Desktop and Start Menu shortcuts, and launch the game!

### Option 2: Portable Mode (No Installation)
Double-click \`Run-Galaxy-Launcher-Portable.bat\` or open \`win-unpacked/Galaxy Launcher.exe\` directly.

Enjoy Minecraft, Reimagined!
`;
  zip.addFile('README_INSTALL.txt', Buffer.from(readmeContent, 'utf-8'));

  const zipPath = path.join(releaseDir, 'Galaxy-Launcher-1.0.0-Windows-Setup.zip');
  zip.writeZip(zipPath);

  const stats = fs.statSync(zipPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(1);

  console.log(`\n🎉 SUCCESS! Galaxy Launcher setup file ready:`);
  console.log(`📁 File: ${zipPath} (${sizeMb} MB)`);
  console.log(`\nYour friends can simply extract this ZIP and double-click "Install-Galaxy-Launcher.bat"!`);
}

buildSetupPackage();
