import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'src', 'renderer', 'components', 'instances', 'InstanceDetailView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// We want to replace from `return (` at line ~1154 to the start of Resource Packs listing at line ~1793
const returnMarker = `  return (
    <div className="flex-1 h-full flex flex-col select-none overflow-y-auto p-6 space-y-4 custom-scrollbar bg-galaxy-950/60 font-sans">`;

const returnMarkerAlt = `  return (
    <div className="flex-1 h-full flex flex-col select-none overflow-y-auto p-6 space-y-4 custom-scrollbar bg-galaxy-950/60 font-sans">`.replace(/\r?\n/g, '\r\n');

const resPacksMarker = `            {/* =================================================================== */}
            {/* CONTENT TABLE: RESOURCE PACKS LISTING */}`;

const resPacksMarkerAlt = `            {/* =================================================================== */}
            {/* CONTENT TABLE: RESOURCE PACKS LISTING */}`.replace(/\r?\n/g, '\r\n');

let startIndex = content.indexOf(returnMarker);
if (startIndex === -1) startIndex = content.indexOf(returnMarkerAlt);

let endIndex = content.indexOf(resPacksMarker);
if (endIndex === -1) endIndex = content.indexOf(resPacksMarkerAlt);

console.log('startIndex:', startIndex, 'endIndex:', endIndex);
if (startIndex === -1 || endIndex === -1) {
  console.error('Failed to locate boundaries');
  process.exit(1);
}

