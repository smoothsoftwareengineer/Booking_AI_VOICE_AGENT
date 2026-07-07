"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Voice UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
            <p className="text-sm text-[var(--danger)]">
              Something went wrong with the call UI. Refresh the page and try again.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
