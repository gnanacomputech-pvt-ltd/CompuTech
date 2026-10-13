import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Catches render-time errors anywhere below it so a single bad component shows a
 * branded recovery screen instead of a blank white page.
 *
 * Must stay a class component: React only exposes error boundaries via
 * componentDidCatch / getDerivedStateFromError, which have no hook equivalent.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Surfaced in the browser console and picked up by Sentry's global handler
    // if a frontend DSN is ever configured. Kept deliberately simple so the
    // boundary itself can never throw.
    console.error('Unhandled render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7] px-4">
        <div className="max-w-md w-full text-center bg-white border border-[#E8E1D2] rounded-xl shadow-sm p-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#D4A72C]/15 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-[#B88918]" />
          </div>
          <h1 className="text-xl font-semibold text-[#252525] mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-[#6B6B6B] mb-6">
            An unexpected error stopped this page from loading. Reloading usually
            fixes it. If it keeps happening, please contact us at{' '}
            <a
              href="mailto:info@gnanacomputech.com"
              className="text-[#B88918] font-medium hover:underline"
            >
              info@gnanacomputech.com
            </a>
            .
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#D4A72C] hover:bg-[#B88918] text-[#17181A] shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4A72C] focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
              <span>Reload page</span>
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-transparent border-2 border-[#D4A72C] text-[#252525] hover:bg-[#D4A72C] hover:text-[#17181A] transition-all duration-200"
            >
              Go to homepage
            </a>
          </div>
        </div>
      </div>
    );
  }
}
