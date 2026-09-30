import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Uncaught Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem('hb_cached_events');
      localStorage.removeItem('hb_cached_villages');
      localStorage.removeItem('hb_cached_teams');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">
                ເກີດຂໍ້ຜິດພາດໃນລະບົບ (An error occurred)
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                ລະບົບກຳລັງປົກປ້ອງຂໍ້ມູນຂອງທ່ານ. ທ່ານສາມາດກົດໂຫຼດຄືນໃໝ່ເພື່ອສືບຕໍ່ໃຊ້ງານ.
              </p>
              {this.state.error?.message && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono text-left break-words max-h-32 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ໂຫຼດໜ້າຄືນໃໝ່ (Reload Page)</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>ລ້າງແຄຊ ແລະ ເຂົ້າສູ່ລະບົບໃໝ່ (Reset & Reload)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
