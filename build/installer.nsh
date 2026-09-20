!macro customUnInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you also want to completely delete all Galaxy Launcher player data, instances, downloaded mods, shaders, resource packs, and settings?$\r$\n$\r$\n• Click [Yes] to completely wipe all instances, downloaded mods, shaders, and worlds from your computer.$\r$\n• Click [No] to keep your instance folders and worlds." IDNO skipDataCleanup
    DetailPrint "Removing Galaxy Launcher instance directories and user data..."
    RMDir /r "$APPDATA\GalaxyLauncher"
    RMDir /r "$APPDATA\galaxy-launcher"
    RMDir /r "$LOCALAPPDATA\galaxy-launcher-updater"
    RMDir /r "$LOCALAPPDATA\galaxy-launcher"
  skipDataCleanup:
!macroend
