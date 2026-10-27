import { Suspense, use } from "react";
import ChatRoomClient from "./ChatRoomClient";
import { Loader2 } from "lucide-react";

export const instant = false;

function ChatLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs h-16" />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-purple-900 font-bold text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-purple-800" />
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
