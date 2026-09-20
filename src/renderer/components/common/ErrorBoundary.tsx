import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, CheckCircle2 } from 'lucide-react';
import { sounds } from '../../services/soundEngine';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Galaxy Launcher ErrorBoundary caught an unhandled error:', error, errorInfo);
    try {
      sounds.playError();
    } catch {}
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    try {
      sounds.playClick();
    } catch {}
    window.location.reload();
  };

  private handleReset = () => {
    try {
      sounds.playClick();
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleCopyError = () => {
    const errorDetails = `Galaxy Launcher Error Report
Time: ${new Date().toISOString()}
Error: ${this.state.error?.name || 'Error'}: ${this.state.error?.message || 'Unknown'}

Stack:
${this.state.error?.stack || 'No stack trace'}

Component Stack:
${this.state.errorInfo?.componentStack || 'No component stack'}
`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 3000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#06070c] via-[#0d0f1a] to-[#121626] text-slate-100 select-none overflow-y-auto">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl w-full p-8 rounded-3xl bg-galaxy-900/90 border border-white/[0.12] backdrop-blur-2xl shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
            {/* Warning Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/30 to-amber-500/30 border border-rose-500/40 flex items-center justify-center shadow-glow-sm">
              <AlertTriangle className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>

            {/* Error Title & Subtitle */}
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono font-semibold">
                <span>RECOVERED ANOMALY</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight">
                Launcher Recovered Gracefully
              </h1>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                An unexpected interface error was prevented from crashing the window. You can reload the launcher or return to the main dashboard.
              </p>
            </div>

            {/* Error Message Box */}
            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/20 text-left font-mono text-xs text-rose-300 max-h-36 overflow-y-auto break-words select-text">
                <span className="font-bold text-rose-400">{this.state.error.name}: </span>
                {this.state.error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-display font-bold text-xs shadow-glow-md flex items-center justify-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                <span>Reload Launcher</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <Home className="w-4 h-4 text-cyan-400" />
                <span>Return to Home</span>
              </button>

              <button
                onClick={this.handleCopyError}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-200 font-mono text-xs flex items-center justify-center space-x-1.5 transition-colors"
                title="Copy Error Stack Trace"
              >
                {this.state.copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Trace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
