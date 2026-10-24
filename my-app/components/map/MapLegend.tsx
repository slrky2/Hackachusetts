import { BOUNTY_COLOR, POST_COLOR, SEVERITY_COLORS, SEVERITY_LEVELS } from "@/lib/utils/severity";

/** Color key for map pins. */
export default function MapLegend({
  showPosts = true,
  showBounties = true,
}: {
  showPosts?: boolean;
  showBounties?: boolean;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-3 text-xs text-zinc-500" aria-label="Map legend">
      {SEVERITY_LEVELS.map((severity) => (
        <li key={severity} className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLORS[severity] }} />
          {severity}
        </li>
      ))}
      {showBounties && (
        <li className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: BOUNTY_COLOR }} />
          Bounty
        </li>
      )}
      {showPosts && (
        <li className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: POST_COLOR }} />
          Post
        </li>
      )}
    </ul>
  );
}
