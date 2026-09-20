import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Search,
  Trash2,
  Copy,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowDown,
  Wand2,
  Info
} from 'lucide-react';
import { LogEntry, CrashReportAnalysis } from '../../types';
import { sounds } from '../../services/soundEngine';

interface LogConsoleViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onShowToast: (toast: any) => void;
}

export const LogConsoleView: React.FC<LogConsoleViewProps> = ({
  logs,
  onClearLogs,
  onShowToast
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [crashAnalysis, setCrashAnalysis] = useState<CrashReportAnalysis | null>(null);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    // Run crash analysis if error logs exist
    const errorLogs = logs.filter(l => l.level === 'ERROR');
    if (errorLogs.length > 0 && window.galaxy?.analyzeCrash) {
      window.galaxy.analyzeCrash(logs).then((analysis) => {
        if (analysis.isCrash) {
          setCrashAnalysis(analysis);
        } else {
          setCrashAnalysis(null);
        }
      }).catch(() => {});
    } else {
      setCrashAnalysis(null);
    }
  }, [logs]);

  const handleCopyLogs = () => {
    sounds.playClick();
    const fullText = logs.map(l => `[${l.timestamp}] [${l.source || 'APP'}/${l.level}]: ${l.message}`).join('\n');
    navigator.clipboard.writeText(fullText);
    onShowToast({
      id: Math.random().toString(),
      type: 'success',
      title: 'Logs Copied to Clipboard'
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesQuery = !searchQuery || log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  return (
    <div className="flex-1 h-full flex flex-col select-none overflow-hidden bg-galaxy-950/60 font-mono">
      {/* Top Toolbar */}
      <div className="px-6 py-3.5 border-b border-white/[0.08] bg-galaxy-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-sans font-bold text-white tracking-wide">
                Live Game Console & Diagnostics
              </h3>
              <span className="text-[10px] bg-white/[0.06] text-slate-400 px-2 py-0.2 rounded-full">
                {logs.length} entries
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-galaxy-950 border border-white/[0.1] text-xs text-slate-300 focus:outline-none font-sans"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warnings</option>
            <option value="ERROR">Errors</option>
          </select>

          {/* Action buttons */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-2 rounded-xl border transition-colors ${
              autoScroll ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
            }`}
            title="Toggle Auto Scroll"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyLogs}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition-colors"
            title="Copy Logs"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onClearLogs();
            }}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/[0.08] text-slate-400 hover:text-rose-300 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Smart Crash Diagnostics Banner */}
      {crashAnalysis && (
        <div className="m-4 p-4 rounded-2xl bg-gradient-to-r from-rose-950/70 via-red-950/60 to-purple-950/60 border border-rose-500/40 shadow-glow-sm flex items-start space-x-3.5 animate-in slide-in-from-top-2 font-sans">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-rose-200">Smart Crash Diagnostic:</span>
              <span className="font-bold text-xs text-white">{crashAnalysis.title}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {crashAnalysis.explanation}
            </p>
            <div className="mt-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl">
              💡 <span className="font-bold">Recommended Fix:</span> {crashAnalysis.suggestion}
            </div>
          </div>
        </div>
      )}

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 text-xs select-text">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 select-none font-sans">
            <Terminal className="w-8 h-8 opacity-40" />
            <p className="text-xs">No console logs to display. Launch an instance to view live output.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            let colorClass = 'text-slate-300';
            let badgeBg = 'bg-slate-800 text-slate-400';

            if (log.level === 'WARN') {
              colorClass = 'text-amber-300';
              badgeBg = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
            } else if (log.level === 'ERROR') {
              colorClass = 'text-rose-400 font-semibold';
              badgeBg = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
            } else if (log.level === 'INFO') {
              colorClass = 'text-slate-200';
              badgeBg = 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
            }

            return (
              <div key={log.id} className="flex items-start space-x-2.5 py-0.5 leading-relaxed hover:bg-white/[0.02] px-2 rounded">
                <span className="text-slate-500 text-[11px] flex-shrink-0 select-none">
                  {log.timestamp}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase select-none flex-shrink-0 ${badgeBg}`}>
                  {log.source || 'APP'}
                </span>
                <span className={`flex-1 break-all ${colorClass}`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
};