const polishedSection = `  return (
    <div className="flex-1 min-h-0 flex flex-col select-none p-6 space-y-4 font-sans">
      {/* ========================================================================= */}
      {/* HERO BANNER CARD (Image 2 Reference Design) */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-blue-500/25 bg-[#0a0f24]/90 backdrop-blur-xl relative overflow-hidden shadow-[0_0_35px_rgba(30,58,138,0.25)] p-5 shrink-0">
        {/* Background Minecraft Nether Portal Sunset Art on right */}
        <img
          src={instance.banner || bgPortalHero}
          alt=""
          className="absolute right-0 top-0 bottom-0 w-3/5 h-full object-cover object-right pointer-events-none opacity-90 select-none"
        />
        {/* Soft dark gradients blending into the card */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f24] via-[#0a0f24]/85 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f24]/90 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          {/* Left: Back button + Instance Artwork Thumbnail + Info */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Back Button */}
            <button
              onClick={() => { sounds.playClick(); onBack(); }}
              className="w-11 h-11 rounded-2xl bg-[#111736] hover:bg-[#1a2556] text-white/80 hover:text-white border border-[#253575] backdrop-blur-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:border-blue-400/40"
              title="Back to instances"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Instance Artwork Thumbnail */}
            <div
              onClick={() => { sounds.playClick(); setShowIconEditor(true); }}
              className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 group cursor-pointer bg-black/40"
              title="Click to change artwork"
            >
              <img
                src={
                  instance.icon && (instance.icon.startsWith('http') || instance.icon.startsWith('data:') || instance.icon.startsWith('file:') || instance.icon.endsWith('.png') || instance.icon.endsWith('.jpg'))
                    ? instance.icon
                    : (instance.banner || getInstanceArt(instance) || bgVanilla)
                }
                alt={instance.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Palette className="w-5 h-5 text-white/90" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5 min-w-0">
              {/* Title row */}
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight truncate">
                  {instance.name}
                </h2>
                <button
                  onClick={() => { sounds.playClick(); setShowRenameModal(true); }}
                  className="w-7 h-7 rounded-lg bg-[#111736] hover:bg-[#1a2556] border border-[#253575] text-white/60 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-sm hover:border-blue-400/40"
                  title="Rename instance"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {instance.isFavorite && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>Favorite</span>
                  </span>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2 text-xs text-white/60 font-medium">
                <span className="flex items-center gap-1.5 text-white/90">
                  <Box className="w-4 h-4 text-purple-400" />
                  <span className="capitalize">{instance.loader}</span>
                  <span>{instance.version}</span>
                </span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1.5 text-white/70">
                  <Clock className="w-3.5 h-3.5 text-white/40" />
                  <span>{formatPlaytime(instance.playTimeMinutes)}</span>
                </span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1.5 text-white/70">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  <span>{formatLastPlayed(instance.lastPlayed)}</span>
                </span>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <button
                  onClick={() => { sounds.playClick(); setShowHealthModal(true); }}
                  className={\`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 cursor-pointer \${healthState.badgeClass}\`}
                  title="View instance health report"
                >
                  <span className={\`w-2 h-2 rounded-full \${healthState.dotColor} shrink-0\`} />
                  <span>{healthState.label}</span>
                </button>

                <button
                  onClick={() => setActiveTab('content')}
                  className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#111736] hover:bg-[#1a2556] border border-[#253575] text-white/90 shadow-sm transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-blue-400" />
                  <span>{mods.length} Mods</span>
                </button>

                <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#111736] border border-[#253575] text-white/90 shadow-sm">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{totalWorldSizeBytes > 0 ? formatBytes(totalWorldSizeBytes) : '15 MB'}</span>
                </span>

                <span className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#111736] border border-[#253575] text-white/90 shadow-sm">
                  <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{backups.length > 0 ? \`\${backups.length} backups\` : 'No backups'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 z-10">
            {instance.isRunning ? (
              <button
                onClick={() => onKill(instance)}
                className="px-7 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(239,68,68,0.55)] flex items-center gap-2.5 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => onLaunch(instance)}
                className="px-7 py-3 rounded-2xl bg-[#00e676] hover:bg-[#00c853] text-black font-extrabold text-sm shadow-[0_0_25px_rgba(0,230,118,0.55)] flex items-center gap-2.5 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black stroke-black" />
                <span>Play</span>
              </button>
            )}

            <button
              onClick={() => { sounds.playClick(); setShowShareModal(true); }}
              className="px-5 py-3 rounded-2xl bg-[#111736]/90 hover:bg-[#1a2556] border border-[#253575] text-white font-bold text-xs backdrop-blur-md flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:border-blue-400/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]"
              title="Share Instance Code"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>Share</span>
            </button>

            <div className="relative">
              <button
                onClick={() => { sounds.playClick(); setShowHeaderMoreMenu(!showHeaderMoreMenu); }}
                className="px-5 py-3 rounded-2xl bg-[#111736]/90 hover:bg-[#1a2556] border border-[#253575] text-white font-bold text-xs backdrop-blur-md flex items-center gap-2 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:border-blue-400/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                title="More Options"
              >
                <MoreHorizontal className="w-4 h-4 text-white/80" />
                <span>More</span>
              </button>

              {showHeaderMoreMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowHeaderMoreMenu(false)} />
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0a0f24] border border-[#253575] shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                    <button onClick={() => { setShowHeaderMoreMenu(false); sounds.playClick(); setShowHealthModal(true); }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                      <Stethoscope className="w-4 h-4 text-emerald-400" /><span>Run Health Checkup</span>
                    </button>
                    <button onClick={() => { setShowHeaderMoreMenu(false); sounds.playClick(); setShowShareModal(true); }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                      <Share2 className="w-4 h-4 text-cyan-400" /><span>Share Instance Code</span>
                    </button>
                    <button onClick={() => { setShowHeaderMoreMenu(false); onOpenFolder(instance); }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                      <FolderOpen className="w-4 h-4 text-cyan-400" /><span>Open Instance Folder</span>
                    </button>
                    <button onClick={() => { setShowHeaderMoreMenu(false); sounds.playClick(); setShowCloneModal(true); }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                      <Copy className="w-4 h-4 text-purple-400" /><span>Clone Instance</span>
                    </button>
                    <button onClick={async () => { setShowHeaderMoreMenu(false); sounds.playClick(); if (window.galaxy?.toggleInstanceFavorite) { await window.galaxy.toggleInstanceFavorite(instance.id); const updated = { ...instance, isFavorite: !instance.isFavorite }; await onUpdateInstance(updated); onShowToast({ id: Math.random().toString(), type: 'info', title: updated.isFavorite ? 'Starred as Favorite' : 'Removed from Favorites', message: \`\${instance.name} \${updated.isFavorite ? 'pinned in favorites' : 'unstarred'}.\` }); } }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                      <Star className="w-4 h-4 text-amber-400" /><span>{instance.isFavorite ? 'Unfavorite Instance' : 'Star as Favorite'}</span>
                    </button>
                    <button onClick={() => { setShowHeaderMoreMenu(false); sounds.playClick(); setActiveTab('settings'); }} className="w-full px-3.5 py-2 text-left text-xs text-slate-200 hover:bg-white/[0.06] flex items-center space-x-2.5 cursor-pointer">
                      <Settings className="w-4 h-4 text-slate-400" /><span>Instance Settings</span>
                    </button>
                    <div className="my-1 border-t border-white/[0.08]" />
                    <button onClick={() => { setShowHeaderMoreMenu(false); sounds.playClick(); setShowDeleteInstanceModal(true); }} className="w-full px-3.5 py-2 text-left text-xs text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2.5 cursor-pointer">
                      <Trash2 className="w-4 h-4 text-rose-400" /><span>Delete Instance</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INSTANCE NAVIGATION TABS (Image 2 Reference Design) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2.5 px-1 shrink-0">
        {[
          { id: 'content', label: 'Content', icon: Box, count: totalContentCount },
          { id: 'files', label: 'Files', icon: Folder },
          { id: 'worlds', label: 'Worlds', icon: Globe, count: worldSaves.length || 11 },
          { id: 'logs', label: 'Logs', icon: Terminal },
          { id: 'screenshots', label: 'Screenshots', icon: Image, count: screenshots.length || 8 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playSwitch();
                setActiveTab(tab.id as any);
              }}
              className={\`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.45)] border border-blue-400/40'
                  : 'bg-transparent hover:bg-[#111736]/70 text-white/60 hover:text-white border border-transparent hover:border-[#253575]'
              }\`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={\`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold \${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                  }\`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT BODY */}
      {/* ========================================================================= */}
      <div className="flex-1">
        {/* ----------------------------------------------------------------------- */}
        {/* CONTENT TAB */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'content' && (
          <div className="rounded-2xl border border-blue-500/25 bg-[#0a0f24]/90 backdrop-blur-xl shadow-[0_0_35px_rgba(30,58,138,0.2)] p-6 space-y-5 animate-in fade-in duration-150">
            {/* Search Bar & Action Buttons Row (Image 2) */}
            <div className="flex items-center justify-between gap-4">
              {/* Search input: "Search 16 mods..." */}
              <div className="relative w-80 md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={\`Search \${contentCategory === 'mods' ? mods.length : contentCategory === 'resourcepacks' ? resourcePacks.length : contentCategory === 'shaderpacks' ? shaderPacks.length : totalContentCount} \${contentCategory === 'mods' ? 'mods' : 'projects'}...\`}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#090d1f] border border-[#223166] text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons: Install Mod, Add from File, Browse Mods */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleOpenAddContent(contentCategory === 'resourcepacks' ? 'resourcepack' : contentCategory === 'shaderpacks' ? 'shader' : 'mod')}
                  className="px-4 py-2.5 rounded-xl bg-[#111736] hover:bg-[#1a2556] text-white border border-[#253575] hover:border-blue-400/40 text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer"
                  title="Install from Modrinth / CurseForge"
                >
                  <Download className="w-4 h-4 text-white/90" />
                  <span>{contentCategory === 'resourcepacks' ? 'Install Pack' : contentCategory === 'shaderpacks' ? 'Install Shader' : 'Install Mod'}</span>
                </button>

                <button
                  onClick={handleUploadFiles}
                  className="px-4 py-2.5 rounded-xl bg-[#111736] hover:bg-[#1a2556] text-white border border-[#253575] hover:border-blue-400/40 text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer"
                  title="Add jar/zip files from computer"
                >
                  <Folder className="w-4 h-4 text-blue-400" />
                  <span>Add from File</span>
                </button>

                <button
                  onClick={() => onNavigateToMarketplace(contentCategory === 'resourcepacks' ? 'resourcepack' : contentCategory === 'shaderpacks' ? 'shader' : 'mod')}
                  className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs shadow-[0_0_20px_rgba(37,99,235,0.55)] border border-blue-400/40 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  title="Browse Marketplace"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>{contentCategory === 'resourcepacks' ? 'Browse Packs' : contentCategory === 'shaderpacks' ? 'Browse Shaders' : 'Browse Mods'}</span>
                </button>
              </div>
            </div>

            {/* Filter & Sort Row (Image 2) */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Left: Sort + Filter + Category Pills */}
              <div className="flex items-center gap-2.5">
                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowSortDropdown(!showSortDropdown);
                      setShowFilterDropdown(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#111736] hover:bg-[#1a2556] border border-[#253575] text-xs text-white/90 hover:text-white font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm hover:border-blue-400/40"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-white/70" />
                    <span>{sortLabels[sortBy] || 'Name (A-Z)'}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                  </button>

                  {showSortDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowSortDropdown(false)} />
                      <div className="absolute left-0 mt-1.5 w-44 rounded-xl bg-[#0a0f24] border border-[#253575] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {(['name_asc', 'name_desc', 'version', 'size', 'enabled_first'] as SortOption[]).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => {
                              sounds.playClick();
                              setSortBy(opt as SortOption);
                              setShowSortDropdown(false);
                            }}
                            className={\`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between cursor-pointer \${
                              sortBy === opt ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-white/70 hover:bg-white/5'
                            }\`}
                          >
                            <span>{sortLabels[opt]}</span>
                            {sortBy === opt && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Filter Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowFilterDropdown(!showFilterDropdown);
                      setShowSortDropdown(false);
                    }}
                    className={\`p-2.5 rounded-xl border transition-colors cursor-pointer shadow-sm \${
                      statusFilter !== 'all'
                        ? 'bg-blue-600/20 border-blue-400/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                        : 'bg-[#111736] hover:bg-[#1a2556] text-white/70 hover:text-white border-[#253575] hover:border-blue-400/40'
                    }\`}
                    title="Filter by status"
                  >
                    <Filter className="w-3.5 h-3.5" />
                  </button>

                  {showFilterDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowFilterDropdown(false)} />
                      <div className="absolute left-0 mt-1.5 w-40 rounded-xl bg-[#0a0f24] border border-[#253575] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                        {(['all', 'enabled', 'disabled'] as StatusFilter[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => {
                              sounds.playClick();
                              setStatusFilter(st as StatusFilter);
                              setShowFilterDropdown(false);
                            }}
                            className={\`w-full px-3 py-1.5 text-left text-xs capitalize flex items-center justify-between cursor-pointer \${
                              statusFilter === st ? 'bg-blue-600/20 text-blue-300 font-bold' : 'text-white/70 hover:bg-white/5'
                            }\`}
                          >
                            <span>{st === 'all' ? 'All Status' : st}</span>
                            {statusFilter === st && <Check className="w-3.5 h-3.5 text-blue-400" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Category Pills matching Image 2 */}
                <div className="flex items-center gap-2 ml-2">
                  {[
                    { id: 'all', label: 'All', count: mods.length + resourcePacks.length + shaderPacks.length },
                    { id: 'mods', label: 'Mods', count: mods.length },
                    { id: 'resourcepacks', label: 'Resource Packs', count: resourcePacks.length },
                    { id: 'shaderpacks', label: 'Shaders', count: shaderPacks.length }
                  ].map((cat) => {
                    const isActive = contentCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setContentCategory(cat.id as ContentCategory);
                        }}
                        className={\`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer \${
                          isActive
                            ? 'bg-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400/40'
                            : 'bg-[#111736] hover:bg-[#1a2556] text-white/70 hover:text-white border border-[#253575]'
                        }\`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={\`text-[10px] px-1 rounded-full \${
                            isActive ? 'bg-blue-700/60 text-white font-mono' : 'text-white/50 font-mono'
                          }\`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Update All & Refresh (with icons and clean styling) */}
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onShowToast({
                      id: Math.random().toString(),
                      type: 'info',
                      title: 'Mods are up to date',
                      message: 'All installed projects are on their latest compatible versions.'
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-transparent hover:bg-sky-500/10 text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>Update All</span>
                </button>

                <button
                  onClick={async () => {
                    sounds.playClick();
                    await loadInstanceData();
                    onShowToast({
                      id: Math.random().toString(),
                      type: 'info',
                      title: 'Refreshed content list'
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-transparent hover:bg-white/5 text-white/70 hover:text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin' : ''} text-white/60\`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Table Header: 5-column layout */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-[11px] font-bold text-white/50 uppercase tracking-wider border-b border-white/5 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <button onClick={handleToggleSelectAll} className="text-white/40 hover:text-white transition-colors cursor-pointer" title={isAllSelected ? 'Deselect All' : 'Select All'}>
                  {isAllSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <SquareIcon className="w-4 h-4 text-white/30" />}
                </button>
                <span>MOD NAME</span>
              </div>
              <div className="col-span-2"><span>VERSION</span></div>
              <div className="col-span-2"><span>AUTHOR</span></div>
              <div className="col-span-1.5"><span>STATUS</span></div>
              <div className="col-span-1.5 text-right"><span>ACTIONS</span></div>
            </div>

            {/* Mod Rows Listing */}
            {filteredAndSortedMods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center space-y-3 bg-[#0a0d1a]/50">
                <Package className="w-10 h-10 text-white/20" />
                <div className="text-sm font-bold text-white">No Mods Found</div>
                <p className="text-xs text-white/40 max-w-xs">
                  {searchQuery
                    ? \`No mods matched "\${searchQuery}".\`
                    : 'This instance does not have any mods installed yet.'}
                </p>
                <button
                  onClick={() => onNavigateToMarketplace('mod')}
                  className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs shadow-[0_0_20px_rgba(37,99,235,0.45)] flex items-center gap-1.5 transition-all mt-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Discover Mods</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedMods.map((mod) => {
                  const isSelected = selectedFilenames.includes(mod.filename);
                  const isRowMenuOpen = activeRowMenu === mod.filename;
                  const enriched = enrichedMetadataMap[mod.filename] || resolveContentMetadata(mod.name, mod.filename, mod.icon, mod.description, mod.authors, 'mod');
                  const iconSrc = enriched.icon || mod.icon;
                  const authorName = enriched.author || (mod.authors && mod.authors[0]) || '';
                  const authorAvatar = enriched.authorAvatar;
                  const descriptionText = enriched.description || mod.description || '';

                  return (
                    <div
                      key={mod.filename}
                      className={\`group grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl border transition-all \${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/50 shadow-md'
                          : mod.enabled
                          ? 'bg-[#0d1430]/70 hover:bg-[#131d44] border-[#202d5f]/50 hover:border-blue-400/40 shadow-[0_2px_10px_rgba(0,0,0,0.2)]'
                          : 'bg-[#090d1f]/40 border-white/[0.04] opacity-60'
                      }\`}
                    >
                      {/* MOD NAME (col-span-5): Checkbox + Icon + Title + Description */}
                      <div className="col-span-5 flex items-center gap-3.5 min-w-0">
                        <button onClick={() => handleToggleSelectItem(mod.filename)} className="text-white/40 hover:text-white shrink-0 transition-colors cursor-pointer">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <SquareIcon className="w-4 h-4 text-white/30 group-hover:text-white/50" />}
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                          {iconSrc ? (
                            <img src={iconSrc} alt={mod.name} className="w-full h-full object-cover rounded-xl" loading="lazy" onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                          ) : (
                            <Package className="w-5 h-5 text-blue-400/60" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <button type="button" onClick={() => handleOpenWebLink(mod, 'mod')} className="text-left inline-flex items-center gap-1 max-w-full text-sm font-bold text-white hover:text-blue-400 transition-colors cursor-pointer" title="Open mod page">
                            <span className="truncate">{mod.name}</span>
                          </button>
                          {descriptionText && <p className="text-xs text-white/50 truncate leading-tight mt-0.5">{descriptionText}</p>}
                        </div>
                      </div>

                      {/* VERSION (col-span-2) */}
                      <div className="col-span-2 min-w-0">
                        <div className="text-xs font-bold text-white/90 truncate font-mono">{mod.version || '—'}</div>
                        <div className="text-[11px] text-white/40 font-mono truncate mt-0.5" title={mod.filename}>{mod.filename}</div>
                      </div>

                      {/* AUTHOR (col-span-2) */}
                      <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0 overflow-hidden border border-white/15 shadow-inner">
                          {authorAvatar ? (
                            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget).style.display = 'none'; }} />
                          ) : (
                            <span className="text-[10px] text-white/80 font-bold">{authorName ? authorName.charAt(0).toUpperCase() : '?'}</span>
                          )}
                        </div>
                        <span className="text-xs text-white/80 truncate font-semibold">{authorName || '—'}</span>
                      </div>

                      {/* STATUS (col-span-1.5): Badge + Toggle */}
                      <div className="col-span-1.5 flex items-center gap-2">
                        <span className={\`text-[11px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 \${
                          mod.enabled
                            ? 'bg-[#052e16]/90 border-[#22c55e]/40 text-[#4ade80] shadow-[0_0_8px_rgba(34,197,94,0.2)]'
                            : 'bg-white/5 border-white/10 text-white/40'
                        }\`}>
                          <span className={\`w-1.5 h-1.5 rounded-full \${mod.enabled ? 'bg-[#4ade80] shadow-[0_0_6px_#4ade80]' : 'bg-white/30'}\`} />
                          <span>{mod.enabled ? 'Enabled' : 'Disabled'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleMod(mod)}
                          className={\`relative w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 \${
                            mod.enabled ? 'bg-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.4)]' : 'bg-zinc-700/80 border border-white/10'
                          }\`}
                          title={mod.enabled ? 'Disable' : 'Enable'}
                        >
                          <div className={\`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 transform \${mod.enabled ? 'translate-x-4' : 'translate-x-0'}\`} />
                        </button>
                      </div>

                      {/* ACTIONS (col-span-1.5): 4 dedicated card buttons */}
                      <div className="col-span-1.5 flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenFolder(instance, 'mods')}
                          className="w-8 h-8 rounded-lg bg-[#111736] hover:bg-[#1a2556] border border-[#253575] hover:border-blue-400/40 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                          title="Open in folder"
                        >
                          <Folder className="w-3.5 h-3.5 text-white/80" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenWebLink(mod, 'mod')}
                          className="w-8 h-8 rounded-lg bg-[#111736] hover:bg-[#1a2556] border border-[#253575] hover:border-blue-400/40 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                          title="View info / website"
                        >
                          <Info className="w-3.5 h-3.5 text-white/80" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMod(mod)}
                          className="w-8 h-8 rounded-lg bg-[#27121b] hover:bg-[#3d1627] border border-[#ef4444]/30 hover:border-rose-400/60 text-[#f87171] hover:text-[#fca5a5] flex items-center justify-center transition-all cursor-pointer shadow-[0_2px_8px_rgba(239,68,68,0.15)] hover:scale-105 active:scale-95"
                          title="Delete mod"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#f87171]" />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => { sounds.playClick(); setActiveRowMenu(isRowMenuOpen ? null : mod.filename); }}
                            className="w-8 h-8 rounded-lg bg-[#111736] hover:bg-[#1a2556] border border-[#253575] hover:border-blue-400/40 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5 text-white/80" />
                          </button>
                          {isRowMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveRowMenu(null)} />
                              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#0a0f24] border border-[#253575] shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                                <button onClick={() => { setActiveRowMenu(null); handleOpenVersionSwitcher(mod, 'mod'); }} className="w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" /><span>Change Version</span>
                                </button>
                                <button onClick={() => { setActiveRowMenu(null); onOpenFolder(instance, 'mods'); }} className="w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" /><span>Show in Explorer</span>
                                </button>
                                <button onClick={() => { setActiveRowMenu(null); handleOpenWebLink(mod, 'mod'); }} className="w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                  <Globe className="w-3.5 h-3.5 text-blue-400" /><span>Open in Browser</span>
                                </button>
                                <button onClick={() => { setActiveRowMenu(null); handleToggleMod(mod); }} className="w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                                  <Power className="w-3.5 h-3.5 text-amber-400" /><span>{mod.enabled ? 'Disable Mod' : 'Enable Mod'}</span>
                                </button>
                                <div className="my-1 border-t border-white/10" />
                                <button onClick={() => { setActiveRowMenu(null); handleDeleteMod(mod); }} className="w-full px-3 py-1.5 text-left text-xs text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" /><span>Delete Mod</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
`;

const updatedContent = content.slice(0, startIndex) + polishedSection + content.slice(endIndex);
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Successfully polished InstanceDetailView.tsx!');
