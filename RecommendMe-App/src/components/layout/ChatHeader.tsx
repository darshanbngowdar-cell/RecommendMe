import { Menu, Plus, Sparkles, MessageSquare, PanelLeftClose, PanelLeft } from "lucide-react";

interface ChatHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  isDemoMode?: boolean;
  sessionCount?: number;
  sidebarOpen?: boolean;
}

export default function ChatHeader({
  title,
  onToggleSidebar,
  onNewChat,
  isDemoMode,
  sessionCount = 0,
  sidebarOpen = false,
}: ChatHeaderProps) {
  return (
    /*
     * h-14: matches the sidebar header height exactly so they sit flush.
     * shrink-0: never compressed by flex parent.
     * sticky top-0 + z-10: stays above scrolling message content.
     * bg-background/95 + backdrop-blur: looks clean when messages scroll under it.
     */
    <header className="h-14 shrink-0 sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur-sm px-3 sm:px-4">

      {/* Left — toggle + title */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen
            ? <PanelLeftClose className="h-4.5 w-4.5" />
            : <PanelLeft className="h-4.5 w-4.5" />
          }
        </button>

        {/* Chat title row */}
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <h1 className="truncate text-sm font-medium text-foreground max-w-[180px] sm:max-w-xs md:max-w-sm lg:max-w-md">
            {title}
          </h1>

          {sessionCount > 0 && (
            <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {sessionCount} {sessionCount === 1 ? "msg" : "msgs"}
            </span>
          )}

          {isDemoMode && (
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-2.5 w-2.5" />
              Preview
            </span>
          )}
        </div>
      </div>

      {/* Right — new chat */}
      <button
        onClick={onNewChat}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="New chat"
        title="New chat"
      >
        <Plus className="h-4.5 w-4.5" />
      </button>
    </header>
  );
}