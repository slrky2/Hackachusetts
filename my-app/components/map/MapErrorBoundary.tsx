"use client";

import { Component, type ReactNode } from "react";

interface State {
  failed: boolean;
}

/**
 * Keeps a broken map (bad key, quota exceeded, network error) from taking
 * down the whole page. Shows a short message in the map's place instead.
 */
export default class MapErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Map failed to render:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div role="status" className="grid h-full place-items-center p-6 text-center text-sm text-zinc-500">
          The map couldn&apos;t load right now. The rest of the page still works.
        </div>
      );
    }
    return this.props.children;
  }
}
