import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Camera,
  FolderOpen,
  Copy,
  Trash2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  Check,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Sparkles,
  Calendar,
  HardDrive
} from 'lucide-react';
import { ScreenshotItem, Instance } from '../../../preload/types';
import { ConfirmModal } from '../common/ConfirmModal';
import { sounds } from '../../services/soundEngine';

interface ScreenshotsViewProps {
  instances: Instance[];
}

export const ScreenshotsView: React.FC<ScreenshotsViewProps> = ({ instances }) => {
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size'>('newest');

  // Lightbox state
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<ScreenshotItem | null>(null);

  const fetchScreenshots = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (window.galaxy?.getScreenshots) {
        const list = await window.galaxy.getScreenshots();
        setScreenshots(list || []);
      }
    } catch (err) {
      console.error('Failed to load screenshots:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenshots();

    const onFocus = () => {
      fetchScreenshots(true);
    };
    window.addEventListener('focus', onFocus);

    const interval = setInterval(() => {
      fetchScreenshots(true);
    }, 2000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);

  // Filter & Sort
  const filteredScreenshots = useMemo(() => {
    return screenshots
      .filter((s) => {
        const matchesInstance = selectedInstanceId === 'all' || s.instanceId === selectedInstanceId;
        const matchesSearch =
          s.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.instanceName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesInstance && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'size') return b.sizeBytes - a.sizeBytes;
        return 0;
      });
  }, [screenshots, selectedInstanceId, searchQuery, sortBy]);

  const handleCopy = async (screenshot: ScreenshotItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (window.galaxy?.copyScreenshotToClipboard) {
        await window.galaxy.copyScreenshotToClipboard(screenshot.filePath);
        sounds.playSuccess();
        setCopiedId(screenshot.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy screenshot:', err);
    }
  };

  const handleOpenFolder = (screenshot?: ScreenshotItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sounds.playClick();
    if (window.galaxy?.openScreenshotFolder) {
      window.galaxy.openScreenshotFolder(screenshot?.filePath);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (window.galaxy?.deleteScreenshot) {
        await window.galaxy.deleteScreenshot(deleteTarget.filePath);
        sounds.playClick();
        setScreenshots((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        if (activeLightboxIndex !== null) {
          setActiveLightboxIndex(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete screenshot:', err);
    } finally {
      setDeleteTarget(null);
    }
  };



  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
        setLightboxZoom(1);
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) =>
          prev !== null && prev < filteredScreenshots.length - 1 ? prev + 1 : 0
        );
        setLightboxZoom(1);
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : filteredScreenshots.length - 1
        );
        setLightboxZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, filteredScreenshots]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const activeScreenshot = activeLightboxIndex !== null ? filteredScreenshots[activeLightboxIndex] : null;

  return (
    <div className="flex-1 h-full flex flex-col select-none overflow-y-auto p-6 md:p-8 space-y-6 animate-in fade-in duration-200 custom-scrollbar">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-glow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center space-x-2">
              <span>Cosmic Screenshots Archive</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {screenshots.length} Captured
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Browse, zoom, manage, and copy all in-game Minecraft moments across your instances.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              sounds.playClick();
              fetchScreenshots();
            }}
            title="Refresh screenshots"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => handleOpenFolder()}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/[0.06] text-xs font-medium transition-all group"
          >
            <FolderOpen className="w-4 h-4 text-purple-400 transition-transform group-hover:scale-110" />
            <span>Open Folder</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by filename or instance..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center space-x-3">
          {/* Instance Filter */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Instance:</span>
            <select
              value={selectedInstanceId}
              onChange={(e) => {
                sounds.playSwitch();
                setSelectedInstanceId(e.target.value);
              }}
              className="px-3 py-2 rounded-xl bg-galaxy-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Instances ({screenshots.length})</option>
              {instances.map((inst) => {
                const count = screenshots.filter((s) => s.instanceId === inst.id).length;
                return (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                sounds.playSwitch();
                setSortBy(e.target.value as any);
              }}
              className="px-3 py-2 rounded-xl bg-galaxy-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="size">Largest Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* Gallery Grid Container */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-7 h-7 animate-spin text-purple-400" />
            <p className="text-xs font-mono">Scanning instances for cosmic captures...</p>
          </div>
        ) : filteredScreenshots.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center space-y-4 rounded-3xl bg-white/[0.01] border border-white/[0.04] p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-glow-sm">
              <Camera className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-sm font-semibold text-white">No Cosmic Captures Found</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {searchQuery || selectedInstanceId !== 'all'
                  ? 'No screenshots matched your current filter criteria.'
                  : 'Launch any Minecraft instance and press F2 in-game to snap memorable moments. They will appear here automatically!'}
              </p>
            </div>
            {(searchQuery || selectedInstanceId !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedInstanceId('all');
                }}
                className="px-4 py-2 rounded-xl btn-accent text-xs font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {filteredScreenshots.map((item, index) => {
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    sounds.playClick();
                    setActiveLightboxIndex(index);
                  }}
                  className="group relative rounded-2xl overflow-hidden bg-galaxy-900/60 border border-white/[0.06] hover:border-purple-500/50 transition-all duration-300 hover:shadow-glow-md flex flex-col cursor-pointer"
                >
                  {/* Thumbnail Image Container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                    <img
                      src={item.previewUrl || `galaxy-file://image?path=${encodeURIComponent(item.filePath)}`}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
                      onError={(e) => {
                        (e.target as HTMLElement).style.opacity = '0';
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-galaxy-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Top Instance Tag */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-galaxy-950/80 backdrop-blur-md border border-white/10 text-[10px] font-medium text-slate-300">
                      {item.instanceName}
                    </div>

                    {/* Quick Action Floating Bar on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playClick();
                          setActiveLightboxIndex(index);
                        }}
                        title="View Fullscreen"
                        className="p-2 rounded-xl bg-galaxy-950/90 hover:bg-purple-600 text-white border border-white/20 shadow-lg transition-colors"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleCopy(item, e)}
                        title="Copy Image to Clipboard"
                        className={`p-2 rounded-xl transition-colors shadow-lg border border-white/20 ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-galaxy-950/90 hover:bg-cyan-600 text-white'
                        }`}
                      >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={(e) => handleOpenFolder(item, e)}
                        title="Open in File Explorer"
                        className="p-2 rounded-xl bg-galaxy-950/90 hover:bg-slate-700 text-white border border-white/20 shadow-lg transition-colors"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.playClick();
                          setDeleteTarget(item);
                        }}
                        title="Delete Screenshot"
                        className="p-2 rounded-xl bg-galaxy-950/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 shadow-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="p-3 space-y-1 bg-galaxy-950/60">
                    <p className="text-xs font-medium text-slate-200 truncate" title={item.filename}>
                      {item.filename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{formatDate(item.createdAt)}</span>
                      <span>{formatFileSize(item.sizeBytes)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Cosmic Lightbox Modal */}
      {activeScreenshot && (
        <div
          onWheel={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col justify-between p-6 select-none animate-fadeIn"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                {activeScreenshot.instanceName}
              </div>
              <span className="text-sm font-medium text-white truncate max-w-md">
                {activeScreenshot.filename}
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({(activeLightboxIndex ?? 0) + 1} of {filteredScreenshots.length})
              </span>
            </div>

            {/* Lightbox Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLightboxZoom((prev) => Math.max(0.5, prev - 0.25))}
                title="Zoom Out"
                className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLightboxZoom(1)}
                title="Reset Zoom"
                className="px-2.5 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-mono text-slate-200 transition-colors"
              >
                {Math.round(lightboxZoom * 100)}%
              </button>
              <button
                onClick={() => setLightboxZoom((prev) => Math.min(3, prev + 0.25))}
                title="Zoom In"
                className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button
                onClick={(e) => handleCopy(activeScreenshot, e)}
                title="Copy to Clipboard"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  copiedId === activeScreenshot.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/[0.08] hover:bg-purple-600 text-white'
                }`}
              >
                {copiedId === activeScreenshot.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === activeScreenshot.id ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={() => handleOpenFolder(activeScreenshot)}
                title="Show in Folder"
                className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(activeScreenshot)}
                title="Delete"
                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveLightboxIndex(null);
                  setLightboxZoom(1);
                }}
                className="p-2 rounded-xl bg-white/[0.1] hover:bg-white/[0.2] text-white transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Preview Area with Left/Right Nav */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-4">
            {/* Left Button */}
            <button
              onClick={() => {
                sounds.playSwitch();
                setActiveLightboxIndex((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : filteredScreenshots.length - 1
                );
                setLightboxZoom(1);
              }}
              className="absolute left-4 z-20 p-3.5 rounded-2xl bg-black/60 hover:bg-purple-600 text-white border border-white/10 hover:border-purple-400 backdrop-blur-md transition-all duration-200 shadow-2xl hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Centered Image */}
            <div className="max-w-full max-h-full flex items-center justify-center p-4 transition-transform duration-200">
              <img
                src={activeScreenshot.previewUrl || `galaxy-file://image?path=${encodeURIComponent(activeScreenshot.filePath)}`}
                alt=""
                style={{ transform: `scale(${lightboxZoom})` }}
                className="max-w-[85vw] max-h-[75vh] object-contain rounded-xl shadow-2xl transition-transform duration-200 border border-white/[0.08]"
              />
            </div>

            {/* Right Button */}
            <button
              onClick={() => {
                sounds.playSwitch();
                setActiveLightboxIndex((prev) =>
                  prev !== null && prev < filteredScreenshots.length - 1 ? prev + 1 : 0
                );
                setLightboxZoom(1);
              }}
              className="absolute right-4 z-20 p-3.5 rounded-2xl bg-black/60 hover:bg-purple-600 text-white border border-white/10 hover:border-purple-400 backdrop-blur-md transition-all duration-200 shadow-2xl hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Info Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] z-10">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>{formatDate(activeScreenshot.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>{formatFileSize(activeScreenshot.sizeBytes)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
              <span>Use ◀ ▶ arrows to navigate • ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Screenshot"
        subtitle={deleteTarget ? deleteTarget.filename : undefined}
        description={`Are you sure you want to permanently delete "${deleteTarget?.filename}"? This will remove the image file from disk.`}
        confirmText="Delete Screenshot"
        cancelText="Cancel"
        type="danger"
        icon={<Trash2 className="w-5 h-5 text-rose-300" />}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};
