// Suspense fallback for ChannelsView. Server-safe: no directive, no hooks.
// Mirrors the two-card geometry of ChannelsView so the layout does not shift
// when the client island resolves.

const SIDEBAR_BAR_WIDTHS = ["w-3/4", "w-2/3", "w-5/6", "w-1/2", "w-3/5", "w-2/3"];
const MESSAGE_LINE_WIDTHS = ["w-3/4", "w-2/3", "w-1/2"];

const BAR = "animate-pulse rounded bg-zinc-200 dark:bg-white/10";

export default function ChannelsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 md:flex-row"
    >
      <span className="sr-only">Loading channels…</span>

      {/* Sidebar card */}
      <div
        aria-hidden="true"
        className="shrink-0 max-h-[25vh] overflow-y-auto rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900 md:max-h-none md:w-64"
      >
        <div className="flex flex-col gap-3">
          {SIDEBAR_BAR_WIDTHS.map((width, i) => (
            <div key={i} className={`h-4 ${width} ${BAR}`} />
          ))}
        </div>
      </div>

      {/* Pane card */}
      <div
        aria-hidden="true"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
      >
        <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
          <div className={`h-5 w-40 ${BAR}`} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-4">
          {MESSAGE_LINE_WIDTHS.map((width, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-white/10" />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`h-3 w-32 ${BAR}`} />
                <div className={`h-3 ${width} ${BAR}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
