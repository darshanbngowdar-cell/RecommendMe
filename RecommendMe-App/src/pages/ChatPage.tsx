import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import { getAuthSession } from "@/services/authStorage";
import Sidebar from "@/components/layout/Sidebar";
import ChatHeader from "@/components/layout/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import InputBar from "@/components/chat/InputBar";
import StarterPrompts from "@/components/chat/StarterPrompts";
import { Sparkles } from "lucide-react";

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { initialQuery?: string } | undefined;
  const initialQuery = state?.initialQuery;

  const {
    sessions,
    activeSession,
    activeSessionId,
    isLoading,
    loadingPhase,
    error,
    isDemoMode,
    setActiveSessionId,
    createNewSession,
    sendMessage,
    submitRoundAnswers,
    deleteSession,
    chatModeEnabled,
    hasPendingRecommendation,
    resumePendingRecommendation,
  } = useChat({
    isAuthenticated: () => Boolean(getAuthSession()),
    onAuthRequired: () => {
      navigate("/login", { state: { returnTo: "/chat" } });
    },
  });

  // sidebarOpen: default true on desktop (≥1024px), false on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const hasUsedInitial = useRef(false);

  useEffect(() => {
    if (initialQuery && !hasUsedInitial.current) {
      hasUsedInitial.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery, sendMessage]);

  useEffect(() => {
    if (!hasPendingRecommendation) return;
    if (!getAuthSession()) return;
    resumePendingRecommendation();
  }, [hasPendingRecommendation, resumePendingRecommendation]);

  // Session loss warning
  useEffect(() => {
    if (sessions.length === 0) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessions.length]);

  // Close sidebar on mobile when resizing to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    /*
     * ROOT: full viewport, flex row, no overflow at this level.
     * Sidebar and main content share the full height side by side.
     */
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <Sidebar
        open={sidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main column: header + scroll area + input ─────────── */}
      {/*
       * flex-1 min-w-0: takes remaining space, never shrinks below 0.
       * flex flex-col: stacks header / message area / input bar.
       * overflow-hidden: clip at this boundary so inner areas scroll.
       */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">

        {/* Header — fixed height, never scrolls */}
        <ChatHeader
          title={activeSession?.title || "New Chat"}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNewChat={createNewSession}
          isDemoMode={isDemoMode}
          sessionCount={activeSession?.messages.length || 0}
          sidebarOpen={sidebarOpen}
        />

        {/* Demo banner */}
        {isDemoMode && (
          <div className="shrink-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-foreground font-medium">
              Preview mode — results are simulated to show how recommendations work.
            </span>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="shrink-0 mx-4 mt-3">
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          </div>
        )}

        {/*
         * Scrollable message area.
         * flex-1: fills all remaining height between header and input.
         * overflow-y-auto: this is the ONLY place that scrolls.
         * min-h-0: required for flex children to respect overflow.
         */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
          {/* Subtle background glow — purely decorative */}
          <div className="pointer-events-none absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/[0.06] blur-[150px] translate-x-1/2 -translate-y-1/2" />
          <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.05] blur-[120px] -translate-x-1/4 translate-y-1/4" />

          <div className="w-full max-w-5xl mx-auto h-full flex flex-col">
            {activeSession && activeSession.messages.length > 0 ? (
              <MessageList
                sessionId={activeSessionId}
                messages={activeSession.messages}
                isLoading={isLoading}
                loadingPhase={loadingPhase}
                onNewChat={createNewSession}
                onSendMessage={sendMessage}
                onSubmitAnswers={submitRoundAnswers}
                chatModeEnabled={chatModeEnabled}
              />
            ) : (
              <StarterPrompts onSelect={sendMessage} />
            )}
          </div>
        </div>

        {/* Input bar — fixed at bottom, never scrolls */}
        <div className="shrink-0">
          <InputBar onSend={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}