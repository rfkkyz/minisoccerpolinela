import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from './ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] p-8 flex items-center justify-center bg-[var(--paper)]">
          <div className="max-w-md w-full bg-[var(--surface)] p-8 rounded-[24px] border border-rose-200 shadow-md text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[var(--danger)] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 stroke-[1.75]" />
            </div>

            <h2 className="font-sans font-bold text-xl text-[var(--ink)]">
              Terjadi Kesalahan Tampilan
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-[var(--ink-2)] leading-relaxed">
              Komponen mengalami gangguan teknis sementara. Data Anda tetap tersimpan dengan aman di sistem.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-4 p-3 bg-[var(--paper-2)] text-left rounded-lg text-[10px] font-mono text-rose-700 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="md"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={this.handleReload}
              >
                Muat Ulang
              </Button>
              <Button
                variant="accent"
                size="md"
                icon={<Home className="w-4 h-4" />}
                onClick={this.handleHome}
              >
                Beranda
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

