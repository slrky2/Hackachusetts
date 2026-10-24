"use client";

/**
 * Slide-in drawer that appears when a user clicks on the map
 * to report a new civic issue at that location.
 */
interface Props {
  lat: number;
  lng: number;
  onClose: () => void;
  onSubmit: (data: unknown) => void; // CreateIssueInput
}

export default function ReportIssueDrawer({ lat, lng, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-zinc-900 shadow-xl p-6 z-50">
      <h2 className="text-lg font-semibold mb-2">Report Issue</h2>
      <p className="text-sm text-zinc-500 mb-4">
        Location: {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
      {/* TODO: render CreateIssueForm */}
      <button onClick={onClose} className="mt-4 text-sm underline text-zinc-500">
        Cancel
      </button>
    </div>
  );
}
