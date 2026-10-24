import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import ChannelsView from "@/components/channels/ChannelsView";
import ChannelsSkeleton from "@/components/channels/ChannelsSkeleton";

// Community channels page: server shell (gradient, header, main) around one
// client island. ChannelsView reads the ?channel= search param, so it sits in
// a Suspense boundary and the skeleton is prerendered as the fallback. This
// component reads no request data, so the route stays prerenderable.
export default function ChatbotPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50">
      <SiteHeader active="chat" />

      <main className="flex min-h-0 flex-1 overflow-hidden p-4 sm:p-6">
        <Suspense fallback={<ChannelsSkeleton />}>
          <ChannelsView />
        </Suspense>
      </main>
    </div>
  );
}
