// Interactive Google Maps view with civic issue pins
// import CivicMap from "@/components/map/CivicMap";

export default function MapPage() {
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-semibold mb-4">City Map</h1>
      <div className="flex-1 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100">
        {/* <CivicMap /> */}
        <p className="p-8 text-zinc-500">Map component — coming soon</p>
      </div>
    </div>
  );
}
