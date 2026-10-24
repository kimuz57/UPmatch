import { Suspense, use } from "react";
import ChatRoomClient from "./ChatRoomClient";
import { Loader2 } from "lucide-react";

export const instant = false;

function ChatLoadingFallback() {
  return (
    <div className="min-h-screen bg-transparent text-slate-800 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-purple-100/80 shadow-xs h-18" />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-purple-600 font-bold text-sm">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span>กำลังเปิดห้องแชท...</span>
        </div>
      </main>
    </div>
  );
}

function ChatRoomContainer({ paramsPromise }) {
  const resolvedParams = use(paramsPromise);
  const targetEmail = resolvedParams?.id ? decodeURIComponent(resolvedParams.id) : "";
  return <ChatRoomClient targetEmail={targetEmail} />;
}

export default function ChatRoomPage({ params }) {
  return (
    <Suspense fallback={<ChatLoadingFallback />}>
      <ChatRoomContainer paramsPromise={params} />
    </Suspense>
  );
}
