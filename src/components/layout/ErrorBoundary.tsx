import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-gray-100 p-8"
          style={{ fontFamily: "'Vazirmatn', sans-serif" }}
        >
          <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              ⚠
            </div>
            <h1 className="mb-2 text-lg font-bold text-gray-800">
              خطایی رخ داد
            </h1>
            <p className="mb-1 text-sm text-gray-600">
              متأسفانه یک خطای غیرمنتظره در نمایش رزومه پیش آمد.
            </p>
            {this.state.error && (
              <p className="mb-4 rounded bg-gray-50 p-2 text-xs text-gray-400 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              بارگذاری مجدد صفحه
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}